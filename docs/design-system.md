# 🎨 SportMatch Design System Manual

Bienvenido a las especificaciones de diseño e identidad visual de **SportMatch**. Este manual detalla las directrices estéticas y técnicas para mantener la consistencia en el desarrollo de la interfaz de la aplicación.

---

## 1. Fundamentos Visuales (Aesthetics & Color)

SportMatch utiliza una estética moderna basada en un **Sleek Dark Mode** con detalles en **tonos neón HSL** y efectos de vidrio (**glassmorphism**).

### Paleta de Colores (HSL):

Las variables de color están definidas en `src/index.css` y mapeadas a clases Tailwind:

- **Fondo General (`--background`)**: `240 10% 3.9%` (Casi negro profundo, otorga un look tecnológico premium).
- **Fondo de Tarjetas (`--card` / `--popover`)**: `240 10% 6%` con bordes sutiles de color `--border` (`240 5.9% 15%`) y opacidad.
- **Color Primario (`--primary`)**: `263.4 70% 50.4%` (Violeta vibrante para branding y elementos interactivos principales).
- **Color Neón Principal (`--neon`)**: `142.1 70.6% 45.3%` (Verde esmeralda neón para balances de FitCoins, ratings, éxitos y botones de acción principal).
- **Color Eléctrico (`--electric`)**: `190 90% 50%` (Azul cian eléctrico para partidos y métricas secundarias).
- **Texto Principal (`--foreground`)**: `0 0% 98%` (Blanco puro para legibilidad óptima).
- **Texto Secundario (`--muted-foreground`)**: `240 5% 64.9%` (Gris suave para leyendas, descripciones y fechas).

### Degradados de Firma (Signature Gradients):

- **Gradient Primary**: `bg-gradient-primary` (De violeta a cian eléctrico).
- **Gradient Neon**: `bg-gradient-neon` (De verde neón a esmeralda).
- **Gradient Card**: `bg-gradient-card` (De gris oscuro traslúcido a fondo transparente para efecto de profundidad).

---

## 2. Tipografía & Espaciado (Typography & Spacing)

SportMatch utiliza **Tailwind CSS v4** con una estructura de fuentes limpia:

- **Fuente Principal**: `Inter` u `Outfit` cargadas desde Google Fonts.
- **Encabezados (`h1`, `h2`, `h3`)**: Fuentes gruesas (`font-bold` u `font-extrabold`) con tracking ajustado (`tracking-tight`) para un look moderno de revista digital.
- **Espaciado**: Todos los contenedores principales deben usar márgenes generosos (`px-4 py-8` en móviles y `lg:px-8 lg:py-12` en pantallas grandes). Los elementos de tarjetas deben agruparse con `space-y-4` o grillas de `gap-4` para maximizar el espacio en blanco y evitar sensación de saturación.

---

## 3. Animaciones & Micro-interacciones (Framer Motion)

Las animaciones dan vida a la experiencia deportiva y mejoran la retención del usuario. Usamos **Framer Motion** bajo las siguientes pautas:

### Transición de Rutas:

Ubicado en [\_\_root.tsx](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/src/routes/__root.tsx), cada cambio de página ejecuta un deslizamiento físico suave:

- **Entrada**: `initial={{ opacity: 0, x: 20 }}`
- **Activo**: `animate={{ opacity: 1, x: 0 }}`
- **Salida**: `exit={{ opacity: 0, x: -20 }}`
- **Curva**: `transition={{ duration: 0.2, ease: "easeOut" }}`

### Swipe de Matchmaking:

Las tarjetas de jugadores en la cola de matchmaking deslizan con arrastre interactivo:

- Al soltar a la derecha (Like) o izquierda (Dislike), la tarjeta vuela fuera de la pantalla con una aceleración física natural (`exit={{ x: 200, opacity: 0 }}`).
- Un sutil giro angular de `rotate: 5` se aplica dinámicamente mientras se arrastra (`whileDrag={{ rotate: 5, scale: 1.05 }}`).

---

## 4. Componentes Atómicos (Shadcn UI en `shared/ui`)

SportMatch utiliza componentes de UI atómicos, encapsulados en `src/shared/ui/` para evitar código redundante.

### Catálogo Clave de Componentes:

- **`<Button>`**: Botones reactivos con variantes `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` y `glass`.
- **`<Dialog>`**: Ventanas modales accesibles (de Radix UI) utilizadas para confirmaciones críticas, como el canje de FitCoins.
- **`<Avatar>`**: Renderizador seguro de fotos de perfil de usuarios con placeholders automáticos.
- **`<Badge>`**: Etiquetas de estado y filtros de categorías (e.g., tipo de deporte: Pádel, Fútbol).
- **`<Card>`**: Contenedores estructurados con degradado integrado `bg-gradient-card` y efectos de bordes sutiles.
- **`<Sonner>`**: Habilitado en la raíz del proyecto para emitir toques visuales (Toasts) como `toast.success` y `toast.error`.
