# Engagement AI

## Objetivo de la primera entrega

Construir un perfil inteligente privado a partir de acciones deportivas reales. Esta base permite
generar recomendaciones personalizadas, retos diarios, logros sugeridos, resumen semanal,
narrativas deportivas y notificaciones inteligentes.

No crea un feed nuevo ni muestra actividad privada a otros usuarios.

## Eventos soportados

- `POST_CREATED`
- `RECOMMENDATION_VIEWED`
- `PLAYER_CONNECTED`
- `PLAYER_DISMISSED`
- `MATCH_JOINED`
- `MATCH_COMPLETED`
- `SPORT_SELECTED`
- `DAILY_CHALLENGE_STARTED`
- `CHALLENGE_COMPLETED`
- `ACHIEVEMENT_SAVED`
- `SMART_NOTIFICATION_SAVED`
- `TOUR_NARRATIVE_SAVED`
- `ENGAGEMENT_EMBEDDING_REBUILT`
- `AI_RECOMMENDATION_GENERATED`
- `AI_RECOMMENDATION_OPENED`
- `AI_RECOMMENDATION_LIKED`
- `AI_RECOMMENDATION_DISMISSED`

## Privacidad

Los eventos guardan metadata estructurada. Para una publicacion se registra deporte, tipo,
longitud y presencia de imagen, pero nunca se copia el contenido completo.

La tabla `engagement_events` utiliza RLS para que cada usuario consulte e inserte unicamente sus
propios eventos. Los eventos historicos no pueden editarse desde el cliente.

## Endpoints

### `POST /api/v1/ai/recommend`

Genera recomendaciones personalizadas con Vertex AI usando un contexto seguro:

- perfil deportivo del usuario
- afinidades calculadas por eventos
- jugadores, partidos y canchas candidatas
- historial reciente de senales privadas

La respuesta incluye tarjetas principales, reto diario, logro sugerido, resumen semanal,
narrativa deportiva y borrador de notificacion inteligente.

Si Vertex AI responde con error de billing, permisos o cuota, el backend devuelve un fallback
deterministico basado en datos reales. Esto mantiene el MVP usable mientras se habilita billing.

La metadata incluye `experimentVariant` para pruebas A/B simples:

- `A_COMPATIBILITY`: prioriza compatibilidad deportiva.
- `B_EXPLORATION`: permite medir exploracion y contenido.

Los eventos de generacion, apertura, interes y descarte guardan la variante para calcular
open rate, like rate y dismiss rate por experimento.

Antes de devolver tarjetas al cliente, el backend reordena candidatos con senales privadas:

- recomendaciones marcadas como "me interesa"
- recomendaciones marcadas como "no me sirve"
- huella vectorial local de engagement

Esto permite que el ranking cambie por comportamiento real del usuario sin depender totalmente
de que Vertex AI este disponible.

El motor tambien calcula recomendaciones cross-sport. Para sugerir un deporte nuevo cruza:

- deportes practicados por usuarios parecidos
- partidos activos disponibles
- sedes reales bien valoradas

Asi la tarjeta "Prueba otro deporte" no sale de una lista fija, sino de senales del ecosistema.

### `POST /api/v1/engagement/events`

Registra una senal autenticada. `dedupeKey` permite evitar duplicados durante reintentos.

### `POST /api/v1/engagement/smart-notification`

Guarda un borrador de AI Coach como notificacion in-app real en la tabla `notifications`.
Se usa para alertas inteligentes y resumen semanal, sin depender todavia de FCM o email.

### `POST /api/v1/engagement/embedding/rebuild`

Reconstruye la huella vectorial privada del usuario en `engagement_embeddings`.
En el MVP usa un vector deterministico de 32 dimensiones basado en senales estructuradas.
Cuando Vertex Embeddings o pgvector esten listos, se puede reemplazar el proveedor sin cambiar
la pantalla.

### `GET /api/v1/engagement/analytics`

Devuelve metricas privadas del motor para el usuario autenticado:

- embudo de recomendaciones generadas, abiertas, liked y dismissed
- tasas de apertura, interes y descarte
- variante A/B actual del usuario
- rendimiento por variante A/B
- ultimos eventos privados

### `GET /api/v1/engagement/diagnostics`

Devuelve un diagnostico operativo sin exponer secretos. Verifica conteos por tabla del modulo,
estado basico de Vertex AI y siguiente accion recomendada para pruebas locales.

### `POST /api/v1/engagement/challenges`

Guarda un reto diario sugerido por AI Coach en `engagement_challenges`.

### `GET /api/v1/engagement/challenges`

Lista los ultimos retos diarios persistidos del usuario.

### `POST /api/v1/engagement/challenges/:challengeId/complete`

Marca como completado un reto persistente del usuario autenticado.

### `POST /api/v1/engagement/achievements`

Guarda un logro sugerido por AI Coach en `engagement_achievements`.

### `GET /api/v1/engagement/achievements`

Lista los ultimos logros sugeridos persistidos del usuario.

### `POST /api/v1/engagement/achievements/evaluate`

Evalua logros guardados contra senales reales del usuario. Puede marcar logros como `unlocked`
cuando detecta actividad suficiente, retos completados o interacciones recientes.

### `POST /api/v1/engagement/contents`

Guarda contenido personalizado generado por AI Coach. Actualmente cubre:

- `weekly_brief`: resumen semanal deportivo
- `tour_narrative`: narrativa deportiva por progreso/distritos

### `GET /api/v1/engagement/contents`

Lista los ultimos contenidos personalizados guardados del usuario.

### `GET /api/v1/engagement/profile`

Devuelve afinidades deportivas, conteos y tamano de muestra. Este resumen explicable sera la
entrada del modelo de embeddings.

## Prueba visual

La pantalla `/app/engagement` carga recomendaciones diarias desde
`engagement_recommendation_snapshots`. Si ya existe el paquete del dia, no llama a Vertex AI. Si
no existe, genera una sola vez, guarda el snapshot y lo reutiliza hasta la siguiente medianoche.

### `POST /api/v1/engagement/cron/daily-recommendations`

Endpoint interno para preparar paquetes diarios antes de que el usuario entre. Requiere el header
`x-cron-secret` con el valor de `CRON_SECRET`.

El job solo procesa:

- usuarios activos en los ultimos 2 dias
- usuarios recien creados en los ultimos 2 dias
- usuarios con onboarding completo o deportes preferidos
- usuarios que aun no tienen snapshot vigente del dia

Por defecto procesa maximo 50 usuarios por ejecucion para controlar consumo de tokens. Tambien
acepta `dryRun: true` para validar cuantos usuarios serian procesados sin llamar IA.

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/v1/engagement/cron/daily-recommendations \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "dryRun": true}'
```

Acciones visibles:

- guardar o completar reto diario
- guardar logro sugerido
- evaluar y desbloquear logros guardados
- guardar resumen semanal como contenido personalizado
- guardar alerta inteligente
- guardar narrativa deportiva
- consultar contenidos personalizados guardados
- marcar recomendaciones como "me interesa" o "no me sirve"
- actualizar la huella vectorial privada del usuario
- revisar metricas privadas del motor de engagement
- revisar diagnostico operativo de backend, tablas y Vertex AI

## Base de datos

La migracion `20260616_engagement_embeddings.sql` crea `engagement_embeddings` con:

- `user_id`
- `embedding_vector` como `double precision[]`
- `provider`
- `dimension`
- `metadata`
- timestamps de generacion y actualizacion

Se usa `double precision[]` para validar el flujo sin depender todavia de la extension `pgvector`.

La migracion `20260616_engagement_challenges_achievements.sql` crea:

- `engagement_challenges` para retos diarios guardados y completados
- `engagement_achievements` para logros sugeridos guardados

Ambas tablas tienen RLS para lectura del propietario y escritura desde backend/service role.

La migracion `20260616_engagement_contents.sql` crea:

- `engagement_contents` para resumen semanal y narrativa deportiva guardados

Tambien tiene RLS para lectura del propietario y escritura desde backend/service role.

La migracion `20260617_engagement_recommendation_snapshots.sql` crea:

- `engagement_recommendation_snapshots` para cachear el paquete diario de recomendaciones

Esto reduce latencia y consumo de tokens porque la web lee el snapshot en vez de generar IA en
cada visita.

## Siguiente entrega

Reemplazar la huella vectorial deterministica por embeddings reales mediante Vertex AI o un
proveedor local compatible, y almacenarlos con `pgvector` cuando la extension quede habilitada.
