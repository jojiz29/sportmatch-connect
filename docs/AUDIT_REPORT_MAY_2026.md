# Reporte de Auditoría Técnica y QA Industrial - Mayo 2026

## 1. Errores Encontrados y Corregidos

### 1.1 Colisiones en E2E y Puertos Hardcodeados
*   **Problema**: Los tests de Playwright (`core-flow.spec.ts`) tenían el puerto `5173` hardcodeado. Al ejecutar el servidor local en el puerto libre `5179`, los tests fallaban o se conectaban a instancias de otras aplicaciones locales en ejecución.
*   **Corrección**: Rediseñamos la configuración global en `playwright.config.ts` y las aserciones de URL en `core-flow.spec.ts` y `edwin-flow.spec.ts` para que utilicen dinámicamente la variable de entorno `VITE_PORT` (por defecto `5179`).
*   **Problema**: Colisiones de locadores en Playwright. El locador genérico `page.locator("div.flex.gap-3.items-center").first()` interceptaba la tarjeta del usuario logueado en el sidebar en lugar del primer elemento de la lista de canchas.
*   **Corrección**: Introdujimos selectores jerárquicos estrictos, limitando la búsqueda dentro del contenedor específico de la lista: `page.locator("div.bg-gradient-card", { hasText: "Cerca tuyo (Ordenado por distancia)" }).locator("div.flex.gap-3.items-center").first()`.

### 1.2 Credenciales de Test Huérfanas
*   **Problema**: El test de flujo básico intentaba loguearse con `test@test.com`, usuario inexistente en la lista estática de pruebas.
*   **Corrección**: Modificamos el test para que utilice las credenciales de Edwin Flores (`ejuniorfloress@gmail.com`), garantizando una autenticación exitosa e integración continua fluida.

---

## 2. Mejoras de Rendimiento y Prevención de Fugas de Memoria

### 2.1 Caching de Marcadores Leaflet (GC Pressure Reduction)
*   **Mejora**: En `MapFeature.tsx`, la recreación constante de instancias de `L.divIcon` en cada renderizado de la lista de canchas generaba presión innecesaria sobre el recolector de basura (Garbage Collector).
*   **Solución**: Implementamos una caché en memoria basada en `Map<string, L.DivIcon>` (`courtIconCache`). Ahora, los iconos de cada deporte se instancian una única vez y se reutilizan en renders subsecuentes, reduciendo el consumo de CPU y memoria en mapas con alta densidad de puntos.

### 2.2 Saneamiento del Ciclo de Vida de Telemetría IoT
*   **Mejora**: Validamos que el hook `useEffect` en `app.iot.tsx` que simula la telemetría del Apple Watch realice la desconexión y limpieza estricta del temporizador (`clearInterval`) al desmontarse, evitando fugas de memoria persistentes.

---

## 3. Cobertura de Tipos y Seguridad de Zustand

### 3.1 Protección de Persistencia Zustand (Stress-Testing de Hidratación)
*   **Mejora**: Si el almacenamiento del navegador (`localStorage`) se corrompe con JSON inválido o se satura (QuotaExceededError), la hidratación por defecto de Zustand colapsa y bloquea la inicialización de React.
*   **Solución**: Creamos `src/shared/lib/safeStorage.ts`, un adaptador robusto que intercepta y sanitiza las lecturas. Si detecta JSON corrupto, lo elimina del navegador de forma segura y devuelve `null`, forzando al store a inicializarse limpiamente con su estado inicial por defecto sin propagar fallos a la interfaz de usuario.

### 3.2 Tipado TypeScript Estricto
*   **Estado**: `npm run typecheck` se ejecuta y completa exitosamente con **0 errores**. La base de código cuenta con tipado estricto y sin dependencias de tipo `any`.

---

## 4. Checklist de Seguridad Industrial

- [x] **Prevención de SQL Injection**: La búsqueda de canchas por proximidad geográfica se ha delegado al motor de base de datos a través de la función RPC PostGIS `search_nearby_courts`. Los parámetros numéricos de latitud y longitud son tipados y validados estrictamente a nivel de base de datos PostgreSQL, evitando cualquier concatenación insegura de cadenas.
- [x] **Variables de Entorno**: El archivo sensible `.env.local` que contiene las credenciales maestras de la API de Jira y Supabase se encuentra listado en el archivo `.gitignore`, garantizando que nunca sea pusheado al repositorio público.
- [x] **Control de Políticas RLS (Row Level Security)**: La tabla `courts` de Supabase se ha blindado con políticas de seguridad de fila activa (`alter table public.courts enable row level security`), permitiendo únicamente lecturas públicas y restringiendo cualquier alteración de registros a usuarios autorizados.
- [x] **Validación E2E en Integración Continua**: Configuración de Playwright lista para ejecutar auditorías en entornos de staging/producción con control dinámico de puertos.
