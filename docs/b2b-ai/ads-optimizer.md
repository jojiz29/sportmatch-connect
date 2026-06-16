# Feature #21 — Ads Optimizer

## Resumen

El endpoint `POST /api/v1/ai/b2b/ads/optimize` genera **2-3 variantes de copy**
para un anuncio (emocional, racional, urgencia) usando Vertex AI, las evalúa
con un **bandit UCB1** sobre el CTR histórico del business, y recomienda la
mejor.

## Pipeline

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│ Carga datos│ →  │ LLM        │ →  │ UCB1       │ →  │ Ranking    │
│ del ad     │    │ rewriter   │    │ scoring    │    │ + lift     │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
  business_ads    3 variantes     score = mean +   recommendation
  del business    con JSON        exploration       = mejor score
```

## Algoritmo UCB1

**Upper Confidence Bound** balancea **explotación** (elegir la mejor variante
conocida) y **exploración** (probar variantes menos conocidas).

```
UCB1_i = meanReward_i + sqrt(2 × ln(N) / n_i)
```

Donde:
- `N` = total de "tiradas" del sistema (en nuestro caso: total de clics del business)
- `n_i` = "tiradas" de la variante `i` (simulado: `N/4`)
- `meanReward_i` = CTR predicho de la variante `i`

Como **no tenemos un bandit real corriendo** (no hay A/B tests activos),
simulamos:
- `n_i = N/4` para todas las variantes (asume exposición uniforme)
- `meanReward_i = businessCtr × style_coefficient[style]`

### Coeficientes por estilo

| Estilo | Coeficiente | Justificación |
|---|---|---|
| `emocional` | 1.15 | Engagement emocional suele ganar CTR en redes sociales |
| `racional` | 1.08 | Mejora CTR por claridad informativa, menor uplift |
| `urgencia` | 1.22 | Mayor lift inmediato, riesgo de quemar la marca a largo plazo |
| `original` | 1.00 | Baseline sin modificar |

**Nota:** estos coeficientes son heurísticos basados en benchmarks de marketing
digital. En un sistema real se aprenderían vía A/B tests históricos con datos
propios.

### Factor de exploración

Para no sobreponderar la exploración (que en simulación es aleatoria),
multiplicamos el bonus por `0.05`:

```ts
score = predictedCtr + 0.05 × sqrt(2 × ln(N) / n_i)
```

## LLM rewriter

### Prompt template (es)

```
Eres un copywriter deportivo experto en marketing B2C. Tu tarea es REESCRIBIR
un anuncio para una plataforma deportiva peruana (SportMatch).

TÍTULO ORIGINAL: """..."""
DESCRIPCIÓN ORIGINAL: """...""" (opcional)

ESTILO REQUERIDO: {emocional|racional|urgencia}
INSTRUCCIONES DE ESTILO:
  - emocional: PASIÓN, comunidad, experiencia...
  - racional: HECHOS, números, beneficios concretos...
  - urgencia: ESCASEZ, tiempo limitado...

REGLAS ESTRICTAS:
- Mantén el contexto deportivo del original.
- NO inventes información nueva.
- Máximo 80 caracteres en título, 200 en descripción.
- Tono peruano natural ("pichanga", "cancha", "fulbito" si aplica).
- Devuelve SOLO el JSON: {"title": "...", "description": "..."}
```

### Fallback sin LLM

Si Vertex AI falla (timeout, quota, etc.), el sistema no rompe: usa el título
original con sufijo del estilo y un texto genérico del styleInstructions:

```ts
title: `${originalAd.title} (${spec.style})`,
description: spec.styleInstructions
```

## Ranking y recomendación

Después de evaluar todas las variantes, se ordenan por `score` descendente.
La variante de mayor score es la `recommendation`. El `expectedLift` es la
diferencia entre el `predictedCtr` de la recomendada y el de la original (A).

```ts
expectedLift = max(0, winner.predictedCtr - original.predictedCtr)
```

## Ejemplo de output

```json
{
  "variants": [
    { "variantId": "B", "style": "emocional", "score": 0.1366, "predictedCtr": 0.092 },
    { "variantId": "D", "style": "urgencia",   "score": 0.1287, "predictedCtr": 0.0976 },
    { "variantId": "C", "style": "racional",   "score": 0.0922, "predictedCtr": 0.0864 },
    { "variantId": "A", "style": "original",   "score": 0,      "predictedCtr": 0.08 }
  ],
  "recommendation": "B",
  "expectedLift": 0.012,
  "currentCtr": 0.08,
  "narrative": "Cambia a la variante B con copy emocional. CTR predicho sube de 8.0% a 9.2%..."
}
```

## SHAP-style drivers

| Feature | Peso | Baseline |
|---|---|---|
| Estilo de copy (winner) | 0.40 | 0 |
| Lift sobre baseline | 0.30 | 0.02 |
| Objetivo (ctr/conversions) | 0.15 | 0.5 |
| Muestra acumulada | 0.15 | 0.5 |

`outputScale = 0.10` (10% lift máximo).

## Aplicar variante (UI)

El panel `AdsOptimizerPanel.tsx` permite aplicar una variante al anuncio
original con un botón "Aplicar". Esto delega en el callback `onApplyVariant`
que el componente padre (`IntelligenceDashboard`) puede implementar para
llamar al endpoint que persiste el cambio.

En el MVP, el callback se conecta con `useAdsStore.updateAd()` del módulo
existente `useAdsStore`.

## Supuestos y limitaciones

1. **No hay A/B testing real activo** — los coeficientes son heurísticos.
2. **Variantes generadas una vez** — no se itera contra la performance real.
3. **Lenguaje limitado a español** — el prompt está en español y el LLM
   tiende a generar jerga peruana.
4. **Máximo 3 variantes** — el spec permite hasta 3 por request.
5. **El LLM puede inventar números** — el prompt lo prohíbe explícitamente,
   pero se recomienda validación humana antes de publicar.

## Tests relevantes

- `server/src/ai/b2b/__tests__/ads-optimizer.service.spec.ts` (13 tests)
