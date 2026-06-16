# SHAP-style Explainability — Disclaimer académico

## ⚠️ Disclaimer importante

**Este módulo NO usa la librería SHAP (SHapley Additive exPlanations) oficial
de Python.** Las contribuciones que se muestran en la UI como "drivers SHAP"
son **contribuciones marginales calculadas en TypeScript** respecto a un
baseline, no valores de Shapley computados con la fórmula exacta.

Si en una presentación académica os preguntan por la lib SHAP, **sed honestos**:
explicad que es explicabilidad simulada con un disclaimer explícito en la UI
(visible para el usuario) y en la documentación.

## Por qué no usamos SHAP real

### Opción 1: SHAP oficial en Python
- ❌ Requiere Python como dependencia del backend (ahora es TypeScript puro).
- ❌ El cálculo es pesado (N! permutaciones para features categóricas).
- ❌ Para un sprint de 7 días, era overengineering injustificable.

### Opción 2: Puerto JavaScript de SHAP (`shap-js`)
- ❌ No existe un puerto oficial y mantenido.
- ❌ La librería `shap` de Python es la referencia; los puertos no oficiales
  tienen años sin mantenimiento.

### Opción 3 (elegida): Contribuciones marginales con disclaimer
- ✅ Implementable en TypeScript puro, sin dependencias nuevas.
- ✅ Tests unitarios simples y rápidos.
- ✅ Visualmente equivalente al usuario final.
- ✅ Honesto académicamente: el disclaimer está visible en la UI y en los docs.

## Fórmula implementada

Para cada feature:

```ts
contribution = ((value - baseline) / max(|baseline|, ε))
             × positiveDirection
             × weight
             × outputScale
```

donde:
- `value` = valor crudo observado para esta feature
- `baseline` = valor típico (media histórica del modelo)
- `positiveDirection` = `+1` si valor alto sube la predicción, `-1` si baja
- `weight` = peso de la feature en el modelo (0-1)
- `outputScale` = escala del output (ej: 15 PEN para pricing, 0.5 para churn score)

**Las contributions se ordenan por magnitud descendente** antes de devolverse
al cliente.

## Diferencia con SHAP real

| Aspecto | SHAP real | Esta implementación |
|---|---|---|
| Fundamento teórico | Teoría de juegos (Shapley values) | Desviación marginal heurística |
| Garantías | Eficiencia, simetría, dummy | Ninguna formal |
| Tiempo de cómputo | O(2^N) en N features | O(N) |
| Valores que satisfacen | Suma contributions = predicción - base | Aproximado, no exacto |
| Librería | `shap` (Python) | Custom TypeScript |

## ¿Por qué el disclaimer es importante?

1. **Transparencia académica** — un revisor que pregunte "¿usáis la lib SHAP?"
   debe poder ver inmediatamente que la respuesta es "no, es explicabilidad
   simulada con disclaimer".
2. **Defensibilidad del proyecto** — si el dashboard dice "SHAP values",
   un evaluador puede asumir que se usa la lib original. El disclaimer
   previene esa confusión.
3. **Coherencia con el principio "no hardcoded"** — el resto del proyecto
   es muy estricto con no inventar respuestas (ver `textApi.test.ts` con
   anti-mock safeguards). Sería inconsistente llamar "SHAP" a algo que
   no lo es.

## Dónde aparece el disclaimer

1. **En la UI** — `ShapExplanation.tsx` muestra el texto:
   > "Drivers SHAP-style (explicabilidad simulada, no SHAP oficial)"

2. **En el código** — `ShapExplainerService.ts` tiene un bloque de
   comentarios al inicio del archivo.

3. **En este documento** — el disclaimer principal está aquí.

4. **En la respuesta del backend** — no se incluye en el JSON para no
   contaminar la respuesta, pero está documentado en el `PricingResponseDto`
   y `ChurnPredictResponseDto` via JSDoc.

## Cuando migrar a SHAP real

Si en el futuro se quiere usar la lib oficial, los pasos serían:

1. Agregar un servicio Python separado (FastAPI o similar) que use `shap`.
2. El servicio NestJS haría HTTP calls al servicio Python.
3. Reemplazar la implementación de `ShapExplainerService` por el cliente.
4. Quitar el disclaimer de la UI.
5. Validar con datos sintéticos que las contributions satisfacen
   `Σ contributions = predicción - baseline` (propiedad de eficiencia de Shapley).

**Esfuerzo estimado:** 2-3 días de un desarrollador Python + TypeScript.

## Tests relevantes

- `server/src/ai/b2b/__tests__/pricing-engine.service.spec.ts`
  - Test "contribución total está en rango plausible vs delta absoluto del precio"
  - Relaja la aserción a un ratio (no igualdad) porque sabemos que el modelo
    no es exacto.

## Referencias académicas

Si en una presentación alguien pregunta por la base teórica, se puede
referenciar:

- Lundberg, S. M., & Lee, S. I. (2017). **A unified approach to interpreting
  model predictions.** Advances in Neural Information Processing Systems 30.
- Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). **"Why should I trust you?":
  Explaining the predictions of any classifier.** KDD '16.

Y aclarar que la implementación actual es una **aproximación pedagógica** de
esos principios, no una aplicación formal.
