# GUÍA DE ESTRUCTURA Y DIAPOSITIVAS: PRESENTACIÓN DE DEFENSA (PPT)

Este documento detalla la estructura diapositiva por diapositiva para la exposición de 20 minutos ante el jurado, alineado a los criterios del **Informe de Evaluación**.

---

## 🖥️ Estructura Diapositiva por Diapositiva

### Diapositiva 1: Portada (Título e Integrantes)
*   **Título:** SportMatch Connect: Plataforma Deportiva Inteligente.
*   **Subtítulo:** Matchmaking predictivo, Reservas Geolocalizadas y Asistente Multimodal en el Borde.
*   **Visual:** Imagen del logotipo, fondo negro elegante.
*   **Texto obligatorios:** Integrantes (Edwin, Paolo, Erick, Matías, Juan) con DNI y códigos, carrera de Ingeniería de Sistemas de Información / Software de la USIL, Asesor (Ing. Kenny Neira), Bloque y año (2026).

### Diapositiva 2: Planteamiento del Problema
*   **Título:** La Pandemia Silenciosa del Sedentarismo.
*   **Métricas Clave:** 72% de adultos con inactividad física en Lima (MINSA 2024).
*   **Fricciones de Coordinación:** WhatsApps caóticos, morosidad en cobros y canchas con reservas telefónicas arcaicas.
*   **Visual:** Árbol de problemas en diagrama y capturas visuales de chats caóticos de WhatsApp.

### Diapositiva 3: Objetivos del Proyecto
*   **Título:** Objetivos y Solución Propuesta.
*   **Objetivo General:** Unificar el ciclo de organización del deporte amateur mediante un MVP geolocalizado con IA.
*   **Objetivos Específicos:** Algoritmo de emparejamiento, mapa PostGIS, pagos con Stripe y asistente por voz "Sporty".

### Diapositiva 4: Desarrollo Metodológico
*   **Título:** Metodología: Design Thinking y Lean Startup.
*   **DT:** Fases de Empatizar (User Journey) $\rightarrow$ Testear (validación de usabilidad).
*   **Lean Startup:** Hipótesis del MVP de valor comercial y retención del deportista.
*   **Visual:** Diagrama de flujo de las etapas metodológicas y modelo de negocio Canvas (BMC).

### Diapositiva 5: Arquitectura del Sistema
*   **Título:** Arquitectura Multicapa Desacoplada.
*   **Frontend:** React 19 + TypeScript organizado con Feature-Sliced Design (FSD).
*   **Backend:** NestJS 11 + Prisma ORM modular.
*   **Persistencia:** Supabase PostgreSQL con PostGIS y políticas Row Level Security (RLS).
*   **Visual:** Diagrama C4 de Contenedores y topología de despliegue cloud (Vercel CDN + Render).

### Diapositiva 6: Módulos de Software Clave
*   **Título:** Innovación de Software y Motores de la App.
*   **1. Matchmaking Predictivo:** Algoritmo Elo + distancia Haversine.
*   **2. Reservas PostGIS:** Buscador de canchas sobre mapa Leaflet interactivo con optimización de caché de marcadores.
*   **3. Economía FitCoins:** Monedero virtual integrado con Stripe para división de cobros compartidos.
*   **4. Asistente Conversacional Sporty:** Gemini 2.5 Flash en el backend con transcripción de voz nativa (STT/TTS).

### Diapositiva 7: Control de Calidad de Software (QA)
*   **Título:** Aseguramiento de Calidad y Pruebas Automatizadas.
*   **Métricas de QA:** **541 pruebas automatizadas aprobadas con 100% de éxito** (205 tests unitarios frontend y 336 tests backend Jest/Playwright).
*   **Auditoría de Código:** SonarQube Quality Gate: **PASSED (0 vulnerabilidades).**
*   **Visual:** Gráfica de cobertura de código y captura de consola ejecutando `npm run test` con éxito total.

### Diapositiva 8: Viabilidad Financiera y Retorno
*   **Título:** Proyecciones Financieras a 3 Años.
*   **Monetización:** Cobro del 5% de comisiones a los complejos, suscripción premium y publicidad.
*   **Indicadores Clave:** VAN de S/ 84,250.00 PEN y TIR del 38.4%. Recuperación de inversión (Payback) en 14 meses.

### Diapositiva 9: Conclusiones y Recomendaciones
*   **Título:** Cierre de la Defensa.
*   **Conclusiones:** 7 conclusiones alineadas a los objetivos de tesis.
*   **Recomendaciones:** Maduración de modelos en el borde y expansión geográfica de reservas B2B a provincias.
