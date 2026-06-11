# Algoritmo de compatibilidad de jugadores

Esta primera versión ordena las recomendaciones de matchmaking usando únicamente información que ya existe en `profiles`.

## Pesos

| Factor             | Peso |
| ------------------ | ---: |
| Cercanía           |  35% |
| Deporte compartido |  30% |
| Nivel similar      |  20% |
| Disponibilidad     |  10% |
| Trust Score        |   5% |

El resultado final siempre se limita al rango de `0` a `100`.

## Reglas actuales

- **Cercanía:** disminuye linealmente desde `100` hasta `0` entre 0 y 50 km. Si faltan coordenadas, compartir ciudad otorga `75`; vivir en ciudades distintas otorga `25`; no tener datos suficientes otorga `50`.
- **Deporte:** otorga `100` cuando ambos jugadores practican el deporte seleccionado y `0` cuando no lo comparten.
- **Nivel:** compara los niveles `Principiante`, `Intermedio`, `Avanzado` y `Elite`. También normaliza los niveles en inglés guardados dentro de `sports_matrix`.
- **Disponibilidad:** usa temporalmente `behavioral_intent.weekly_hours` como aproximación. Si falta para alguno de los jugadores, otorga el valor neutral `50`.
- **Trust Score:** utiliza directamente el valor del candidato, limitado al rango de `0` a `100`.

## Límites de esta historia

- No se modifican mapas ni datos de geolocalización.
- No se crean todavía desafíos, invitaciones ni conversaciones.
- Cuando exista un modelo de horarios detallado, debe reemplazar la aproximación basada en horas semanales.

La implementación se encuentra en `src/features/matchmaking/matchmakingScore.ts`.
