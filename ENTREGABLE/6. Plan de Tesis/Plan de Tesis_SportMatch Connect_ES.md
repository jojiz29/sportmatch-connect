# PLAN DE PROYECTO FINAL DE CARRERA (PLAN DE TESIS)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RED SOCIAL CON IA EN EL BORDE**

**Plan de Tesis para la Certificación Académica del Proyecto Final de Carrera III**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería**  

---

## 📋 CAPÍTULO I: PLANTEAMIENTO DEL PROBLEMA

### 1.1. Descripción de la Realidad Problemática
A nivel global, el sedentarismo es considerado una de las principales pandemias del siglo XXI. La Organización Mundial de la Salud (OMS, 2020) estima que más de una cuarta parte de la población adulta mundial no realiza suficiente actividad física. En el Perú, la Encuesta Nacional de Actividad Física y Nutrición del Ministerio de Salud (MINSA, 2024) revela que el **72% de los adultos en Lima Metropolitana realiza actividad física insuficiente**.

Paradójicamente, la coordinación de encuentros deportivos amateur (fútbol, pádel, baloncesto, tenis) se realiza de forma caótica e informal utilizando aplicaciones de mensajería generalistas como WhatsApp o Telegram. Este método genera fricciones logísticas e ineficiencias críticas:
*   **Ausencia de Nivelación de Destreza:** Los partidos se organizan con jugadores de niveles deportivos dispares, generando frustración en los participantes y deserción de la práctica deportiva.
*   **Riesgo Financiero y Morosidad:** El organizador debe asumir individualmente el costo del alquiler de la cancha, realizando la cobranza posterior de forma manual a través de billeteras móviles (Yape/Plin), lo que genera fricciones interpersonales y morosidad.
*   **Opacidad en Recintos:** Los recintos deportivos operan en silos aislados, con reservas analógicas por teléfono o cuadernos de notas, impidiendo la visualización de la disponibilidad de canchas en tiempo real.

### 1.2. Formulación del Problema
*   **Problema General:** ¿De qué manera el diseño e implementación de una plataforma informática basada en matchmaking predictivo e inteligencia artificial influye en la eficiencia de la coordinación y en la continuidad de la práctica deportiva recreativa en jóvenes adultos en Lima Metropolitana durante el periodo 2026?
*   **Problemas Específicos:**
    1.  ¿Cómo estructurar un algoritmo predictivo multivariable basado en Elo y Haversine para garantizar partidos equilibrados?
    2.  ¿De qué manera la integración de PostGIS espacial agiliza el tiempo de respuesta en la geolocalización de canchas deportivas?
    3.  ¿Cómo influye una billetera de FitCoins integrada con Stripe en la reducción de la morosidad y las fricciones financieras de reservas compartidas?
    4.  ¿De qué manera un asistente conversacional IA con procesamiento nativo de voz optimiza la accesibilidad y usabilidad de la plataforma?

### 1.3. Objetivos de la Investigación
*   **Objetivo General:** Desarrollar e implementar la plataforma "SportMatch Connect", un sistema de matchmaking deportivo geolocalizado con economía gamificada y asistente inteligente para unificar y optimizar la práctica del deporte amateur en Lima.
*   **Objetivos Específicos:**
    1.  Diseñar y validar un algoritmo predictivo multivariable que combine distancia física, disponibilidad horaria, afinidad deportiva y nivel de destreza Elo.
    2.  Implementar la búsqueda y reserva geolocalizada de recintos deportivos utilizando extensiones espaciales PostGIS en PostgreSQL.
    3.  Desarrollar un sistema transaccional de cobros compartidos basado en FitCoins integrando Stripe para la división automática del costo de alquiler de campos.
    4.  Construir un asistente por voz multimodal ("Sporty") utilizando Google Vertex AI (Gemini 2.5 Flash) y procesamiento nativo de voz (STT/TTS).

### 1.4. Justificación de la Investigación
*   **Justificación Tecnológica:** Aporta una arquitectura desacoplada moderna que implementa **Feature-Sliced Design (FSD)** en el cliente React 19 y un backend modular NestJS 11 con inyección de dependencias modular y seguridad atómica a nivel de base de datos con políticas de Row Level Security (RLS).
*   **Justificación Social:** Promueve la actividad física, reduce el sedentarismo y fortalece la comunidad mediante una red social geolocalizada que incentiva los hábitos de vida saludable.
*   **Justificación Académica:** Proporciona un caso de estudio real de la aplicación de algoritmos probabilísticos (Rating Elo) y computación en el borde (moderación visual local con TensorFlow.js) en proyectos de desarrollo de software universitarios.

---

## 📚 CAPÍTULO II: MARCO TEÓRICO Y ESTADO DEL ARTE

### 2.1. Antecedentes
*   *Playtomic (España):* Líder de reservas de pádel con enfoque transaccional pero limitado en algoritmos predictivos adaptados y gamificación financiera en la región andina.
*   *CourtSide (USA):* Enfoque centrado en emparejamientos estáticos, sin soporte conversacional en tiempo real ni moderación en el borde.

### 2.2. Bases Teóricas
*   **Algoritmo de Haversine:** Mide la distancia ortodrómica $d$ entre dos puntos geográficos $A(\phi_1, \lambda_1)$ y $B(\phi_2, \lambda_2)$ sobre la superficie esférica terrestre:
    
    $$
    d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
    $$

*   **Sistema de Clasificación Elo:** Estima la destreza probabilística de los usuarios, recalculándose dinámicamente tras cada partido registrado mediante la fórmula:
    
    $$
    R'_A = R_A + K \cdot (S_A - E_A)
    $$

*   **Feature-Sliced Design (FSD):** Metodología de arquitectura de frontend que divide la aplicación en capas estructuradas (app, routes, widgets, features, entities, shared), eliminando dependencias circulares.

---

## 🛠️ CAPÍTULO III: METODOLOGÍA Y PLAN DE TRABAJO

### 3.1. Tipo de Investigación
Investigación tecnológica y aplicada, orientada al diseño e implementación de un artefacto de software funcional para resolver un problema de coordinación logística.

### 3.2. Metodología de Desarrollo
Se utiliza el marco ágil **Scrum**, planificado en 8 sprints bi-semanales con control de historias de usuario en Jira Cloud.

### 3.3. Planificación de Sprints (Cronograma)
*   **Sprint 1-2:** Diseño de la base de datos Supabase, políticas RLS, configuración inicial de NestJS y React 19 con FSD.
*   **Sprint 3-4:** Implementación del mapa interactivo con Leaflet y búsquedas espaciales indexadas con PostGIS.
*   **Sprint 5-6:** Desarrollo del algoritmo de matchmaking predictivo multivariable y sistema de reputación (*trust score*).
*   **Sprint 7:** Integración del asistente conversacional de voz Sporty AI con Vertex AI y cobros compartidos Stripe.
*   **Sprint 8:** Pruebas masivas de regresión (Vitest, Playwright), aseguramiento SonarQube y despliegue final en producción.

### 3.4. Presupuesto Detallado
| Recurso | Cantidad | Costo Unitario (PEN) | Costo Total (PEN) |
|---|---|---|---|
| Hardware de Desarrollo | 5 laptops | S/. 3,700.00 | S/. 18,500.00 |
| Hosting & Cloud Compute (Render) | 12 meses | S/. 150.00 | S/. 1,800.00 |
| Servicios DB Supabase & APIs IA | 12 meses | S/. 200.00 | S/. 2,400.00 |
| Licencias de Software | 5 licencias | S/. 240.00 | S/. 1,200.00 |
| Gastos Operativos | Global | S/. 5,300.00 | S/. 5,300.00 |
| **Total General** | | | **S/. 29,200.00** |
