# SportMatch Connect - Frontend Architecture ⚡

### _Plataforma de Matchmaking Deportivo y Torneos con Moderación Inteligente en el Borde (Edge AI)_

---

## 1. Descripción del Proyecto

**SportMatch Connect** es un ecosistema digital avanzado diseñado para revolucionar el deporte amateur y el emparejamiento de jugadores de fútbol, tenis, básquetbol, pádel y vóleibol. A través de geolocalización en tiempo real, algoritmos de matchmaking predictivos y una economía gamificada basada en recompensas virtuales (FitCoins), la plataforma mitiga el abandono de la actividad física y centraliza de manera interactiva la coordinación de partidos y la gestión de torneos competitivos.

La arquitectura de la aplicación está optimizada bajo los más rigurosos estándares de desarrollo frontend, garantizando interfaces receptivas, animaciones fluidas y blindajes de seguridad a nivel de cliente para proteger la integridad comunitaria.

---

## 2. Stack Tecnológico

El frontend del proyecto se ha desarrollado empleando las tecnologías más robustas del desarrollo web moderno:

- **React 19 (Concurrent Features):** Empleo de las últimas capacidades de concurrencia de React para un ciclo de renderizado eficiente y carga optimizada.
- **Vite:** Orquestador de desarrollo y empaquetador de producción ultra rápido de nueva generación.
- **Tailwind CSS (v4):** Sistema de diseño basado en utilidades de alto rendimiento con tokens cromáticos adaptados a un modo oscuro premium.
- **Zustand:** Gestor de estado ligero y reactivo para orquestar los perfiles, balances de la billetera y flujos de autenticación.
- **TanStack Router:** Motor de enrutamiento del lado del cliente declarativo y 100% type-safe, que previene rutas rotas en compilación.
- **Vitest:** Framework de pruebas unitarias de velocidad nativa sobre el compilador de Vite.

---

## 3. Hitos Arquitectónicos (Key Highlights)

El sistema incorpora componentes avanzados y patrones de diseño críticos para garantizar la escalabilidad y disponibilidad del servicio:

### 🛡️ Moderación de Imágenes en el Cliente (Edge AI)

- **Lógica Zero-Cost:** Implementación de un motor de moderación neuronal directamente en el navegador del usuario utilizando `@tensorflow/tfjs` y `nsfwjs`.
- **Privacidad y Ahorro:** Las imágenes seleccionadas se convierten a un objeto `HTMLImageElement` temporal en memoria local (`URL.createObjectURL`) y son analizadas localmente por la red convolucional Mobilenet antes de generar cualquier carga útil de red o mutación. Esto elimina costos de computación en la nube para procesamiento de IA y resguarda la privacidad del usuario.
- **Regla Estricta de Bloqueo:** Si el modelo detecta categorías explícitas (`Porn`, `Hentai` o `Sexy`) con una probabilidad estrictamente superior al **60%** (`0.60`), se detiene el flujo, se revocan los recursos de memoria y se bloquea la subida mediante un banner rojo informativo. En caso de fallas de red del CDN del modelo, el sistema aplica un fallback tolerante (safe) para garantizar la continuidad operativa.
- **Mecanismos Anti-Spam:** Incorporación de flags de bloqueo concurrente (`isAnalyzingImage` / `isAnalyzingAvatar`) que inhabilitan cargas paralelas o re-entradas durante el proceso de inferencia, previniendo fugas de memoria y corrupción de estado de UI.

### ⚡ Rendimiento & Resiliencia

- **Code Splitting & Lazy Loading (AI Model):** La carga de librerías neurales de TensorFlow.js se posterga dinámicamente (`await import(...)`) para que ocurra únicamente en el instante en que el usuario activa el dropzone de imágenes o decide cambiar su avatar. El bundle inicial permanece ligero y libre de dependencias pesadas.
- **React Error Boundaries:** Implementación de límites de errores interactivos en el layout general (`AppShell`) y en páginas clave con alta transaccionalidad (`NewsFeed`, `TournamentHub`). En caso de fallos inesperados de procesamiento o desbordamiento de memoria por renderizado 3D de mapas/IA, se captura el error de forma segura y se presenta una UI alternativa elegante que permite recargar el módulo afectado sin interrumpir la sesión ni provocar pantallas en blanco.
- **Zero-Lag Skeleton Loaders:** Transiciones de estado e hidrataciones asíncronas disimuladas mediante esqueletos de precarga que mitigan el lag percibido y mejoran el posicionamiento UX.

### 🧪 Tipado Estricto & Garantía de Calidad (QA)

- **Strict Form Hooks (`useStrictForm`):** Desarrollo de un hook personalizado para validación y sanitización en tiempo de entrada. Bloquea entradas formadas enteramente por espacios vacíos u hojas con espacios iniciales, forzando un deep-trim automático antes de cualquier validación y submit.
- **Cobertura de Pruebas Unitarias:** 100% de éxito en la suite de pruebas unitarias integrando tests asíncronos complejos con simulación del ciclo de vida del cargador de TensorFlow y manipulación de mocks del Canvas DOM del navegador.

---

## 4. Comandos de Desarrollo y Verificación

Para ejecutar la aplicación localmente y realizar controles de calidad, utilice los siguientes comandos en la terminal de la raíz del proyecto:

### Iniciar Entorno de Desarrollo Local

Inicia simultáneamente el servidor de desarrollo de Vite para el frontend y el servidor NestJS para el backend:

```bash
npm run dev
```

### Compilar para Producción

Compila y optimiza el código TypeScript y los assets con Vite, generando el directorio `dist` listo para despliegues estáticos con separación de chunks optimizada:

```bash
npm run build
```

### Ejecutar Pruebas Unitarias (QA)

Corre la suite de pruebas de Vitest para validar los hooks y servicios críticos de la plataforma:

```bash
npm run test
```

### Análisis Estático y Formateado

Inspecciona errores estilísticos y corrige el formato de todos los archivos del código fuente:

```bash
npm run lint
```

```bash
npm run format
```

---

_SportMatch Connect - Proyecto de Ingeniería de Software 2026. Diseñado para un rendimiento premium._
