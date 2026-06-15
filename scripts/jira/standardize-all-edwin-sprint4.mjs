// ============================================================
// scripts/standardize-all-edwin-sprint4.mjs
// Estandariza TODOS los 32 tickets legacy de Edwin en Sprint 4
// (SCRUM-226 a SCRUM-257) con el formato ADF completo:
//   📋 Contexto + 👤 User Story + ✅ Criterios + 🔧 Notas + 🔗 Referencias
//
// Acciones adicionales:
//   - Tickets IMPLEMENTED → título limpio + descripción ADF + transición a "Listo" (Finalizada)
//   - Tickets PARTIALLY   → título limpio + descripción ADF + label "partial-implementation"
//   - Tickets NOT_IMPLEMENTED → título limpio + descripción ADF (queda en backlog)
//   - Normaliza títulos que empiezan con "US:" o "Canchas:" / "Wallet:" / "Gamificación:"
// ============================================================

import fs from "fs";
import path from "path";

const env = {};
fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p
        .slice(1)
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");
    }
  });
const auth =
  "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

async function api(endpoint, options = {}) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 250)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ------------------------------------------------------------
// Definición de los 32 tickets legacy de Edwin
// Cada ticket: { newSummary, context, userStory, criteria, technical, references, action }
// action: "DONE" | "PARTIAL" | "OPEN"
// ------------------------------------------------------------
const TICKETS = {
  "SCRUM-226": {
    newSummary: "Desbloquear insignias deportivas al alcanzar logros específicos",
    context:
      "Los usuarios completan actividades deportivas pero no tienen una forma visible de reconocer sus logros, lo que reduce la motivación y la percepción de progreso en la plataforma.",
    userStory:
      "Como usuario activo en SportMatch, quiero desbloquear insignias (badges) por logros deportivos específicos, para sentir mi progreso y tener reconocimiento visible en mi perfil.",
    criteria: [
      "Catálogo de al menos 12 insignias: Jugador Novato, Jugador Regular, Veterano, Canchero, Padelero, Futbolero, Maratonista, FitCoins Master, Racha de 7, Top 10, 100 Matches, Conector Social.",
      "Trigger automático al alcanzar el hito (matches_played, trust_score, fitcoins_balance).",
      "Visualización en `src/components/BadgeEngine.tsx` con íconos Lucide y gradiente del tema.",
      "Persistencia en tabla `user_achievements` con RLS habilitado.",
      "Notificación al desbloquear una insignia nueva.",
    ],
    technical:
      "Componente `BadgeEngine` evalúa `checkUnlock(achievementId, userStats)` por cada badge. Tabla `user_achievements(user_id, achievement_id, unlocked_at)` con trigger INSERT desde el backend NestJS al alcanzar el hito.",
    references: [
      "Código: `src/components/BadgeEngine.tsx`, `src/routes/app.profile.index.tsx`, `app.profile.$userId.tsx`.",
      "DB: `supabase/migrations/20260603_wallet_transactions_trigger_fix.sql`.",
    ],
    action: "DONE",
  },
  "SCRUM-227": {
    newSummary: "Mostrar tabla de ranking global de FitCoins",
    context:
      "Los usuarios acumulan FitCoins pero no pueden comparar su progreso con la comunidad, lo que limita la motivación competitiva.",
    userStory:
      "Como usuario activo, quiero ver mi posición en el ranking global de FitCoins, para competir amistosamente con otros jugadores y motivarme a seguir jugando.",
    criteria: [
      "Endpoint `GET /api/v1/users/leaderboard` que retorna top 100 usuarios con FitCoins.",
      "UI en la sección Wallet (`app.wallet.index.tsx`) con mi posición destacada.",
      "Filtros: global, por distrito, por deporte favorito.",
      "Actualización en tiempo real cuando un amigo sube en el ranking.",
      "Privacidad: usuarios pueden ocultar su posición.",
    ],
    technical:
      "Query SQL con `ORDER BY fitcoins_balance DESC LIMIT 100`. Cache de 5 min con React Query.",
    references: [
      "Código: `server/src/users/users.controller.ts:21`, `src/routes/app.wallet.index.tsx`.",
      "i18n: `src/shared/i18n/locales/es.json:116` (key `wallet.ranking`).",
    ],
    action: "DONE",
  },
  "SCRUM-228": {
    newSummary: "Completar desafíos semanales para ganar FitCoins extra",
    context:
      "El sistema de desafíos actuales usa valores hardcoded y no refleja la actividad real del usuario, lo que reduce la motivación.",
    userStory:
      "Como usuario activo, quiero participar en desafíos semanales deportivos, para ganar FitCoins extra y mantener la motivación constante durante la semana.",
    criteria: [
      "Servicio `weeklyChallengeService` que genera 3 desafíos nuevos cada lunes 00:00.",
      "Progresión basada en eventos reales (partidos jugados, canchas reservadas, km corridos).",
      "Botón 'Reclamar' solo si la barra de progreso está al 100%.",
      "Recompensa en FitCoins acreditada vía RPC `claim_weekly_challenge`.",
      "Historial de desafíos completados visible en Wallet.",
    ],
    technical:
      "Reemplazar los 3 retos hardcoded en `useWalletStore.initWallet()` (ch1, ch2, ch3) por una tabla `weekly_challenges(id, user_id, type, target, current, reward, expires_at)`. Edge Function `generate-weekly-challenges` corre lunes 00:00.",
    references: [
      "Código actual (parcial): `src/features/wallet/useWalletStore.ts:148`.",
      "Tests: `src/features/wallet/__tests__/wallet.test.ts`.",
    ],
    action: "PARTIAL",
  },
  "SCRUM-229": {
    newSummary: "Mostrar indicador de nivel de experiencia (XP) y progreso al siguiente nivel",
    context:
      "El campo `level` actual representa skill (Amateur/Intermediate/Advanced/Pro) pero no hay un sistema progresivo de XP que motive la mejora continua.",
    userStory:
      "Como usuario, quiero ver mi nivel de experiencia (XP) acumulado y cuánto me falta para subir al siguiente nivel, para tener un objetivo tangible de progreso.",
    criteria: [
      "Tabla `user_xp(user_id, total_xp, current_level, xp_to_next_level)`.",
      "Componente `<XpBar>` con animación de progreso al ganar XP.",
      "Cálculo: XP por partido jugado, por check-in, por reserva completada.",
      "Niveles: 1-10 con thresholds crecientes (100, 250, 500, 1000, 2000, etc.).",
      "Visualización en perfil y header del AppShell.",
    ],
    technical:
      "Backend: tabla `user_xp` con trigger INSERT en `match_participants.joined_at`. Frontend: componente `<XpBar current={xp} max={xpToNext} level={level} />` en `src/components/` y `AppShell.tsx`.",
    references: ["Nuevo módulo. Schema: añadir `user_xp` con RLS."],
    action: "OPEN",
  },
  "SCRUM-230": {
    newSummary: "Mostrar alerta visual y notificación al subir de nivel de XP",
    context:
      "Cuando un usuario sube de nivel, la experiencia actual no se siente celebratoria ni memorable.",
    userStory:
      "Como usuario, quiero recibir una notificación especial y animación cuando subo de nivel, para celebrar mi progreso deportivo y compartir el logro con mis amigos.",
    criteria: [
      "Modal `<LevelUpModal>` con confetti animation y mensaje personalizado.",
      "Sonido corto opcional (toggle en configuración).",
      "Push notification si la app está en background.",
      "Auto-dismiss a los 8 segundos o al hacer click.",
      "Botón 'Compartir' para publicar el logro (integra SCRUM-234).",
    ],
    technical:
      "Trigger en NestJS al detectar subida de nivel (XP > threshold). Mostrar `<LevelUpModal>` desde un store global `useLevelUpStore` con framer-motion confetti.",
    references: ["Relacionado con SCRUM-229 (XpBar) y SCRUM-234 (Share API)."],
    action: "OPEN",
  },
  "SCRUM-231": {
    newSummary: "Canjear FitCoins por equipamiento deportivo en el marketplace",
    context:
      "Los FitCoins son abstractos sin un uso tangible; los usuarios necesitan un marketplace para gastarlos y obtener valor real.",
    userStory:
      "Como usuario, quiero canjear mis FitCoins por descuentos en equipamiento deportivo, para obtener valor tangible por mi actividad en la plataforma.",
    criteria: [
      "Sección Marketplace en Wallet con catálogo de productos B2B.",
      "Modal de confirmación con desglose: FitCoins a usar, equivalente en soles/pesos, descuento aplicado.",
      "Validación de saldo antes de confirmar el canje.",
      "RPC `redeem_reward` que descuenta FitCoins y registra la transacción.",
      "Notificación push al completar el canje.",
    ],
    technical:
      "RPC `redeem_reward(user_id, item_id, amount)` que valida saldo, inserta en `wallet_transactions` (type: SPEND), y descuenta `profiles.fitcoins_balance`.",
    references: [
      "Código: `useWalletStore.redeem()`, `services/walletService.redeemReward()`.",
      "UI: `src/routes/app.wallet.index.tsx:418+`, modal de confirmación línea 511.",
    ],
    action: "DONE",
  },
  "SCRUM-232": {
    newSummary: "Publicar ofertas exclusivas para usuarios como patrocinador",
    context:
      "Las marcas y patrocinadores necesitan un canal directo para llegar a la comunidad deportiva de SportMatch.",
    userStory:
      "Como empresa patrocinadora, quiero publicar ofertas exclusivas para usuarios de SportMatch, para aumentar mi visibilidad y engagement con la comunidad deportiva.",
    criteria: [
      "Formulario de creación de oferta con título, descripción, imagen, fecha de expiración.",
      "Campo `is_sponsored: true` marca la oferta como destacada.",
      "Las ofertas patrocinadas aparecen en la parte superior del marketplace y mapa.",
      "Métricas de vistas, clics y contactos para el anunciante.",
      "Validación de categoría: Canchas, Gym, Academia, Tienda, Bebidas, etc.",
    ],
    technical:
      "Tabla `ads` con campo `is_sponsored boolean` y `is_premium`. Frontend en `src/shared/api/adsService.ts` (función `createAd`).",
    references: [
      "Código: `src/features/business/model/useAdsStore.ts`, `CommercialSheetModal.tsx`.",
      "Test E2E: `tests/e2e/end-to-end-ecosystem.spec.ts:70`.",
    ],
    action: "DONE",
  },
  "SCRUM-233": {
    newSummary: "Permitir reseñas y calificaciones de productos del marketplace",
    context:
      "Los usuarios necesitan reseñas de productos antes de gastar FitCoins, pero la UI actual solo permite reseñar canchas y partidos, no productos del marketplace.",
    userStory:
      "Como usuario, quiero ver reseñas y calificaciones de otros usuarios sobre productos del marketplace, para decidir mejor qué canjear con mis FitCoins.",
    criteria: [
      "Tabla `marketplace_reviews` con rating 1-5 y texto.",
      "Mostrar rating promedio en cada item del marketplace.",
      "Formulario de reseña solo si el usuario ya canjeó el producto.",
      "Filtro por rating y ordenamiento por más recientes.",
      "Migración desde `reviews` (canchas) hacia arquitectura unificada.",
    ],
    technical:
      "Nueva tabla `marketplace_reviews(item_id, user_id, rating, comment)`. UI en sección de detalle del producto en `app.wallet.index.tsx`.",
    references: [
      "Schema actual: `supabase/schema_definitivo.sql:377` (tabla `reviews`).",
      "Componente existente: `PostMatchReviewForm` (jugadores).",
    ],
    action: "PARTIAL",
  },
  "SCRUM-234": {
    newSummary: "Compartir logros deportivos en redes sociales desde la app",
    context:
      "Los usuarios no pueden compartir sus logros fácilmente, lo que reduce el efecto viral y la adquisición orgánica.",
    userStory:
      "Como usuario, quiero compartir mis logros deportivos (partidos, insignias, ranking) directamente en mis redes sociales desde la aplicación, para presumir mi progreso y atraer amigos a SportMatch.",
    criteria: [
      "Botón de compartir en: partidos completados, insignias desbloqueadas, posición en ranking, perfil.",
      "Web Share API en móvil (preferida) con fallback a intents específicos por red social.",
      "OG image dinámica con el logro del usuario.",
      "Texto preformateado con hashtags relevantes (#SportMatch + #Deporte).",
      "Tracking de shares en analytics para medir viralidad.",
    ],
    technical:
      "Usar `navigator.share({title, text, url})` cuando esté disponible. Fallback a URLs de share por red (twitter/intent, facebook/share). Generar OG image server-side con `@vercel/og`.",
    references: ["Nuevo módulo. Sin código previo."],
    action: "OPEN",
  },
  "SCRUM-235": {
    newSummary: "Sincronizar actividades de Strava con SportMatch",
    context:
      "Los deportistas usan Strava para registrar entrenamientos y no quieren duplicar el registro en SportMatch.",
    userStory:
      "Como usuario, quiero sincronizar mis actividades de Strava con SportMatch, para registrar automáticamente mis entrenamientos, sumar XP y mantener mi racha activa sin esfuerzo manual.",
    criteria: [
      "OAuth 2.0 con Strava para autorizar la app.",
      "Webhook de Strava → backend NestJS → guarda actividad en `user_activities`.",
      "Cálculo automático de XP basado en distancia, tiempo y tipo de deporte.",
      "Mapeo de tipos de actividad Strava a deportes SportMatch (Run, Ride, Swim → Running, Ciclismo, Natación).",
      "Desconexión y borrado de datos según GDPR.",
    ],
    technical:
      "OAuth flow en `server/src/integrations/strava.controller.ts`. Webhook en `POST /api/v1/integrations/strava/webhook` con validación de firma.",
    references: [
      "Mock actual: `src/routes/app.iot.tsx:139` (botón stravaConnected).",
      "Pendiente según `generate_report.js` (Sprint 4 plan).",
    ],
    action: "OPEN",
  },
  "SCRUM-236": {
    newSummary: "Confirmar asistencia automáticamente al partido por geolocalización",
    context:
      "Los usuarios olvidan confirmar asistencia manualmente y los organizadores no saben quién realmente fue al partido.",
    userStory:
      "Como usuario, quiero que el sistema confirme automáticamente mi asistencia a un partido si detecta mi ubicación GPS cerca de la cancha, para no quedarme sin registrar y mantener mi racha.",
    criteria: [
      "Botón 'Check-in' con geolocation API (`navigator.geolocation.getCurrentPosition`).",
      "Validación: distancia < 100m del centroide de la cancha (PostGIS).",
      "Si distancia > 100m: error 'checkin_too_far'.",
      "Confirmación automática al detectar posición válida.",
      "Solo se permite 1 check-in por partido por usuario.",
    ],
    technical:
      "Función `checkin(matchId, lat, lng)` con RPC `validate_attendance_geo` que calcula distancia con PostGIS y registra en `match_participants.status = 'ATTENDED'`.",
    references: [
      "Código: `src/routes/app.index.tsx:1258-1289`.",
      "Test E2E: `tests/e2e/postgis-integration.spec.ts`.",
      "i18n: `game_day.checkin_success`, `checkin_too_far`, `checkin_error`.",
    ],
    action: "DONE",
  },
  "SCRUM-237": {
    newSummary: "Soporte completo de navegación con lectores de pantalla (WCAG 2.2 AA)",
    context:
      "Los componentes UI usan Shadcn/Radix con ARIA por defecto pero falta una auditoría formal y skip-links para usuarios con discapacidad visual.",
    userStory:
      "Como usuario con discapacidad visual, quiero que toda la aplicación sea navegable con lectores de pantalla, para acceder a todas las funciones sin barreras.",
    criteria: [
      "Skip-link al main content en el AppShell.",
      "Focus management personalizado en modales y drawers (focus trap).",
      "Auditoría WCAG 2.2 AA con axe-core (Playwright + @axe-core/playwright).",
      "Live regions para notificaciones dinámicas (aria-live).",
      "Tab order lógico en formularios complejos.",
    ],
    technical:
      "Componentes Shadcn/Radix ya proveen ARIA. Añadir `<a href='#main' className='skip-link'>` en `AppShell.tsx`. Test E2E con `@axe-core/playwright`.",
    references: [
      "Componentes: `src/shared/ui/*` (Radix UI con aria-hidden, role, tabIndex).",
      "Tests: añadir `tests/e2e/a11y.spec.ts`.",
    ],
    action: "PARTIAL",
  },
  "SCRUM-238": {
    newSummary: "Añadir modo de alto contraste para usuarios con baja visión",
    context:
      "Los temas actuales (world-cup, dark-footballer, light) tienen buen contraste pero no hay un modo dedicado para usuarios con baja visión severa.",
    userStory:
      "Como usuario con baja visión, quiero activar un modo de alto contraste, para mejorar la legibilidad de la interfaz y reducir la fatiga visual.",
    criteria: [
      "Toggle 'Modo alto contraste' en configuración de accesibilidad.",
      "CSS custom properties que cumplan WCAG AAA (ratio 7:1).",
      "Respetar `prefers-contrast: more` media query del sistema operativo.",
      "Aplica a los 3 temas existentes (world-cup, dark-footballer, light).",
      "Persistencia en localStorage.",
    ],
    technical:
      "Nuevo tema `high-contrast` en `src/features/theme/store.ts` con tokens CSS en `src/styles.css`. Detector: `window.matchMedia('(prefers-contrast: more)')`.",
    references: ["Theme store: `src/features/theme/store.ts`.", "CSS: `src/styles.css`."],
    action: "OPEN",
  },
  "SCRUM-239": {
    newSummary: "Cambiar el idioma de la aplicación entre español e inglés",
    context:
      "La app está en español; el mercado angloparlante y el mercado brasileiro de pádel no pueden usar la app.",
    userStory:
      "Como usuario internacional, quiero cambiar el idioma de la aplicación entre español e inglés, para usar la app en mi idioma nativo.",
    criteria: [
      "Selector de idioma en configuración de cuenta.",
      "i18next configurado con detector de idioma del navegador.",
      "Archivos `es.json` y `en.json` con cobertura completa.",
      "Persistencia de la elección del usuario.",
      "Cambio de idioma sin recarga de página.",
    ],
    technical:
      "i18next con `LanguageDetector` (línea 25 de `src/shared/i18n/index.ts`). Locales en `src/shared/i18n/locales/`. Hook `useTranslation()` en componentes.",
    references: [
      "Código: `src/shared/i18n/index.ts`, `src/shared/i18n/locales/{es,en}.json`.",
      "Inicialización: `src/main.tsx:6`.",
    ],
    action: "DONE",
  },
  "SCRUM-240": {
    newSummary: "Formatear fechas, horarios y montos en formato local LATAM",
    context:
      "El formato de fechas y montos es inconsistente entre archivos (algunos usan es-PE, otros es-AR, otros es-AR). Necesitamos un estándar LATAM coherente.",
    userStory:
      "Como usuario latinoamericano, quiero ver las fechas, horarios y montos en el formato local de mi país, para entender mejor la información sin confusión.",
    criteria: [
      "Wrapper `formatDate(date, locale)` que retorna formato localizado.",
      "Wrapper `formatCurrency(amount, currency)` con soporte PEN, ARS, CLP, COP, MXN.",
      "Wrapper `formatTime(time)` con formato 24h (es-PE/AR) y 12h (US).",
      "Centralizar en `src/shared/lib/i18nFormat.ts`.",
      "Reemplazar todos los `toLocaleDateString` directos con los wrappers.",
    ],
    technical:
      "Usar `date-fns/locale` (es, en, pt-BR). Helpers: `format(date, 'PPP', { locale: es })`. Currency: `Intl.NumberFormat(locale, { style: 'currency', currency: 'PEN' })`.",
    references: [
      "Uso actual: `BookingModal.tsx:493`, `app.wallet.history.tsx:96`, `PublicMatchBoard.tsx:57`.",
      "Acción previa: SCRUM-241 PWA, SCRUM-239 i18n.",
    ],
    action: "PARTIAL",
  },
  "SCRUM-241": {
    newSummary: "Instalar SportMatch como aplicación desde el navegador",
    context:
      "Los usuarios móviles no quieren ir a la app store; quieren instalar la app directamente desde el navegador.",
    userStory:
      "Como usuario móvil, quiero instalar SportMatch como aplicación en mi móvil desde el navegador, para tener acceso rápido sin pasar por la app store.",
    criteria: [
      "Manifest.json con name, short_name, theme_color, display, icons 192/512.",
      "Service worker para cache offline.",
      "Botón 'Instalar app' aparece cuando la app es instalable.",
      "HTTPS obligatorio en producción.",
      "Soporte Chrome (Android), Safari (iOS), Edge.",
    ],
    technical:
      "`vite-plugin-pwa` en `vite.config.ts:14-59` con manifest completo. `workbox` con precaching y `registerType: 'autoUpdate'`.",
    references: [
      "Config: `vite.config.ts:14-59` (VitePWA plugin).",
      "Manifest en línea con theme_color `#0f172a` y display 'standalone'.",
    ],
    action: "DONE",
  },
  "SCRUM-242": {
    newSummary: "Funcionar sin conexión a internet mostrando los últimos datos",
    context: "Los usuarios en canchas con mala señal no pueden acceder a la app.",
    userStory:
      "Como usuario en una cancha con mala señal, quiero que la app funcione sin conexión a internet mostrando mis últimos datos, para no quedarme sin acceso a la información que necesito.",
    criteria: [
      "Service worker con estrategia network-first para API, cache-first para assets.",
      "Stores Zustand con `persist` en localStorage.",
      "Cola de mutaciones pendientes que se sincronicen al reconectar.",
      "Indicador visual 'Modo offline' en la UI.",
      "Solo lectura de datos antiguos; escritura deshabilitada offline.",
    ],
    technical:
      "Workbox `runtimeCaching` con estrategias por tipo de recurso. `useNetworkStatus` hook. Cola de mutaciones en `src/shared/lib/offlineQueue.ts`.",
    references: [
      "Config: `vite.config.ts` (Workbox).",
      "Stores: `useWalletStore`, `usePublicMatchStore` con `persist`.",
    ],
    action: "PARTIAL",
  },
  "SCRUM-243": {
    newSummary: "Cargar la aplicación en menos de 2 segundos en conexiones 4G",
    context: "La app bundle es pesada (~42MB con TF.js) y tarda en cargar en móviles.",
    userStory:
      "Como usuario móvil, quiero que la aplicación cargue en menos de 2 segundos en conexiones 4G, para una experiencia fluida y sin esperas.",
    criteria: [
      "Code splitting por ruta con TanStack Router.",
      "Manual chunks por vendor (react, router, ui, forms, charts, maps, ml, i18n).",
      "Lazy loading de rutas.",
      "Precaching de assets críticos vía PWA.",
      "Lighthouse Performance score > 80 en móvil.",
    ],
    technical:
      "`vite.config.ts:73-89` define `manualChunks`. `TanStackRouterVite` con `autoCodeSplitting: true`. `chunkSizeWarningLimit: 6000`.",
    references: ["Config: `vite.config.ts:73-89`."],
    action: "DONE",
  },
  "SCRUM-244": {
    newSummary: "Controlar la visibilidad del perfil (público, amigos, privado)",
    context:
      "Los usuarios no pueden controlar quién ve su información, lo que afecta la privacidad.",
    userStory:
      "Como usuario, quiero controlar qué información de mi perfil es visible para otros usuarios, para proteger mi privacidad según mi nivel de comfort.",
    criteria: [
      "Campo `profile_visibility: 'public' | 'friends' | 'private'` en perfil.",
      "Toggle en configuración: 'Mostrar mi perfil en búsqueda', 'Mostrar mi ubicación', 'Mostrar mis partidos'.",
      "Si 'private', el perfil no aparece en matchmaking ni búsquedas.",
      "Si 'friends', solo conexiones mutuas ven detalles.",
      "Default: 'public' para usuarios nuevos, 'friends' para usuarios con DNI verificado.",
    ],
    technical:
      "Tabla `profiles` añade `visibility` enum. RLS policies ajustadas para respetar visibilidad. UI en `app.profile.index.tsx`.",
    references: ["Schema: `supabase/schema_definitivo.sql` (añadir columna `visibility`)."],
    action: "OPEN",
  },
  "SCRUM-245": {
    newSummary: "Eliminar mi cuenta y todos mis datos (derecho al olvido GDPR)",
    context: "La app no permite a los usuarios borrar su cuenta, lo que incumple GDPR.",
    userStory:
      "Como usuario, quiero poder eliminar mi cuenta y todos mis datos de la plataforma, para ejercer mi derecho al olvido según GDPR.",
    criteria: [
      "Botón 'Eliminar cuenta' en configuración con doble confirmación.",
      "Endpoint `DELETE /api/v1/users/me` que anonimiza datos sensibles.",
      "Soft-delete: mantener transacciones para auditoría contable, anonimizar PII.",
      "Período de gracia de 30 días antes del borrado definitivo.",
      "Email de confirmación del borrado.",
    ],
    technical:
      "Endpoint en `server/src/users/users.controller.ts` (`DELETE /users/me`). Soft delete con `deleted_at` timestamp. Cron job que anonimiza después de 30 días.",
    references: ["Pendiente en `docs/backlog.md`."],
    action: "OPEN",
  },
  "SCRUM-246": {
    newSummary: "Proteger todos los endpoints con Row Level Security (RLS) de Supabase",
    context: "Las tablas sin RLS exponen datos a accesos no autorizados.",
    userStory:
      "Como administrador del sistema, quiero que todos los endpoints de la API estén protegidos con Row Level Security (RLS) de Supabase, para garantizar la seguridad de los datos de los usuarios.",
    criteria: [
      "RLS habilitado en TODAS las tablas: profiles, matches, match_participants, notifications, bookings, courts, ratings, follows.",
      "Policies por rol: anon (solo lectura pública), authenticated (lectura/escritura de sus datos), service_role (bypass).",
      "Auditoría de policies existentes.",
      "Tests de RLS que intenten accesos no autorizados.",
      "Migraciones reproducibles desde cero.",
    ],
    technical:
      "Migraciones en `supabase/migrations/`: `20260529_rls_policies_hardening.sql`, `20260529_posts_rls.sql`, `20260602_wallet_balance_trigger.sql`, `20260603_wallet_transactions_trigger_fix.sql`, `20260604_post_comments_and_reactions.sql`. Schema maestro `supabase/schema_definitivo.sql`.",
    references: [
      "Migraciones: `supabase/migrations/2026*`.",
      "Schema: `supabase/schema_definitivo.sql`.",
    ],
    action: "DONE",
  },
  "SCRUM-247": {
    newSummary: "Suite de tests E2E para flujos críticos de onboarding y reservas",
    context:
      "Los flujos críticos de onboarding y reserva deben estar cubiertos por tests automatizados para evitar regresiones.",
    userStory:
      "Como desarrollador, quiero tener una suite de tests E2E que cubra los flujos críticos de onboarding y reserva de canchas, para detectar regresiones antes de cada release.",
    criteria: [
      "Test E2E del flujo completo de registro y onboarding wizard.",
      "Test E2E de reserva de cancha con pago Stripe.",
      "Test E2E de creación y aceptación de challenge.",
      "Test E2E de creación de post con moderación IA.",
      "Test E2E de geolocalización y check-in por GPS.",
    ],
    technical:
      "Playwright con `playwright.config.ts`. Specs en `tests/e2e/`: `onboarding-wizard.spec.ts`, `business-flow.spec.ts`, `end-to-end-ecosystem.spec.ts`, `core-flow.spec.ts`, `postgis-integration.spec.ts`.",
    references: [
      "Specs: `tests/e2e/onboarding-wizard.spec.ts`, `core-flow.spec.ts`, `postgis-integration.spec.ts`.",
      "Config: `playwright.config.ts`.",
    ],
    action: "DONE",
  },
  "SCRUM-248": {
    newSummary: "Tests unitarios para funciones de matching y compatibilidad",
    context:
      "El algoritmo de matching es crítico para el producto y debe estar testeado unitariamente.",
    userStory:
      "Como desarrollador, quiero tener tests unitarios para las funciones de matching y cálculo de compatibilidad, para garantizar su precisión y prevenir regresiones.",
    criteria: [
      "Test del algoritmo de score de compatibilidad.",
      "Test del componente MatchmakingFeature (rendering e interacciones).",
      "Test del store publicMatchStore.",
      "Coverage > 80% en el módulo matchmaking.",
      "Tests deterministas (sin random, con fixtures fijos).",
    ],
    technical:
      "3 suites en `src/features/matchmaking/__tests__/`: `matchmaking.test.ts` (lógica), `MatchmakingFeature.test.tsx` (componente), `publicMatchStore.test.ts` (store). Config con `vitest.config.ts`.",
    references: [
      "Tests: `src/features/matchmaking/__tests__/*.test.ts(x)`.",
      "Config: `vitest.config.ts`.",
    ],
    action: "DONE",
  },
  "SCRUM-249": {
    newSummary: "Pipeline CI/CD con GitHub Actions para validar calidad",
    context: "Sin CI/CD, los merges pueden romper la rama main.",
    userStory:
      "Como equipo de desarrollo, quiero tener un pipeline de CI/CD completo en GitHub Actions que valide calidad antes de cada deploy, para evitar regresiones en producción.",
    criteria: [
      "Ejecuta en cada PR: tsc --noEmit, ESLint, Prettier, Vitest.",
      "Ejecuta en merge a main: todo lo anterior + Playwright E2E.",
      "Deploy automático a Vercel (frontend) y Render (backend) en merge a main.",
      "Status checks requeridos para mergear PRs.",
      "Cache de node_modules para velocidad.",
    ],
    technical:
      "`.github/workflows/main.yml` ejecuta install, lint, typecheck, test en Node 24 sobre `push`/`pull_request` a `main`.",
    references: ["Config: `.github/workflows/main.yml`."],
    action: "DONE",
  },
  "SCRUM-250": {
    newSummary: "Documento de arquitectura actualizado con diagramas de BD",
    context:
      "Los nuevos developers necesitan un documento de arquitectura claro y diagramas actualizados para onboardearse rápido.",
    userStory:
      "Como equipo de desarrollo, quiero tener un documento de arquitectura actualizado con el diagrama de base de datos, para onboardear nuevos desarrolladores eficientemente.",
    criteria: [
      "Documento `docs/architecture.md` con diagrama C4 (Context, Container, Component, Code).",
      "Diagrama ER de la base de datos (PostgreSQL/Supabase).",
      "Diagrama de secuencia de flujos críticos (login, booking, IA chat).",
      "Decisiones arquitectónicas documentadas (ADRs) en `docs/adr/`.",
      "Actualizado al estado actual del repo.",
    ],
    technical:
      "Ya existe `docs/mcp/architecture.md`, `docs/mcp/data-flow.md`, `docs/tdd.md` (Technology Stack & ADRs). Crear `docs/architecture.md` como punto de entrada único y formalizar `docs/adr/` con ADRs numerados.",
    references: [
      "Existente: `docs/tdd.md`, `docs/mcp/architecture.md`.",
      "Nuevo: `docs/architecture.md`, `docs/adr/`.",
    ],
    action: "PARTIAL",
  },
  "SCRUM-251": {
    newSummary: "Storybook con todos los componentes UI documentados",
    context:
      "Sin Storybook, los componentes UI se documentan manualmente o nada, lo que dificulta el desarrollo consistente.",
    userStory:
      "Como desarrollador, quiero tener un Storybook con todos los componentes UI de SportMatch documentados, para desarrollar consistentemente y onboarding de nuevos developers.",
    criteria: [
      "Storybook 8.x configurado con Vite builder.",
      "Stories para todos los componentes en `src/shared/ui/` (Button, Card, Dialog, etc).",
      "Stories para componentes de features principales (AIAvatarButton, BadgeEngine, etc).",
      "Deploy automático de Storybook a Chromatic o Vercel.",
      "Tests visuales con Chromatic snapshot.",
    ],
    technical:
      "Instalar `storybook`, `@storybook/react-vite`, `@storybook/addon-essentials`. Configurar `.storybook/`. Crear `*.stories.tsx` por componente.",
    references: ["Pendiente. No hay código previo."],
    action: "OPEN",
  },
  "SCRUM-252": {
    newSummary: "Documentar las Edge Functions de Supabase",
    context:
      "Existen Edge Functions pero sin documentación que facilite su uso por otros developers.",
    userStory:
      "Como equipo de desarrollo, quiero documentar todas las Edge Functions de Supabase con ejemplos de request y response, para facilitar su uso y mantenimiento.",
    criteria: [
      "README en cada `supabase/functions/<nombre>/index.ts` con descripción, payload, response, errores.",
      "Documento `docs/edge-functions.md` como índice de todas las funciones.",
      "Ejemplos curl para testing manual.",
      "Diagrama de cuándo se invoca cada Edge Function.",
      "Considerar migrar a NestJS si la lógica no requiere Edge runtime.",
    ],
    technical:
      "Edge Functions existentes: `supabase/functions/notify-match/`, `notify-squad-msg/`, `create-stripe-payment-intent/`. Documentar en README + índice general.",
    references: [
      "Funciones: `supabase/functions/{notify-match,notify-squad-msg,create-stripe-payment-intent}/`.",
      "Pendiente: `supabase/functions/reward-match/` (mencionado en `docs/backlog.md`).",
    ],
    action: "PARTIAL",
  },
  "SCRUM-253": {
    newSummary: "Dashboard de métricas de uso para product owner",
    context: "Las decisiones de producto se toman sin datos reales de uso.",
    userStory:
      "Como product owner, quiero tener un dashboard de métricas de uso de la plataforma, para tomar decisiones basadas en datos reales de los usuarios.",
    criteria: [
      "KPIs principales: DAU, MAU, retención D1/D7/D30, matches creados/día, revenue.",
      "Gráficos de tendencia temporal (últimos 30/90 días).",
      "Funnel de onboarding (registro → wizard → primer partido).",
      "Métricas por cohorte y por segmento (sport, district, user_type).",
      "Refresh cada 5 minutos.",
    ],
    technical:
      "Migrar el mock actual de `ADMIN_KPI` en `src/routes/app.admin.tsx` a datos reales. Integración opcional con PostHog/Sentry/Mixpanel.",
    references: [
      "Mock actual: `src/routes/app.admin.tsx` (ADMIN_KPI).",
      "B2B: `src/routes/app.business.tsx` (tab analytics).",
    ],
    action: "PARTIAL",
  },
  "SCRUM-254": {
    newSummary: "Alertas automatizadas para usuarios inactivos (>14 días)",
    context: "Los usuarios que llevan más de 14 días sin jugar son candidatos a churn.",
    userStory:
      "Como administrador, quiero configurar alertas automatizadas de inactividad, para reactivar usuarios que llevan más de 14 días sin jugar y reducir el churn.",
    criteria: [
      "Edge Function `detect-inactive-users` corre diariamente a las 9am.",
      "Trigger: `last_login_at < now() - 14 days`.",
      "Envía push notification con oferta personalizada (e.g. 'Te extrañamos, te regalamos 50 FitCoins').",
      "Si no abre en 7 días, segunda alerta con reto especial.",
      "Si no abre en 14 días, escalar a admin para outreach manual.",
    ],
    technical:
      "Edge Function `supabase/functions/detect-inactive-users/index.ts` con cron trigger. Tabla `user_inactivity_log` para tracking.",
    references: ["Pendiente. Sin código previo."],
    action: "OPEN",
  },
  "SCRUM-255": {
    newSummary: "Retar amigos con enlace dinámico compartible",
    context:
      "Los usuarios quieren retar a amigos pero el flujo actual solo funciona entre usuarios logueados, no permite invitaciones externas.",
    userStory:
      "Como usuario, quiero programar retos directos a mis amigos enviando un enlace dinámico personalizado por WhatsApp o Telegram, para retarlos a competir aunque aún no estén en SportMatch.",
    criteria: [
      "Botón 'Retar amigo' en perfil de contacto y vista de partido.",
      "Genera deep link `sportmatch://challenge/<token>`.",
      "URL web fallback: `https://sportmatch.com/challenge/<token>`.",
      "Si el receptor no tiene cuenta, se abre registro prellenado con datos del retador.",
      "Tracking de invitaciones enviadas, abiertas, aceptadas.",
    ],
    technical:
      "Extender `src/shared/api/challengeService.ts` para generar tokens únicos. Web Share API para compartir. Deep link universal links configurado en `vercel.json`.",
    references: [
      "Código actual: `src/shared/api/challengeService.ts`.",
      "Tests: `src/shared/api/__tests__/challengeService.test.ts`.",
    ],
    action: "PARTIAL",
  },
  "SCRUM-256": {
    newSummary: "Mostrar pronóstico meteorológico en canchas outdoor",
    context: "Los partidos al aire libre se arruinan por lluvia no prevista.",
    userStory:
      "Como usuario, quiero ver el pronóstico meteorológico del día del partido en la pantalla de la cancha reservada, para saber si lloverá y reprogramar si es necesario.",
    criteria: [
      "Widget `<WeatherCard>` en `app.courts.$courtId.tsx`.",
      "Integración con OpenWeatherMap API.",
      "Muestra: temperatura, lluvia (mm), viento, humedad, UV.",
      "Si lluvia > 30% probabilidad en la hora del partido: alerta 'Considera reprogramar'.",
      "Cache de 30 minutos para evitar rate limits.",
    ],
    technical:
      "API key en Render. Edge Function `supabase/functions/weather-forecast/index.ts` con cache. Componente frontend con íconos Lucide.",
    references: ["Pendiente. Sin código previo."],
    action: "OPEN",
  },
  "SCRUM-257": {
    newSummary: "Exportar reporte financiero consolidado de FitCoins",
    context: "Los administradores no pueden analizar la economía interna de la plataforma.",
    userStory:
      "Como administrador, quiero exportar un reporte financiero consolidado del uso de FitCoins, para analizar la economía interna de la plataforma y tomar decisiones.",
    criteria: [
      "Endpoint `GET /api/v1/wallet/report?from=&to=&format=csv`.",
      "Columnas: fecha, tipo (EARN/SPEND/PENALTY), descripción, monto, balance_resultante.",
      "Filtros por rango de fechas y por tipo de transacción.",
      "Botón 'Exportar CSV' y 'Exportar PDF' en admin dashboard.",
      "Email automático mensual a admins con resumen.",
    ],
    technical:
      "NestJS endpoint con `papaparse` para CSV. Job mensual con `@nestjs/schedule` para envío de email.",
    references: [
      "Existente: `src/routes/app.wallet.history.tsx` (lista de transacciones).",
      "Backend: `server/src/wallet/wallet.controller.ts`.",
    ],
    action: "OPEN",
  },
};

console.log(`=== Estandarizando ${Object.keys(TICKETS).length} tickets legacy de Edwin ===\n`);

const adfText = (text) => ({ type: "text", text });
const adfPara = (text) => ({ type: "paragraph", content: [adfText(text)] });
const adfHeading = (level, text) => ({
  type: "heading",
  attrs: { level },
  content: [adfText(text)],
});
const adfBullet = (text) => ({
  type: "bulletList",
  content: [
    {
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "☑ " },
            { type: "text", text },
          ],
        },
      ],
    },
  ],
});

async function getCurrentLabels(issueKey) {
  const data = await api(`/rest/api/3/issue/${issueKey}?fields=labels,customfield_10020`);
  return data.fields.labels || [];
}

async function getTransitions(issueKey) {
  const data = await api(`/rest/api/3/issue/${issueKey}/transitions`);
  return data.transitions || [];
}

let updated = 0;
let failed = 0;
let finalized = 0;
let partialLabelled = 0;

for (const [key, data] of Object.entries(TICKETS)) {
  try {
    // 1) Construir ADF
    const adf = {
      type: "doc",
      version: 1,
      content: [
        adfHeading(3, "📋 Contexto"),
        adfPara(data.context),
        adfHeading(3, "👤 User Story"),
        adfPara(data.userStory),
        adfHeading(3, "✅ Criterios de Aceptación"),
        ...data.criteria.map((c) => adfBullet(c)),
        adfHeading(3, "🔧 Notas Técnicas"),
        adfPara(data.technical),
        adfHeading(3, "🔗 Referencias"),
        ...data.references.map((r) => adfBullet(r)),
      ],
    };

    // 2) Obtener labels actuales y agregar según action
    const currentLabels = await getCurrentLabels(key);
    let newLabels = [...currentLabels];

    // Eliminar labels antiguos problemáticos
    newLabels = newLabels.filter(
      (l) => !["historia-usuario", "sportmatch-2026"].includes(l) || l === "historia-usuario",
    );
    // Asegurar historia-usuario
    if (!newLabels.includes("historia-usuario")) newLabels.push("historia-usuario");

    if (data.action === "DONE" && !newLabels.includes("implemented")) {
      newLabels.push("implemented");
    }
    if (data.action === "PARTIAL" && !newLabels.includes("partial-implementation")) {
      newLabels.push("partial-implementation");
    }
    if (data.action === "OPEN" && !newLabels.includes("backlog")) {
      newLabels.push("backlog");
    }

    // 3) PUT update
    await api(`/rest/api/3/issue/${key}`, {
      method: "PUT",
      body: JSON.stringify({
        fields: {
          summary: data.newSummary,
          description: adf,
          labels: newLabels,
        },
      }),
    });
    console.log(`  ✓ ${key} actualizado: "${data.newSummary}"`);
    updated++;

    // 4) Si action === "DONE", transicionar a Finalizada
    if (data.action === "DONE") {
      const transitions = await getTransitions(key);
      // Buscar transición que lleve a "Finalizada" (status id 10001)
      const doneTransition = transitions.find(
        (t) => t.to?.id === "10003" || /listo|finalizada|done/i.test(t.name),
      );
      if (doneTransition) {
        await api(`/rest/api/3/issue/${key}/transitions`, {
          method: "POST",
          body: JSON.stringify({ transition: { id: doneTransition.id } }),
        });
        console.log(`    → ${key} FINALIZADO (transición: ${doneTransition.id})`);
        finalized++;
      } else {
        console.log(`    ⚠ ${key} no tiene transición a Finalizada disponible`);
      }
    } else if (data.action === "PARTIAL") {
      partialLabelled++;
    }
  } catch (err) {
    console.error(`  ! ${key} ERROR: ${err.message.slice(0, 200)}`);
    failed++;
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`Tickets actualizados: ${updated}`);
console.log(`Tickets finalizados: ${finalized}`);
console.log(`Tickets partial (label): ${partialLabelled}`);
console.log(`Tickets fallidos: ${failed}`);
console.log(`\nAcción breakdown:`);
console.log(
  `  DONE (implementado): ${Object.values(TICKETS).filter((t) => t.action === "DONE").length}`,
);
console.log(`  PARTIAL: ${Object.values(TICKETS).filter((t) => t.action === "PARTIAL").length}`);
console.log(
  `  OPEN (backlog): ${Object.values(TICKETS).filter((t) => t.action === "OPEN").length}`,
);
