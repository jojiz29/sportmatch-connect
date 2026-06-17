# Feature #9 — Dynamic Pricing

## Resumen

El endpoint `POST /api/v1/ai/b2b/pricing` recomienda un precio dinámico para
una cancha/fecha/hora específica, basándose en la **ocupación histórica** y
**modificadores temporales** (hora pico, fin de semana).

No usamos librerías ML externas. La fórmula es una heurística determinista
documentada y testeable.

## Fórmula

```
recommendedPrice = baseline × finalMultiplier

donde:

baseline          = court.price_per_hour  (de la tabla `courts`)
finalMultiplier   = clamp(occupancyMult × peakMult × lowMult × weekendMult,
                          MIN_DISCOUNT, MAX_UPLIFT)
```

### Componente de ocupación (dominante)

```ts
if (occupancyRate > HIGH_OCCUPANCY_THRESHOLD) {
  intensity = (occupancyRate - 0.7) / (1.0 - 0.7)  // 0..1
  occupancyMult = 1.0 + (HIGH_OCCUPANCY_MULT - 1.0) × intensity
                  // ej: 1.0 + 0.25 × 0.5 = 1.125
} else if (occupancyRate < LOW_OCCUPANCY_THRESHOLD) {
  intensity = (0.3 - occupancyRate) / 0.3
  occupancyMult = 1.0 - (1.0 - LOW_OCCUPANCY_MULT) × intensity
                  // ej: 1.0 - 0.15 × 0.5 = 0.925
} else {
  occupancyMult = 1.0  // neutral
}
```

**Constantes:**
- `HIGH_OCCUPANCY_THRESHOLD = 0.7`
- `LOW_OCCUPANCY_THRESHOLD = 0.3`
- `HIGH_OCCUPANCY_MULT = 1.25` (sube hasta 25% en slots muy demandados)
- `LOW_OCCUPANCY_MULT = 0.85` (baja hasta 15% en slots vacíos)

### Componentes temporales (multiplicativos)

| Condición | Multiplicador |
|---|---|
| Hora pico (18h-21h) | × 1.10 |
| Hora valle (8h-11h) | × 0.95 |
| Fin de semana (sábado/domingo) | × 1.08 |

Se aplican en cascada, no se excluyen mutuamente. Un sábado 19h aplicaría
`× 1.10 × 1.08 = × 1.188` por concepto de tiempo.

### Hard caps (defensivos)

Para evitar recomendaciones absurdas por composición de multiplicadores:

```ts
finalMultiplier = max(1.0 - MAX_DISCOUNT, min(1.0 + MAX_UPLIFT, rawMult))
```

- `MAX_UPLIFT = 0.30` (nunca más de +30% del baseline)
- `MAX_DISCOUNT = 0.25` (nunca menos de -25% del baseline)

## Confianza

```ts
confidence = min(1.0, BASE_CONFIDENCE + totalSampleSize × CONFIDENCE_PER_BOOKING)
```

- `BASE_CONFIDENCE = 0.3` (cuando hay 0 datos)
- `CONFIDENCE_PER_BOOKING = 0.03`
- **Cap a 1.0** cuando hay ≥ 24 bookings observados.

Interpretación para la UI:
- `< 0.4` → recomendación con poca muestra, usar como referencia
- `0.4 - 0.7` → recomendación razonable
- `> 0.7` → recomendación confiable

## SHAP-style drivers

Cada predicción devuelve 5 drivers que explican la recomendación:

| Feature | Peso | Baseline | Dirección |
|---|---|---|---|
| Ocupación del slot | 0.45 | 0.5 | + |
| Hora pico (18-21h) | 0.20 | 0.25 | + |
| Fin de semana | 0.15 | 0.3 | + |
| Hora valle (8-11h) | 0.10 | 0.2 | - |
| Anticipación de reserva | 0.10 | 0.5 | - |

`contribution = (value - baseline) / max(|baseline|, ε) × weight × outputScale`

donde `outputScale = baseline × 0.3` (±30% del baseline en PEN).

## Supuestos y limitaciones

1. **El baseline es el precio actual** — no ajusta automáticamente por inflación
   ni por cambios manuales del business.
2. **No hay segmentación por tipo de cliente** — un mismo slot se ofrece al
   mismo precio a recurrentes y nuevos.
3. **Los días feriados se tratan como fin de semana** — no hay calendario
   específico (esto es un refinement futuro).
4. **Solo se usa la cancha específica** — no se considera demanda cruzada
   con canchas cercanas del mismo business.
5. **La anticipación** (días hasta el slot) tiene un efecto pequeño: reservas
   de último momento se cobran un poco más, reservas con mucha anticipación
   un poco menos.

## Casos edge

### Cancha sin reservas históricas

```ts
occupancyRate = 0  // para todas las horas
sampleSize = 0
confidence = 0.3  // base

// Resultado: baseline × 1.0 (sin cambio) con confidence muy baja
```

### Cancha con 100% de ocupación histórica

```ts
occupancyRate = 1.0
intensity = 1.0
occupancyMult = 1.0 + 0.25 × 1.0 = 1.25

// + hora pico → 1.25 × 1.10 = 1.375
// + fin de semana → 1.375 × 1.08 = 1.485
// Clamp → 1.30 (max uplift)
```

### Hora valle entre semana

```ts
occupancyRate = 0.2  // baja
intensity = (0.3 - 0.2) / 0.3 = 0.33
occupancyMult = 1.0 - 0.15 × 0.33 = 0.95

// + hora valle → 0.95 × 0.95 = 0.9025
// Sin weekend (martes) → 0.9025
// Sin clamp (0.9025 > 0.75) → 0.9025
// = -10% del baseline
```

## Tests relevantes

- `server/src/ai/b2b/__tests__/pricing-engine.service.spec.ts` (19 tests)
- `server/src/ai/b2b/__tests__/data-pipeline.service.spec.ts` (11 tests)
