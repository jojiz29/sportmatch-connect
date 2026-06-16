# AR Court Preview — Feasibility Study

Este documento presenta el estudio de viabilidad técnica y arquitectónica para la integración de la funcionalidad **#15 AR Court Preview (Visualización 3D y Realidad Aumentada de canchas deportivas)** en la aplicación SportMatch Connect.

---

## 1. Arquitectura Propuesta

Para ofrecer una experiencia de Realidad Aumentada (AR) integrada en la web sin requerir que el usuario descargue una aplicación móvil nativa (iOS/Android), proponemos un enfoque híbrido basado en la web utilizando estándares modernos:

```
┌─────────────────────────────────────────────────────────┐
│                    Vite + React UI                      │
└────────────────────────────┬────────────────────────────┘
                             │
             [Selección de cancha por el usuario]
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│            Google <model-viewer> (Web Component)        │
└──────────────┬───────────────────────────┬──────────────┘
               │ (WebXR API)               │ (iOS Quick Look)
               ▼                           ▼
┌────────────────────────────┐.  ┌────────────────────────┐
│   Dispositivos Android     │.  │     Dispositivos iOS   │
│ (ARCore / Scene Viewer API)│.  │  (ARKit / USDZ format) │
└────────────────────────────┘.  └────────────────────────┘
```

### Componentes de la Arquitectura:

1.  **Capa de Renderizado Web (3D):** Utilizar el componente web `<model-viewer>` de Google. Este componente encapsula de forma transparente WebXR (para Android/Chrome) e iOS Quick Look (para Safari) bajo un único elemento React.
2.  **Modelos 3D Multi-formato:**
    - **GLB/GLTF:** Formato de transmisión 3D estándar de la industria, optimizado para Android y navegadores web.
    - **USDZ:** Formato de archivo 3D de Apple, requerido para la visualización en realidad aumentada mediante ARKit en dispositivos iOS.
3.  **Hospedaje de Modelos (Supabase Storage):** Los modelos 3D de las canchas (fútbol, tenis, padel) se almacenan en un bucket público y se descargan bajo demanda para optimizar el peso del bundle inicial.

---

## 2. Dependencias Requeridas

Para implementar esta arquitectura en el stack actual, se requeriría agregar:

- `@google/model-viewer` (npm package, ~1.2MB descomprimido).
- Formatos de modelos 3D optimizados en disco (GLB y USDZ para cada tipo de cancha deportiva estándar, de ~1.5MB a ~4MB cada uno).

---

## 3. Complejidad y Análisis Técnico

La complejidad de la implementación se divide en tres frentes:

1.  **Modelado 3D y Conversión de Formatos (Alta Complejidad):**
    - Cada cancha deportiva (Tenis, Padel, Fútbol) debe ser modelada en 3D respetando dimensiones oficiales de escala.
    - Los modelos deben optimizarse (bajo conteo de polígonos, texturas comprimidas) para evitar tiempos de carga prohibitivos en conexiones móviles.
    - Se debe mantener un pipeline de conversión dual (GLTF $\rightarrow$ GLB y GLTF $\rightarrow$ USDZ) sincronizado.
2.  **Detección de Compatibilidad de Hardware (Media Complejidad):**
    - No todos los dispositivos del usuario soportan ARCore o ARKit. El componente debe realizar feature-detection y ofrecer un visor 3D interactivo plano en pantalla (_fallback_) en lugar de AR cuando no haya soporte de cámara.
3.  **Integración en el Router de TanStack (Baja Complejidad):**
    - El montaje del visualizador en las vistas de detalle de cancha (`src/routes/app.courts.$courtId.tsx`) es directo mediante un componente React.

---

## 4. Riesgos Identificados

- **Rendimiento y Tiempos de Carga:** Los archivos 3D pesados pueden colapsar el navegador en smartphones de gama media-baja.
- **Inconsistencia de visualización entre plataformas (Android vs. iOS):** Android utiliza Scene Viewer (basado en Chrome/ARCore) que proyecta el modelo en el espacio físico. iOS abre un visualizador Quick Look nativo que interrumpe la aplicación web. Lograr una experiencia unificada requiere gran cantidad de código a la medida.
- **Permisos de Cámara y Políticas del Navegador:** Los navegadores restringen el acceso a la cámara y los sensores giroscópicos a menos que se cuente con HTTPS seguro y una interacción explícita del usuario (click en botón).

---

## 5. Estimación de Tiempo de Desarrollo

- **Día 1:** Modelado 3D básico de 3 canchas (tenis, padel, fútbol 5), texturizado ligero y exportación a formatos GLB y USDZ.
- **Día 2:** Setup del componente `<model-viewer>` en React, configuración de la carga dinámica desde Supabase Storage, y testeo de compatibilidad de cámara.
- **Día 3:** Implementación del fallback 3D interactivo en móviles no compatibles, y pulido de UI de posicionamiento espacial.
- **Día 4:** Pruebas e integración de realidad mixta en iOS Safari y Android Chrome, resolución de problemas de escalabilidad y rendering en dispositivos físicos reales.

### Esfuerzo Estimado Total: **4 Días Hábiles (32 horas de desarrollo)**

---

## 6. Decisión de Implementación (Veredicto de Viabilidad)

> [!WARNING]
> **ESFUERZO ESTIMADO SUPERA EL LÍMITE DE 2 DÍAS.**
>
> En cumplimiento estricto con las directrices de alcance de este Sprint (donde cualquier desarrollo que supere los 2 días hábiles debe ser descartado del MVP para evitar sobreingeniería), **se determina NO IMPLEMENTAR directamente la visualización AR en esta fase**.
>
> Se conserva el presente análisis arquitectónico y de dependencias para habilitar su desarrollo en sprints posteriores de la Fase V2 de SportMatch Connect.
