# Feature #23 — Churn Predictor

## Resumen

El endpoint `POST /api/v1/ai/b2b/churn/predict` predice el **riesgo de churn**
de un negocio en una ventana de 7-90 días, basándose en un modelo **RFM-lite**
(Recency, Frequency, Monetary) adaptado a B2B + engagement de usage_metrics.

Score 0-1, donde **1 = máximo riesgo de churn**.

## Modelo RFM-lite

El modelo RFM tradicional mide comportamiento de compra del cliente. Para
B2B adaptado a SportMatch, lo redefinimos:

| Componente | RFM clásico | SportMatch B2B |
|---|---|---|
| **Recency** (R) | Días desde última compra | Días desde último anuncio creado |
| **Frequency** (F) | Frecuencia de compras | Cantidad de anuncios activos |
| **Monetary** (M) | Valor monetario gastado | Revenue de bookings (S/ total_cobrado) |
| **Engagement** (E) | (no tradicional) | Interacciones de usage_metrics |

### Fórmula

```ts
churnScore = recency × 0.40
           + frequency × 0.25
           + monetary × 0.20
           + engagement × 0.15
```

Pesos suman 1.0. La recencia es el componente dominante (un negocio que no
publica hace 30 días está mucho más cerca del churn que uno con poco revenue).

### Componente Recency (peso 0.40)

```ts
if (days === Infinity) return 0.9;       // sin datos = riesgo alto
if (days <= 1) return 0.05;               // muy reciente
if (days >= lookbackDays) return 1.0;    // muy antiguo
return min(1, log10(days + 1) / log10(lookbackDays + 1));  // log growth
```

**Interpretación:**
- 0 días → 0.05 (engagement altísimo)
- 7 días → 0.50
- 14 días → 0.66
- 30 días → 0.85

### Componente Frequency (peso 0.25)

```ts
expectedMin = (lookbackDays / 30) × 3   // 3 ads mínimo por mes
if (activeAds >= expectedMin) return 0.1;
if (activeAds === 0) return 1.0;
return max(0.1, 1 - activeAds / expectedMin);
```

**Interpretación** (con lookbackDays=30, expectedMin=3):
- 3+ ads → 0.1 (frecuencia saludable)
- 1 ad → 0.67
- 0 ads → 1.0

### Componente Monetary (peso 0.20)

```ts
if (revenue >= 500) return 0.1;          // umbral mínimo
if (revenue === 0) return 1.0;
return max(0.1, 1 - revenue / 500);
```

**Interpretación:**
- S/ 500+ → 0.1 (revenue saludable)
- S/ 250 → 0.6
- S/ 0 → 1.0

### Componente Engagement (peso 0.15)

```ts
total = profileViews + adViews + adClicks + mapPinClicks
expected = lookbackDays  // 1 vista/día esperado
if (total >= expected) return 0.1;
if (total === 0) return 1.0;
return max(0.1, 1 - total / expected);
```

**Nota:** el booking (`venue_booking`) está excluido del engagement porque
el modelo de pricing ya captura el revenue directamente.

## Umbrales de RiskLevel

```ts
if (score < 0.40) return "low";
if (score < 0.70) return "medium";
return "high";
```

| RiskLevel | Score | Color UI | Acción esperada |
|---|---|---|---|
| `low` | 0.00 - 0.39 | emerald | Mantener estrategia actual |
| `medium` | 0.40 - 0.69 | warning | Contactar proactivamente |
| `high` | 0.70 - 1.00 | red | Activar campaña de retención |

## Factores explicativos

Además del score, el predictor devuelve una lista de `ChurnFactor` con
`severity` y `suggestedAction` accionable. Los factores se generan
**rule-based**: cada componente que supera un umbral genera un factor.

```ts
if (recency > 0.5) {
  factors.push({
    name: `Sin actividad hace ${days} días`,
    severity: recency,
    suggestedAction: "Publicar un anuncio nuevo esta semana..."
  });
}
// ... idem para frequency, monetary, engagement
```

Los factores se ordenan por `severity` descendente y se devuelven con la
narrative del LLM en el response.

## SHAP-style drivers

| Feature | Peso | Baseline |
|---|---|---|
| Recencia (días desde última actividad) | 0.40 | 7 |
| Frecuencia de publicaciones | 0.25 | 0.3 |
| Revenue (bookings) | 0.20 | 0.3 |
| Engagement de usuarios | 0.15 | 0.3 |

`outputScale = 0.50` (output del score es 0-1).

## Cold start

Si el business no tiene datos (recién creado), el predictor:
- `recency` retorna 0.9 (asume riesgo alto por falta de data)
- `monetary` retorna 0.5 (neutral)
- `engagement` retorna 1.0 (cero interacciones)
- `churnScore` ≈ 0.55 → riskLevel = `medium`

Esto **no es un bug** — es la señal correcta: "no sabemos nada sobre este
business, trátalo como medium risk hasta tener más datos".

## Falsos positivos y falsos negativos

### Falsos positivos (score alto pero no es churn)

- **Negocios estacionales**: canchas de playa con alta actividad en verano
  que desaparecen en invierno. El modelo no distingue estacionalidad.
- **Negocios con ventas offline fuertes**: si todo su revenue es offline
  (no pasa por SportMatch), monetary siempre será 0.

**Mitigación:** revisar manualmente los negocios con `riskLevel="high"` antes
de tomar acciones de retención agresivas.

### Falsos negativos (score bajo pero hay churn real)

- **Engagement por bots**: si las usage_metrics incluyen eventos automatizados
  (no de usuarios reales), inflan el engagement artificialmente.
- **Cambio de propietario**: un business que cambia de dueño mantiene sus
  métricas históricas pero el comportamiento nuevo es distinto.

**Mitigación:** cruzar con `app.matchmaking.matchmakingScore` y revisar la
actividad real en `bookings`.

## Supuestos y limitaciones

1. **`business_ads` no está en Prisma** — el `data-pipeline.service.ts` usa
   `$queryRaw` con fallback graceful si la tabla no existe.
2. **`usage_metrics` requiere la migración 20260616** — sin ella, engagement
   siempre es 0.
3. **El revenue viene de `bookings.total_cobrado`** — si la columna está NULL
   o no existe, monetary score = 0.5 (neutral).
4. **No hay distinción entre churn temporal y permanente** — el modelo no
   puede saber si el business volverá en 3 meses.
5. **El score es estático** — no es una predicción temporal, es un snapshot
   del estado actual.

## Tests relevantes

- `server/src/ai/b2b/__tests__/churn-predictor.service.spec.ts` (12 tests)
