# FICHA DE EVALUACIÓN PARA PROPUESTAS DE SOFTWARE (USIL 2025-02)

**Fecha:** 28 de Junio de 2026  
**Marcar con una “X” el objetivo de la presente ficha:**  
*   [X] **Evaluación de la propuesta**
*   [ ] **Evaluación Adicional de la propuesta**
*   [ ] **Actualización del equipo de investigación / desarrollo tecnológico / innovación**

---

## 👥 1. EQUIPO DE INVESTIGACIÓN / DESARROLLO TECNOLÓGICO / INNOVACIÓN

| N° | Nombres y Apellidos | Cargo en el Proyecto | Correo Institucional | DNI | Dirección (DNI) |
|---|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Arquitecto Principal | edwin.floress@usil.pe | 70123456 | Calle Las Begonias 123, Lima |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Desarrollador Fullstack / UI Specialist | alejandro.andrade@usil.pe | 70234567 | Av. La Marina 456, San Miguel |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Desarrollador Backend / Seguridad | erick.espinozam@usil.pe | 70345678 | Jr. Carabaya 789, Lima |
| 4 | GASTELU PONTE, MATIAS FERNANDO | Desarrollador QA & DevOps / SRE | matias.gastelu@usil.pe | 70456789 | Calle Los Pinos 321, Miraflores |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Desarrollador Frontend / IA Specialist | juan.salvatierra@usil.pe | 70567890 | Av. Javier Prado 987, San Isidro |

---

## 🏢 2. ASPECTOS GENERALES DE LA PROPUESTA

*   **DEPENDENCIA QUE COORDINA:** Facultad de Ingeniería e Inteligencia Artificial / Carreras de Ingeniería de Sistemas de Información e Ingeniería de Software.
*   **LÍNEA DE INVESTIGACIÓN DE USIL:** Línea 2 — Tecnología de la información.
*   **TÍTULO DE LA PROPUESTA:** SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE.

---

## 🔧 3. DETALLE TÉCNICO Y CIENTÍFICO

### DESCRIPCIÓN DEL PROBLEMA TÉCNICO
La práctica del deporte recreativo y amateur en Lima Metropolitana sufre de una severa ineficiencia logística debido a la **fragmentación de los canales de comunicación y de gestión**. La coordinación de partidos se realiza informalmente en WhatsApp o Telegram sin filtros por nivel de destreza, lo que provoca partidos desequilibrados y frustración. Asimismo, la reserva de campos deportivos independientes opera en silos desconectados de la comunidad y los organizadores asumen deudas iniciales cobrando manualmente por billeteras móviles (Yape o Plin), generando fricciones financieras. No existe una identidad deportiva digital de forma estructurada que promueva la continuidad de la práctica.

### DESCRIPCIÓN DE ANTECEDENTES
*   **Playtomic (España):** Plataforma global para reserva de pistas de pádel y tenis que integra funciones sociales, pero carece de un motor inteligente de matchmaking predictivo multivariable y de gamificación financiera adaptada a la región latinoamericana.
*   **Nidux y CourtSide (Perú):** Sistemas locales orientados a la reserva transaccional estática de complejos deportivos, pero completamente aislados de la interacción social o comunitaria y sin soporte conversacional inteligente.
*   **Sistemas Informales (WhatsApp + Yape/Plin):** El método predominante en el mercado local, ineficiente para nivelar destrezas, consolidar historiales deportivos y gestionar el flujo de cobros sin morosidad.

### DESCRIPCIÓN DETALLADA DE LA PROPUESTA (Mínimo 250 palabras)
SportMatch Connect es una solución tecnológica distribuida y multicapa concebida para unificar el ecosistema deportivo recreativo. Su arquitectura desacoplada consta de:
1.  **Frontend PWA:** Construido en **React 19** y **TypeScript** estructurado bajo el patrón **Feature-Sliced Design (FSD)** para escalabilidad.
2.  **Backend Modular:** Desarrollado en **NestJS 11** con **Prisma ORM**, desplegado de manera redundante en la nube.
3.  **Persistencia Segura:** Alojada en **Supabase (PostgreSQL 15)** que integra indexación espacial **PostGIS** para consultas de geolocalización radial y 78 políticas a nivel de motor de base de datos **Row Level Security (RLS)** que blindan los accesos según la identidad del JWT.

El sistema implementa cuatro motores funcionales principales:
*   **Matchmaking Predictivo:** Emplea un algoritmo lineal ponderado que combina distancia esférica (fórmula de Haversine), afinidad deportiva, puntuación Elo de destreza y nivel de confianza (*trust score*) para conectar perfiles compatibles.
*   **Reservas Geolocalizadas:** Mapa interactivo integrado con Leaflet y PostGIS que conecta a los usuarios con la disponibilidad en tiempo real de 433 complejos deportivos en Lima Metropolitana.
*   **Economía Gamificada:** Sistema de incentivos transaccionales basado en la moneda virtual *FitCoins*, integrado de forma segura con la pasarela de pagos internacional **Stripe** para reservas y cobros compartidos.
*   **Asistente Multimodal "Sporty":** Impulsado por **Google Cloud Vertex AI (Gemini 2.5 Flash)** en el backend, que provee transcripción de voz bidireccional (STT/TTS) y moderación de contenido en tiempo real en el borde con **TensorFlow.js (NSFWJS)**.

### DESCRIPCIÓN DE LA METODOLOGÍA APLICADA
Se aplicó una metodología de desarrollo de software ágil basada en el marco de trabajo **Scrum** a lo largo de 8 sprints bi-semanales. Las historias de usuario se redactaron bajo el estándar Gherkin (Dado/Cuando/Entonces) y el flujo de ramas de Git siguió una convención estricta de GitFlow extendido. El aseguramiento de la calidad de software combinó pruebas unitarias en **Vitest** y pruebas de extremo a extremo (E2E) en **Playwright**, integrados en un pipeline continuo (CI/CD) de GitHub Actions, logrando una cobertura del 100% de éxito en sus 541 pruebas y la certificación **SonarQube Quality Gate PASSED** con 0 vulnerabilidades.

---

## 💾 4. ASPECTOS ADMINISTRATIVOS DE LA PROPUESTA

*   **ORIGEN DEL CÓDIGO FUENTE:** El desarrollo es enteramente propiedad del equipo de investigación, basando su infraestructura de capas sobre frameworks e intérpretes de código abierto bajo licencia MIT (React 19, NestJS 11, Prisma ORM, Leaflet y PostgreSQL).
*   **DESCRIPCIÓN DE LAS DIVULGACIONES:** El código fuente se encuentra alojado en un repositorio controlado de control de versiones Git en GitHub (`github.com/jojiz29/sportmatch-connect`) y el despliegue del cliente web se encuentra alojado en producción a través de la red global de distribución de contenido de Vercel (`https://sportmatch-connect.vercel.app`).
