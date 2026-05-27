# Backlog Maestro - SportMatch (Fase 4 & Beyond)

Este backlog está estructurado para que los 4 desarrolladores del equipo puedan tomar tickets inmediatamente y ejecutar en paralelo sin pisarse.

---

## 🎨 Dev 1 & 2 (UI/UX Specialists)

### [TICKET-001] Animaciones de FitCoins con Framer Motion

**User Story:** Como usuario, quiero ver una animación de monedas saltando hacia mi wallet cuando recibo una recompensa, para sentir una mayor gamificación.
**Criterios de Aceptación:**

- [ ] Instalar `framer-motion`.
- [ ] Modificar `src/features/wallet/useWallet.ts` para exponer un trigger de animación.
- [ ] En la vista de Wallet, si se recibe una transacción "REWARD", lanzar animación de partículas (monedas).
- [ ] Usar componente FSD `src/shared/ui/CoinShower`.

### [TICKET-002] Skeletons para Perfil y Settings

**User Story:** Como usuario, quiero ver un estado de carga estructurado (Skeleton) en lugar de una pantalla vacía cuando mi perfil carga.
**Criterios de Aceptación:**

- [ ] Usar el componente `Skeleton` de Shadcn UI (`src/shared/ui/skeleton.tsx`).
- [ ] Crear el componente `ProfileSkeleton.tsx` en `src/pages/`.
- [ ] Simular un retardo de red de 1s para asegurar que el skeleton se ve bien en móviles.

### [TICKET-003] Rediseño de Toast Global con Sonner

**User Story:** Como diseñador, quiero que los Toasts tengan bordes de neón según el tipo de acción (Match = Neón Verde, Error = Rojo, Info = Azul).
**Criterios de Aceptación:**

- [ ] Envolver la app con `<Toaster />` en `src/app/providers.tsx`.
- [ ] Modificar los estilos de Sonner para que hagan override con Tailwind y usen `bg-gradient-card`.
- [ ] Añadir iconos dinámicos usando Lucide React.

### [TICKET-004] Micro-interacciones en Map Markers

**User Story:** Como usuario, al hacer hover o tap sobre un jugador en el mapa, quiero que el pin palpite (pulse) indicando que está activo.
**Criterios de Aceptación:**

- [ ] En `src/features/map/MapFeature.tsx`, añadir clase CSS personalizada al icono de Leaflet (`divIcon`).
- [ ] Añadir keyframe `animate-pulse-ring` de tailwind.

---

## 🛠️ Dev 3 (Data Integrator)

### [TICKET-005] Integración de Filtros Reales en Matchmaking

**User Story:** Como usuario, quiero filtrar mis Matches por "Nivel", "Distancia" y "Deporte".
**Criterios de Aceptación:**

- [ ] El hook `useMatchmaking` debe aceptar parámetros de filtro `(filters: MatchFilters)`.
- [ ] Actualizar `apiClient.ts` para inyectar estos parámetros en el `select()` de Supabase (ej: `.eq('sport', filters.sport)`).
- [ ] Si `USE_MOCKS=true`, la función debe filtrar el array local usando `.filter()`.

### [TICKET-006] Supabase Edge Functions para Wallet

**User Story:** Como administrador, quiero que las FitCoins no se calculen en el cliente sino en el servidor para evitar fraude.
**Criterios de Aceptación:**

- [ ] Crear un directorio `supabase/functions/reward-match`.
- [ ] Escribir una función Deno que reciba un `user_id` y haga un `INSERT` en `transactions`.
- [ ] El frontend (`apiClient`) debe llamar a esta Edge Function en lugar de hacer el INSERT directo.

### [TICKET-007] Historial de Swipes Persistente

**User Story:** Como sistema, necesito guardar cada Swipe (Like/Pass) en una tabla relacional para entrenar a la IA a futuro.
**Criterios de Aceptación:**

- [ ] Crear tabla `swipes` en Supabase (id, actor_id, target_id, action, created_at).
- [ ] En `useMatchmaking`, dentro de la mutación `onSuccess`, lanzar un `apiClient.matchmaking.recordSwipe(data)`.

---

## 🚀 Dev 4 (Performance & QA)

### [TICKET-008] Worker / Buffer para Telemetría IoT

**User Story:** Como sistema, necesito procesar 120 latidos por minuto sin que React tire frames (mantener 60 FPS).
**Criterios de Aceptación:**

- [ ] Revisar el estado de `useIoTStore` (`src/features/iot/store.ts`).
- [ ] Implementar un debouncer o Web Worker que agrupe las lecturas del Smartwatch antes de actualizar Zustand.
- [ ] Profiling con React DevTools: Demostrar que el dashboard principal de mapas no re-renderiza cuando el HeartRate sube.

### [TICKET-009] Offline Cache de TanStack Query

**User Story:** Como jugador en una cancha con mala señal, quiero que la app siga funcionando usando los datos en caché.
**Criterios de Aceptación:**

- [ ] Instalar `@tanstack/react-query-persist-client`.
- [ ] Configurar el persister en `providers.tsx` para guardar el caché en `localStorage` o `IndexedDB`.
- [ ] Probar modo avión: El stack de Matches debe cargar al instante.

### [TICKET-010] Optimización de Carga del Leaflet Map

**User Story:** Como usuario en red 3G, no quiero descargar tiles de mapa masivos si estoy fuera de rango.
**Criterios de Aceptación:**

- [ ] En `MapFeature.tsx`, añadir el límite de zoom (`minZoom` / `maxZoom`) para evitar cargas inútiles.
- [ ] Configurar el `TileLayer` para cachear los tiles en el ServiceWorker (PWA configuration).
