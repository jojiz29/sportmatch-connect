# GUÍA DE COMPLETADO: PÓSTER CAPSTONE, PITCH Y QR

Este documento detalla las especificaciones técnicas, el guion propuesto y el plan de acción para que el equipo complete los entregables visuales y multimedia correspondientes a la carpeta **`7. Poster Capstone, Pitch y QR/`**.

---

## 🎨 1. Póster Capstone (Formato A1 o 1080x1920)

El póster debe ser un resumen visual de alta calidad del proyecto para captar la atención del jurado y la comunidad académica.

### Secciones Recomendadas en el Diseño:
1.  **Cabecera:** Logo de la USIL, título del proyecto (`SportMatch Connect`) y nombres de los integrantes/carrera.
2.  **Problemática:** Gráfico del sedentarismo urbano en Lima y descripción de la fragmentación de coordinaciones.
3.  **Arquitectura de la Solución:** Diagrama simplificado C4 de contenedores (Frontend, Backend, Supabase, APIs de IA).
4.  **Módulos Destacados (Con capturas de pantalla de la UI):**
    *   Matchmaking predictivo (Tarjetas de candidatos con porcentajes de compatibilidad).
    *   Motor de reservas GIS (Mapa con Leaflet).
    *   Asistente "Sporty" (Vertex AI Gemini).
    *   Pasarela Stripe y gamificación.
5.  **Indicadores de Calidad (Métricas de Éxito):**
    *   **541 pruebas automatizadas aprobadas (100% de éxito).**
    *   SonarQube Quality Gate: **PASSED (0 vulnerabilidades).**
    *   Rendimiento: TTFB < 200ms en Render.
6.  **Código QR de Acceso:** QR de gran tamaño en la parte inferior derecha apuntando al despliegue en producción.

---

## 📹 2. Pitch de Negocio (Video de 2-3 Minutos)

El video Pitch (o Elevator Pitch) debe centrarse en vender el valor comercial y tecnológico del MVP de SportMatch Connect.

### Estructura y Guion Propuesto (Duración: 2:30 minutos):

*   **0:00 - 0:30 | El Gancho (The Hook):**
    *   *Visual:* Presentador en cámara, luego transición a estadísticas de sedentarismo y capturas caóticas de grupos de WhatsApp coordinando deportes.
    *   *Voz:* *"¿Sabías que en Lima el 72% de los adultos realiza actividad física insuficiente? La mayor barrera no es la falta de voluntad, sino la ineficiente y fragmentada logística para organizar un partido recreativo, reservar una cancha y dividir los costos..."*
*   **0:30 - 1:15 | La Solución (Demostración de Software):**
    *   *Visual:* Captura de pantalla en tiempo real navegando la PWA de SportMatch Connect. Mostrar la interfaz interactiva Leaflet, el Matchmaking y la pasarela de pagos Stripe.
    *   *Voz:* *"Para resolver esto, creamos SportMatch Connect. Una plataforma integral que consolida todo el ciclo del deporte amateur. Mediante un mapa interactivo geolocalizado en tiempo real y nuestro motor predictivo multivariable Haversine-Elo, conectamos a jugadores con canchas y compañeros de su mismo nivel en segundos..."*
*   **1:15 - 1:45 | La Innovación (Inteligencia Artificial):**
    *   *Visual:* Demostración interactiva de voz con "Sporty". El usuario graba un audio: *"Sporty, búscame un partido de pádel para mañana por la noche"* $\rightarrow$ Sporty responde por voz y muestra los resultados.
    *   *Voz:* *"Además, integramos a 'Sporty', un asistente de voz multimodal desarrollado con Google Vertex AI y Gemini 2.5 Flash, que procesa lenguaje regional para programar partidos conversacionalmente y modera contenido con modelos Edge AI locales."*
*   **1:45 - 2:15 | Viabilidad y Tracción (Finanzas):**
    *   *Visual:* Gráfico de proyecciones financieras y métricas de QA (541 tests, SonarQube).
    *   *Voz:* *"Nuestro modelo de negocio híbrido B2C por suscripciones premium y B2B por comisiones y publicidad segmentada, proyecta un VAN de S/ 84,250 y una TIR de 38.4% a 3 años, certificado con un 100% de éxito en control de calidad de software."*
*   **2:15 - 2:30 | Cierre (Call to Action):**
    *   *Visual:* Código QR de producción, logo del proyecto, frase de impacto: *"Únete a la red deportiva inteligente"*.
    *   *Voz:* *"SportMatch Connect está desplegado y operativo hoy. Escanea el código y experimenta el futuro del deporte amateur."*

---

## 🔗 3. Códigos QR Requeridos

Se deben generar imágenes gráficas de códigos QR en alta definición para los siguientes enlaces de acceso:
1.  **Código QR de Producción:** Apunta al frontend oficial desplegado en Vercel:
    `https://sportmatch-connect.vercel.app`
2.  **Código QR del Código Fuente:** Apunta al repositorio público en GitHub para revisión del jurado:
    `https://github.com/jojiz29/sportmatch-connect`
3.  **Código QR del Video Pitch:** Enlace al video subido a YouTube, Vimeo o Google Drive (con permisos públicos).

---

## 📆 4. Plan de Acción Inmediato para el Equipo
1.  **Paolo Andrade (UI Specialist):** Encargado de diseñar el Póster Capstone en Figma exportándolo a PDF y PNG.
2.  **Juan Alonso Salvatierra (IA Specialist):** Grabar la demostración de voz de Sporty AI para el video.
3.  **Erick Espinoza (Backend Specialist):** Grabar el flujo transaccional con Stripe en modo test.
4.  **Matías Gastelu (QA/DevOps):** Encargado de generar los códigos QR y subirlos a la carpeta `7. Poster Capstone, Pitch y QR/`.
5.  **Edwin Flores (Scrum Master):** Grabar la locución del guion, editar el video final y consolidar el paquete comprimido `Equipo ##.7z`.
