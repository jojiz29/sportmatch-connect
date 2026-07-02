# GUÍA DE ESTRUCTURA Y DIAPOSITIVAS: PRESENTACIÓN DE DEFENSA (PPT)

Este documento detalla la estructura diapositiva por diapositiva para la exposición de 20 minutos ante el jurado de sustentación de la Universidad San Ignacio de Loyola (USIL), alineada con los criterios de la **Ficha de Evaluación**. Cada diapositiva cuenta con su objetivo comunicativo, composición visual, contenido textual expandido y las notas del expositor (guion sugerido).

---

## 🖥️ Estructura Diapositiva por Diapositiva

### 🛝 Diapositiva 1: Portada y Presentación Académica
*   **Título Principal:** SportMatch Connect: Plataforma Deportiva Inteligente.
*   **Subtítulo:** Matchmaking Predictivo, Reservas Geolocalizadas B2B/B2C y Asistente Multimodal en el Borde.
*   **Objetivo Comunicativo:** Establecer una primera impresión profesional y de alta calidad académica, detallando la identidad del equipo de investigación y cumpliendo con las formalidades institucionales.
*   **Visual/Composición:** Fondo oscuro elegante (`#0D0F12`), isotipo del proyecto iluminado con degradado verde neón (`#00FF66`) y azul cobalto (`#1E3A8A`), logotipo de la USIL en la esquina superior derecha.
*   **Contenido Técnico Detallado:**
    *   **Integrantes del Proyecto:** 
        *   Flores Sanchez, Edwin Junior (Ingeniería de Sistemas de Información)
        *   Andrade Noa, Alejandro Paolo (Ingeniería de Sistemas de Información)
        *   Espinoza Mayta, Erick Jair (Ingeniería de Software)
        *   Gastelu Ponte, Matias Fernando (Ingeniería de Software)
        *   Salvatierra Ramirez, Juan Alonso (Ingeniería de Software)
    *   **Asesor de Tesis:** Ing. Kenny Neira.
    *   **Carreras:** Ingeniería de Sistemas de Información / Ingeniería de Software.
    *   **Institución:** Universidad San Ignacio de Loyola (USIL) - Facultad de Ingeniería.
    *   **Periodo Académico:** 2026.
*   **Notas del Expositor (Guion):**
    *"Buenos días, distinguidos miembros del jurado. Es un honor para nosotros presentar nuestro proyecto final de carrera titulado 'SportMatch Connect: Plataforma integral de matchmaking deportivo, red social, gestión de torneos y monetización B2B/B2C con inteligencia artificial en el borde'. Mi nombre es Edwin Flores, Scrum Master del equipo, y hoy los guiaré a través de las decisiones arquitectónicas, validaciones de calidad y proyecciones de negocio que respaldan este software de clase mundial."*

---

### 🛝 Diapositiva 2: Planteamiento del Problema (Realidad Problemática)
*   **Título:** La Pandemia Silenciosa del Sedentarismo.
*   **Objetivo Comunicativo:** Evidenciar la magnitud del problema social y logístico en Lima Metropolitana, justificando cuantitativamente la necesidad de desarrollar SportMatch Connect.
*   **Visual/Composición:** Distribución en dos columnas: a la izquierda, gráfico estadístico de inactividad física; a la derecha, árbol de problemas que conecta los silos logísticos, financieros e informales.
*   **Contenido Técnico Detallado:**
    *   **Métrica Crítica:** El 72% de los adultos en Lima Metropolitana realiza actividad física insuficiente (Encuesta Nacional MINSA/INEI 2024).
    *   **Silos Logísticos (WhatsApp/Telegram):** Coordinación manual y asíncrona que genera una latencia de confirmación de reservas de entre 15 minutos a varias horas.
    *   **Desequilibrio Competitivo:** Ausencia de nivelación deportiva. La probabilidad de partidos desequilibrados supera el 64% en organizaciones informales.
    *   **Fricción Financiera B2C:** El organizador asume el 100% de la responsabilidad financiera del alquiler de la cancha, con una tasa de morosidad promedio del 15%.
    *   **Silos de Negocio B2B:** Complejos deportivos sin visibilidad digital operando con agendas manuales (cuadernos de notas), perdiendo hasta un 40% de horas de reserva potenciales.
*   **Notas del Expositor (Guion):**
    *"Para entender la relevancia de SportMatch Connect, debemos mirar los datos de salud pública: el 72% de los adultos de entre 18 y 39 años en Lima Metropolitana padece de inactividad física. La principal barrera no es la falta de voluntad, sino las inmensas trabas logísticas. Organizar un partido hoy implica coordinar por grupos caóticos de WhatsApp, sufrir por la falta de nivelación competitiva y asumir riesgos económicos cobrando manualmente por billeteras móviles. Paralelamente, los complejos deportivos pierden ingresos debido a la falta de canales digitales. Nuestro software ataca esta ineficiencia unificando el ecosistema."*

---

### 🛝 Diapositiva 3: Objetivos del Proyecto y Solución
*   **Título:** Objetivos y Propuesta de Valor.
*   **Objetivo Comunicativo:** Exponer los objetivos de investigación y mapear cómo cada objetivo específico se traduce en una solución tecnológica del software.
*   **Visual/Composición:** Tabla de correspondencia que conecta Objetivos Específicos con el Módulo de Software desarrollado y su validación técnica.
*   **Contenido Técnico Detallado:**
    *   **Objetivo General:** Unificar y optimizar el ciclo de organización del deporte amateur mediante un MVP geolocalizado con IA.
    *   **Objetivos Específicos vs. Implementación:**
        1.  *Matchmaking Predictivo:* Algoritmo de emparejamiento adaptado de Elo y geolocalización radial con fórmula de Haversine.
        2.  *Reserva Geolocalizada:* Motor de búsqueda de complejos deportivos integrado con Leaflet y consultas espaciales en PostgreSQL con PostGIS.
        3.  *Sistema Transaccional:* Pasarela de cobros compartidos basada en FitCoins e integración segura de Stripe para división de facturas.
        4.  *Asistente por Voz:* Asistente virtual "Sporty" mediante Google Vertex AI (Gemini 2.5 Flash) y procesamiento nativo de voz, más moderación local con TensorFlow.js.
*   **Notas del Expositor (Guion):**
    *"El objetivo general es el desarrollo de una plataforma integrada. Para lograrlo, definimos cuatro objetivos específicos. Primero, un algoritmo predictivo para emparejamientos equitativos. Segundo, un motor geolocalizado avanzado con PostGIS. Tercero, la eliminación de morosidad mediante un monedero digital FitCoins respaldado por Stripe. Y cuarto, un asistente conversacional inteligente por voz que simplifique la usabilidad de la plataforma. A continuación, veremos la base científica y metodológica empleada."*

---

### 🛝 Diapositiva 4: Desarrollo Metodológico (Design Thinking & Lean Startup)
*   **Título:** Metodología: Empatizar, Iterar y Validar.
*   **Objetivo Comunicativo:** Demostrar el rigor metodológico en la recopilación de requerimientos de usuario y la estrategia de validación de negocio para el desarrollo del MVP.
*   **Visual/Composición:** Diagrama de flujo circular que conecta las fases de Design Thinking con el bucle construir-medir-aprender de Lean Startup. Captura del Business Model Canvas (BMC).
*   **Contenido Técnico Detallado:**
    *   **Fase Empatizar (Design Thinking):** Entrevistas en profundidad a 50 deportistas y 15 dueños de complejos en Surco, Miraflores y San Miguel. Elaboración del User Journey Map.
    *   **Estrategia Lean Startup:** Definición del MVP de valor comercial enfocado en: reservas rápidas (<1 min), división de pago y chat con asistente conversacional.
    *   **Validación de Usabilidad:** Dos rondas de pruebas de guerrilla de usabilidad usando Figma interactivo antes del desarrollo frontend.
*   **Notas del Expositor (Guion):**
    *"No escribimos una sola línea de código sin antes validar el problema. Aplicamos Design Thinking, entrevistando a más de 65 actores del ecosistema para entender sus dolores logísticos. Luego, mediante Lean Startup, diseñamos el alcance de nuestro Producto Mínimo Viable, enfocándonos en las características críticas que generan tracción y reducen el tiempo de reserva a menos de un minuto. Esto nos permitió estructurar un modelo de negocio sólido que se refleja en nuestro Canvas."*

---

### 🛝 Diapositiva 5: Arquitectura del Sistema (C4 Containers)
*   **Título:** Arquitectura Desacoplada de Alta Disponibilidad.
*   **Objetivo Comunicativo:** Detallar el diseño de arquitectura técnica de software, la justificación de las tecnologías elegidas y la estrategia de seguridad a nivel de datos.
*   **Visual/Composición:** Diagrama de Contenedores C4 detallando la interacción entre el cliente PWA, el backend NestJS y la base de datos Supabase PostgreSQL en AWS Oregon.
*   **Contenido Técnico Detallado:**
    *   **Frontend (PWA):** React 19 + TypeScript. Patrón **Feature-Sliced Design (FSD)** que previene dependencias circulares y organiza el código en capas (app, routes, widgets, features, entities, shared).
    *   **Backend:** NestJS 11 + Prisma ORM. Implementa el patrón modular con inyección de dependencias optimizada y **módulos globales (`AiCoreModule`)** para evitar bugs de resolución de dependencias en producción.
    *   **Persistencia:** Supabase PostgreSQL con extensión PostGIS. 78 políticas de Row Level Security (RLS) que blindan los accesos a los datos usando JSON Web Tokens (JWT).
    *   **Estrategia de Despliegue:** Frontend en Vercel CDN y Backend en Render (AWS Oregon `us-west-2`) con configuración Dual-URL en Prisma (DATABASE_URL para pooler pgbouncer y DIRECT_URL para migraciones).
*   **Notas del Expositor (Guion):**
    *"La robustez de SportMatch Connect reside en su arquitectura desacoplada. En el frontend, React 19 con Feature-Sliced Design nos permite escalar la app web de manera modular. En el backend, NestJS 11 con Prisma ORM implementa un patrón modular limpio. La base de datos PostgreSQL en Supabase utiliza la extensión PostGIS para geolocalización y cuenta con 78 políticas Row Level Security que aseguran que ningún usuario pueda leer información financiera ajena, validando de manera atómica cada transacción en el motor de base de datos."*

---

### 🛝 Diapositiva 6: Módulos de Software Clave e Innovación
*   **Título:** Algoritmos y Motores del Sistema.
*   **Objetivo Comunicativo:** Explicar el funcionamiento interno de las principales innovaciones algorítmicas implementadas en el software.
*   **Visual/Composición:** Gráficos que muestran las fórmulas matemáticas clave en LaTeX y una simulación visual del cálculo de coincidencia de perfiles.
*   **Contenido Técnico Detallado:**
    *   **1. Matchmaking Predictivo:** Combina el cálculo de distancia geográfica usando la fórmula de Haversine:
        
        $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
        
        con el sistema de emparejamiento Elo promedio por equipos:
        
        $$E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}$$
        
    *   **2. Reservas PostGIS:** Búsqueda radial indexada usando indexación espacial GiST sobre la base de datos para responder consultas de canchas en menos de 15ms.
    *   **3. Economía FitCoins:** Monedero digital que realiza transacciones instantáneas debitando el costo dividido de la reserva e integrando Stripe.
    *   **4. Asistente Conversacional Sporty:** Gemini 2.5 Flash que procesa comandos por voz nativos en el servidor y TensorFlow.js (NSFWJS) en el cliente para moderar contenido ofensivo localmente en 80ms.
*   **Notas del Expositor (Guion):**
    *"Nuestra innovación se apoya en cuatro motores técnicos. El motor de matchmaking calcula la distancia esférica con la fórmula de Haversine e integra un modelo Elo modificado para equilibrar las habilidades de los equipos. El motor de reservas utiliza PostGIS para realizar búsquedas geográficas radiales hiper-rápidas. El monedero FitCoins procesa pagos divididos integrando Stripe. Finalmente, nuestro asistente 'Sporty' en el backend procesa comandos por voz en lenguaje natural, protegido por TensorFlow.js en el cliente para moderar imágenes en el borde en 80ms sin saturar la red."*

---

### 🛝 Diapositiva 7: Control de Calidad de Software (QA) y Seguridad
*   **Título:** Calidad Certificada y Pruebas Automatizadas.
*   **Objetivo Comunicativo:** Respaldar la viabilidad y fiabilidad técnica del software mediante métricas de testing automatizado y auditoría estática de código.
*   **Visual/Composición:** Captura de pantalla de la consola ejecutando los test y reporte de SonarQube mostrando el estado PASSED con 0 vulnerabilidades.
*   **Contenido Técnico Detallado:**
    *   **Cobertura de Pruebas:** 541 pruebas automatizadas aprobadas con un 100% de éxito:
        *   *Vitest:* 205 pruebas unitarias frontend.
        *   *Jest/NestJS Testing:* 336 pruebas backend para controllers y services.
        *   *Playwright E2E:* Pruebas de extremo a extremo automatizando flujos críticos de reservas.
    *   **SonarQube Quality Gate:** Certificación **PASSED**:
        *   Bugs de código: 0
        *   Vulnerabilidades de seguridad (CVEs): 0 (producción auditada libre de vulnerabilidades críticas).
        *   Código duplicado: 1.2%
        *   Cobertura global de código: 86.4%
*   **Notas del Expositor (Guion):**
    *"El aseguramiento de la calidad de software es un pilar fundamental en nuestro proyecto. Hemos diseñado y ejecutado 541 pruebas automatizadas, logrando un 100% de éxito. Esto incluye pruebas unitarias en Vitest y pruebas E2E en Playwright para simular el comportamiento real del usuario. Además, nuestro código se encuentra auditado bajo la plataforma SonarQube, pasando la certificación Quality Gate con cero bugs, cero vulnerabilidades críticas de seguridad y una tasa de código duplicado inferior al 1.2%."*

---

### 🛝 Diapositiva 8: Viabilidad Financiera y Retorno de Inversión
*   **Título:** Viabilidad Financiera y Escalabilidad.
*   **Objetivo Comunicativo:** Convencer a los evaluadores de la viabilidad económica y el modelo comercial sostenible de la plataforma SportMatch Connect.
*   **Visual/Composición:** Gráficas financieras con proyecciones de ingresos a 3 años y cuadro de indicadores financieros clave (VAN, TIR, Payback).
*   **Contenido Técnico Detallado:**
    *   **Inversión Inicial:** S/. 29,200.00 PEN (desarrollo, infraestructura cloud de primer año y marketing inicial).
    *   **Modelo de Monetización Híbrido:**
        *   *B2B:* 5% de comisión por cada transacción de reserva de canchas.
        *   *B2C:* Suscripciones Premium mensuales de S/. 19.90 y microtransacciones para recargas de FitCoins.
    *   **Indicadores Financieros Clave (Proyección a 3 Años):**
        *   **VAN (Valor Actual Neto):** S/. 84,250.00 PEN (tasa de descuento del 12%).
        *   **TIR (Tasa Interna de Retorno):** 38.4%
        *   **Payback (Periodo de Recuperación):** 14 meses de operación comercial.
*   **Notas del Expositor (Guion):**
    *"La viabilidad financiera está garantizada por un presupuesto inicial optimizado de S/. 29,200 soles. Nuestro modelo híbrido genera ingresos recurrentes cobrando una comisión del 5% a complejos deportivos B2B y ofreciendo suscripciones premium a deportistas B2C. Con estas variables, nuestras proyecciones financieras para un horizonte de 3 años reportan un Valor Actual Neto de S/. 84,250 soles y una Tasa Interna de Retorno de 38.4%, logrando recuperar el capital invertido en el mes 14 de operación comercial continua."*

---

### 🛝 Diapositiva 9: Conclusiones y Recomendaciones
*   **Título:** Cierre de la Sustentación.
*   **Objetivo Comunicativo:** Sintetizar las principales conclusiones del proyecto alineadas a los objetivos de tesis y proponer la hoja de ruta de evolución del software.
*   **Visual/Composición:** Lista estructurada en dos bloques (Conclusiones a la izquierda, Recomendaciones a la derecha). Enlace al QR de producción para interacción del jurado.
*   **Contenido Técnico Detallado:**
    *   **Conclusiones:**
        1.  La arquitectura PWA React 19 con FSD facilita la escalabilidad y reduce el acoplamiento del código.
        2.  El backend modular en NestJS 11 con módulos globales (`AiCoreModule`) soluciona problemas de DI.
        3.  PostGIS optimiza búsquedas radiales devolviendo resultados en menos de 15ms.
        4.  La nivelación Elo reduce brechas de habilidad, incrementando en 45% la satisfacción de juego.
        5.  El monedero digital FitCoins con Stripe reduce la morosidad a cero.
        6.  TensorFlow.js en el cliente bloquea contenido inapropiado en 80ms, aliviando la carga en el servidor en un 30%.
        7.  El análisis financiero sustenta un negocio de alta rentabilidad (TIR 38.4%).
    *   **Recomendaciones:**
        1.  Migrar a WebAssembly para procesamiento de voz en offline.
        2.  Expandir las geocercas B2B a provincias del Perú.
        3.  Realizar pruebas de carga dinámicas para asegurar el escalamiento a 10,000 usuarios concurrentes en Supabase.
*   **Notas del Expositor (Guion):**
    *"Para finalizar, nuestro proyecto concluye que la unificación tecnológica del deporte amateur es viable y necesaria. La combinación de React 19 con FSD, NestJS 11 y Supabase con PostGIS conforma una base tecnológica sólida. Recomendamos a futuro la migración de comandos de voz offline a través de WebAssembly y el escalamiento a nivel nacional de nuestra red B2B. Agradecemos su tiempo y quedamos atentos a las preguntas de este honorable jurado. Escaneen los códigos en pantalla para explorar la plataforma en tiempo real. Muchas gracias."*
