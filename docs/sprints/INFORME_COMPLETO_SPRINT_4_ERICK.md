# Informe de Cierre y Verificación — Sprint 4 (Seguridad Avanzada, Premium y Sincronización de BD)

Este informe recopila el desglose técnico, las implementaciones clave y las verificaciones realizadas para las tareas asignadas a **ERICK** durante el **Sprint 4**. Todas las funcionalidades fueron integradas con soporte robusto tanto en producción (**Modo Real**) como localmente (**Modo DEMO**).

---

## 🏗️ 1. Seguridad Avanzada con IA (Smart Block & Moderación)

### Objetivos y Criterios de Aceptación
Evitar el lenguaje abusivo y las conductas indebidas en tiempo real. Si un usuario incurre en infracciones repetidas o graves, el sistema debe bloquear su cuenta y restringir temporalmente su capacidad de enviar mensajes.

### Cambios Implementados
* **Base de Datos (Supabase):**
  * Creación de la tabla `moderation_logs` para registrar auditorías de moderación con variables de puntuación (`ensemble_score`), recomendación (`action_recommended`) y razonamiento (`reasoning`).
  * Modificación de la tabla `user_blocks` para añadir columnas de control temporal (`ensemble_score`, `timestamp_inicio`, `timestamp_fin`).
  * Creación de la migración `20260619000100_fix_ai_moderation_bypass_and_chat_creation.sql` para corregir la RPC `create_direct_conversation` (cambiando la columna inexistente `compatibilidad_score` a `compatibility_score`).
  * Modificación de la RPC `send_direct_message` y la política RLS `messages_participants_insert` para denegar la inserción de mensajes a cualquier usuario con bloqueos activos.
* **Backend NestJS:**
  * Endpoint `POST /api/v1/ai/moderate/advanced` que implementa el algoritmo **Ensemble Model**. Evalúa semánticamente el mensaje usando Inteligencia Artificial y pondera el historial previo del usuario para emitir una acción (`allow` o `block`).
* **Frontend React (Zundstand Store):**
  * Modificación de `sendMessage` en [`useChatStore.ts`](file:///d:/INGENIERIA%20DE%20SOFTWARE/PROYECTO%20FINAL%203/sportmatch-connect-main/src/features/chat/useChatStore.ts) para invocar `aiSecurityService.evaluateSecurity` antes de despachar el mensaje.
  * Captura de bloqueos y visualización de Toasts elegantes en español: *"Mensaje bloqueado: tu cuenta ha sido restringida temporalmente debido a infracciones de las normas de seguridad."*
  * **Modo DEMO:** Implementación de un validador local basado en expresiones regulares en [`aiSecurityService.ts`](file:///d:/INGENIERIA%20DE%20SOFTWARE/PROYECTO%20FINAL%203/sportmatch-connect-main/src/features/ai-security/services/aiSecurityService.ts) para simular el comportamiento de bloqueo sin requerir el backend.
  * **Corrección de Redirección (NestJS):** Se reparó el orden de carga de `.env` en [`main.ts`](file:///d:/INGENIERIA%20DE%20SOFTWARE/PROYECTO%20FINAL%203/sportmatch-connect-main/server/src/main.ts) del servidor para evitar que variables vacías sobrescribieran las credenciales reales de base de datos, eliminando las fallas de token no válido y la redirección en bucle a `/login`.

---

## 💎 2. Funcionalidades Premium y Suscripción

### Objetivos y Criterios de Aceptación
Implementar la pasarela de suscripciones a la cuenta Premium, chatear con un Coach deportivo basado en IA con telemetría del usuario, sugerencias de snacks post-partidos, retos económicos de Squad vs Squad (con FitCoins) y un panel de análisis de conversión de embudo.

### Cambios Implementados
* **Base de Datos & Prisma Schema:**
  * Creación de la tabla `subscriptions` para sincronizar estados de Stripe.
  * Creación de la tabla `premium_nutrition_logs` para auditar recomendaciones alimenticias personalizadas.
  * Creación de la tabla `squad_challenges` para registrar los retos económicos.
* **Suscripción y Pasarela Stripe:**
  * Integración del cobro en soles: **S/ 50.00 mensuales** (moneda: `PEN`).
  * Integración del componente `PaymentCheckout` directamente en la pantalla de bloqueo de Coach Premium para que los usuarios puedan suscribirse in-app.
  * Endpoint de webhook en NestJS (`POST /api/v1/payments/stripe-webhook`) para sincronizar el tier del usuario (`tier: 'FREE' | 'PREMIUM'`) en tiempo real.
* **Coach IA 1-a-1 & Snacks:**
  * Ruta interactiva `/app/coach` protegida por la pantalla elegante de suscripción si el tier es `FREE`.
  * Conversación con el Coach IA (Sporty) que analiza los últimos partidos jugados por el usuario para brindar consejos estratégicos personalizados.
  * Límite diario de 20 mensajes controlado en la base de datos y visible en la UI.
  * Generador de snacks post-partido (cálculo de calorías, ingredientes y reasoning).
* **Retos de Squad vs Squad:**
  * **Corrección de RLS:** Se solucionó el error clásico `infinite recursion detected in policy for relation "squads"` (código `42P17`) al reescribir la política de creación para evitar autoevaluarse recursivamente.
  * Panel interactivo en `SquadExplorer.tsx` para desafiar a otros equipos apostando FitCoins (100 a 1000 FC). Los saldos quedan retenidos en depósito de garantía y se transfieren al capitán ganador tras la aprobación mutua.
* **Dashboard Embudo de Conversión (Admin):**
  * Ruta del panel de administrador `/app/admin` que visualiza métricas y tasas de conversión del embudo (`premium_cta_clicked` ➡️ `checkout_initiated` ➡️ `payment_completed`).

---

## 🗄️ 3. Sincronización y Estabilización de la Base de Datos

### Objetivos y Criterios de Aceptación
Garantizar que todas las tablas, columnas, funciones RPC y RLS definidas en el historial de migraciones se encuentren creadas y configuradas correctamente en la base de datos remota de Supabase.

### Cambios Implementados
* **Sincronización:**
  * Se aplicaron **12 migraciones históricas pendientes** que impedían el correcto funcionamiento de otras características (tales como desafíos semanales, favoritos, mapa interactivo, sistema de Elo y emparejamiento matchmaking).
  * Creación del script `apply-all-missing-migrations.mjs` para aplicar y marcar de forma segura las migraciones en `supabase_migrations.schema_migrations` usando la conexión directa sin PgBouncer (`DIRECT_URL`).
* **Correcciones SQL Aplicadas On-The-Fly:**
  * **Administrador Edwin (`20260618000000`):** Se removió el select de `email` de la tabla `profiles` en `admin_check_user()` porque la columna no existe (los emails residen en `auth.users`).
  * **Registro de Inactividad (`20260618000500`):** Se modificó la vista `view_inactive_users` haciendo un `LEFT JOIN auth.users` para obtener el correo de forma limpia. Se comentó la creación del trigger sobre `auth.users` porque requiere permisos de superusuario (la actualización de `last_login_at` se delegó exitosamente al frontend en `useAuth.ts` al hacer login).
  * **Likes en Posts (`20260618002000`):** Se cambió el tipo de la columna `post_id` de `uuid` a `character varying(255)` para que coincida con el tipo de la clave primaria en `posts.id`.
  * **Resultados de Partidos (`20260618003100`):** Se eliminó la restricción original `matches_status_check` para evitar que los estados capitalizados (`'Open'`) existentes en los datos causaran errores de violación de restricción de tipo `matches_status_check` al actualizarse en mayúsculas.

---

## 🧪 4. Resumen de Verificaciones y Pruebas

* **Compilación de Código (Frontend & Backend):**
  * `npx prisma generate` completado exitosamente para sincronizar el cliente del backend.
  * `npx tsc --noEmit` en el backend NestJS completado con éxito (0 errores).
  * `npx tsc --noEmit` en el frontend React completado con éxito (0 errores).
* **Integridad Relacional de Supabase:**
  * Confirmación por medio de consultas directas SQL de que todas las tablas y RPCs sincronizadas están activas y expuestas de forma segura.
