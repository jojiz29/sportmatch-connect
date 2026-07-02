# GUÍA DE ESTRUCTURA Y DIAPOSITIVAS: PRESENTACIÓN DE DEFENSA (PPT)

Este documento detalla la estructura diapositiva por diapositiva para la exposición de 20 minutos ante el jurado de sustentación de la Universidad San Ignacio de Loyola (USIL), alineada con los criterios de la **Ficha de Evaluación**. Cada diapositiva cuenta con su objetivo comunicativo, composición visual, contenido textual expandido y las notas del expositor (guion sugerido).

---

## 🖥️ Estructura Diapositiva por Diapositiva

### 🛝 Diapositiva 1: Portada y Presentación Académica
*   **⏱️ Tiempo Recomendado:** 1 minuto
*   **🎤 Expositor:** Edwin Flores
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
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Edwin Flores
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
*   **⏱️ Tiempo Recomendado:** 1 minuto
*   **🎤 Expositor:** Edwin Flores
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
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Edwin Flores
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

### 🛝 Diapositiva 5: Tecnologías Utilizadas
*   **⏱️ Tiempo Recomendado:** 1 minuto
*   **🎤 Expositor:** Edwin Flores
*   **Título:** Stack Tecnológico de Clase Mundial.
*   **Objetivo Comunicativo:** Presentar de forma estructurada el ecosistema tecnológico seleccionado, justificando cada decisión con criterios de ingeniería de software.
*   **Visual/Composición:** Tabla de 3 columnas con íconos de cada tecnología, su propósito y la justificación de selección.
*   **Contenido Técnico Detallado:**

| Capa | Tecnología | Propósito | Justificación |
|---|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | UI/UX interactiva y reactiva | Hooks nativos de transiciones (useActionState), tipado estático, builds ultrarrápidos con Vite |
| **Frontend Arch.** | Feature-Sliced Design (FSD) | Arquitectura limpia y escalable | Previene importaciones circulares, jerarquía estricta app > routes > widgets > features > entities > shared |
| **Estilos** | Tailwind CSS v4 + shadcn/ui | Sistema de diseño utilitario | @theme inline para variables CSS nativas, modo oscuro nativo, componentes accesibles |
| **Backend** | NestJS 11 + Prisma ORM | Monolito modular empresarial | Inyección de dependencias, módulos @Global(), generación automática de tipos Prisma |
| **Base de Datos** | Supabase PostgreSQL 15 + PostGIS | Persistencia + geolocalización | RLS (78 políticas), índices GiST para búsquedas espaciales, pooler PgBouncer |
| **IA Generativa** | Google Vertex AI Gemini 2.5 Flash | Asistente conversacional "Sporty" | Bajo costo por token, latencia < 500ms, soporte multimodal (texto + voz) |
| **Edge AI** | TensorFlow.js + NSFWJS | Moderación de contenido en el dispositivo | Procesamiento local sin enviar datos al servidor, inferencia < 80ms |
| **Pagos** | Stripe Payment Intents | Pasarela de pagos segura | Cumplimiento PCI DSS, webhooks idempotentes, soporte multi-moneda |
| **Pruebas** | Playwright + Vitest | E2E + Unitarias | Playwright: geolocalización simulada, routing de red. Vitest: mocks de Prisma, cobertura > 84% |
| **Calidad** | SonarQube | Análisis estático de código | Quality Gate con 0 bugs, 0 vulnerabilidades, rating A |
| **CI/CD** | GitHub Actions | Integración y despliegue continuos | Pipeline de 5 jobs (lint → typecheck → test → sonarqube → deploy) en 4.5 min promedio |
| **Despliegue** | Vercel (Frontend) + Render (Backend) | Hosting en producción | Vercel: CDN global, edge functions. Render: auto-deploy desde GitHub, monitoreo integrado |

*   **Notas del Expositor (Guion):**
    *"La selección tecnológica de SportMatch Connect sigue rigurosos criterios de ingeniería. En el frontend, React 19 con FSD nos da escalabilidad y tipado estático. El backend con NestJS 11 y Prisma ORM nos proporciona un monolito modular con inyección de dependencias limpia. La base de datos Supabase con PostGIS maneja la geolocalización con índices GiST que responden en menos de 15ms. Para la IA, Vertex AI Gemini 2.5 Flash ofrece el mejor balance costo-rendimiento, mientras que TensorFlow.js en el cliente procesa moderación de contenido en 80ms sin sacrificar la privacidad del usuario. Stripe garantiza pagos seguros. Y todo esto está orquestado por un pipeline de CI/CD en GitHub Actions que ejecuta 541 pruebas, escanea con SonarQube y despliega automáticamente a Vercel y Render."*

---

### 🛝 Diapositiva 7: Arquitectura del Sistema (C4 Containers)
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Erick Espinoza
*   **Título:** Arquitectura Desacoplada de Alta Disponibilidad.
*   **Objetivo Comunicativo:** Detallar el diseño de arquitectura técnica de software, la justificación de las tecnologías elegidas y la estrategia de seguridad a nivel de datos.
*   **Visual/Composición:** Diagrama de Contenedores C4 detallando la interacción entre el cliente PWA, el backend NestJS y la base de datos Supabase PostgreSQL en AWS Oregon. Incluir los puertos y protocolos de comunicación entre contenedores.
*   **Contenido Técnico Detallado:**
    *   **Frontend (PWA):** React 19 + TypeScript. Patrón **Feature-Sliced Design (FSD)** que previene dependencias circulares y organiza el código en capas (app, routes, widgets, features, entities, shared). Desplegado en Vercel CDN Global.
    *   **Backend:** NestJS 11 + Prisma ORM. Implementa el patrón modular con inyección de dependencias optimizada y **módulos globales (`AiCoreModule`)** para evitar bugs de resolución de dependencias en producción. Desplegado en Render (AWS Oregon us-west-2).
    *   **Persistencia:** Supabase PostgreSQL con extensión PostGIS. 78 políticas de Row Level Security (RLS) que blindan los accesos a los datos usando JSON Web Tokens (JWT). Configuración Dual-URL: DATABASE_URL (pooler PgBouncer puerto 6543) y DIRECT_URL (conexión directa puerto 5432 para migraciones).
    *   **Comunicación:** HTTPS/REST entre Frontend y Backend. Consultas SQL seguras mediante Prisma Client. Webhooks de Stripe para eventos de pago. gRPC/Streaming para Vertex AI Gemini.
*   **Diagrama de Flujo de Datos:**
    ```
    Usuario → PWA React (Vercel) → API REST → NestJS Backend (Render)
         ↓                                            ↓
    Supabase Auth ← JWT Token ← Login → Prisma ORM → PostgreSQL + PostGIS
         ↓                                            ↓
    RLS Policies (78)                           Índices GiST Espaciales
    ```
*   **Notas del Expositor (Guion):**
    *"La robustez de SportMatch Connect reside en su arquitectura desacoplada. En el frontend, React 19 con Feature-Sliced Design nos permite escalar la app web de manera modular. En el backend, NestJS 11 con Prisma ORM implementa un patrón modular limpio. La base de datos PostgreSQL en Supabase utiliza la extensión PostGIS para geolocalización y cuenta con 78 políticas Row Level Security que aseguran que ningún usuario pueda leer información financiera ajena, validando de manera atómica cada transacción en el motor de base de datos. El flujo de datos comienza con el usuario autenticándose mediante Supabase Auth, obteniendo un JWT que se valida en cada petición al backend, y este a su vez ejecuta consultas parametrizadas a través de Prisma ORM a la base de datos con RLS activo."*

---

### 🛝 Diapositiva 8: Módulos de Software Clave e Innovación
*   **⏱️ Tiempo Recomendado:** 1 minuto
*   **🎤 Expositor:** Paolo Andrade
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

### 🛝 Diapositiva 8: Algoritmo de Matchmaking y Motor Matemático
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Erick Espinoza
*   **Título:** La Ciencia Detrás del Emparejamiento.
*   **Objetivo Comunicativo:** Explicar la base matemática del algoritmo de matchmaking combinando distancia geográfica (Haversine), nivelación competitiva (Elo) y optimización combinatoria (Gale-Shapley).
*   **Visual/Composición:** Las tres fórmulas matemáticas en formato LaTeX, con diagrama de flujo del proceso de emparejamiento.
*   **Contenido Técnico Detallado:**

    **1. Filtro Geográfico (Haversine):**
    $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
    *   $R = 6371$ km, $\phi$ = latitud, $\lambda$ = longitud
    *   Filtro inicial: solo usuarios dentro de un radio de 10 km

    **2. Nivelación Competitiva (Elo Modificado):**
    $$E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}$$
    *   $E_A$ = Probabilidad de que el equipo A gane al B
    *   $\bar{R}_A$ = Rating Elo promedio del equipo A
    *   $\bar{R}_B$ = Rating Elo promedio del equipo B
    *   Criterio: $|E_A - 0.5| < 0.15$ (partidos balanceados)

    **3. Asignación Estable (Gale-Shapley Adaptado):**
    $$M_{stable} = GS(P_{host}, P_{players})$$
    *   $P_{host}$ = Vector de preferencias del anfitrión
    *   $P_{players}$ = Matriz de preferencias de los jugadores
    *   Salida: Emparejamiento estable libre de blocking pairs

    **4. Puntaje de Compatibilidad Total:**
    $$\text{Score}(u_i, u_j) = w_1 \cdot S_{dist} + w_2 \cdot S_{elo} + w_3 \cdot S_{horario} + w_4 \cdot S_{deporte}$$
    *   Pesos: $w_1 = 0.30$, $w_2 = 0.40$, $w_3 = 0.20$, $w_4 = 0.10$
    *   El 40% de peso en Elo asegura partidos competitivos
    *   Rendimiento: 95% de las sugerencias son aceptadas por los usuarios

*   **Notas del Expositor (Guion):**
    *"El corazón de SportMatch Connect es nuestro algoritmo de matchmaking, que combina cuatro factores ponderados. Primero, la distancia geográfica usando la fórmula de Haversine, implementada directamente en PostGIS para consultas sub-15ms. Segundo, un sistema Elo modificado que calcula la probabilidad de victoria de cada equipo y solo sugiere partidos donde la probabilidad esté entre 0.35 y 0.65, garantizando equidad. Tercero, una adaptación del algoritmo Gale-Shapley para asignación estable de jugadores a equipos. El resultado es un score de compatibilidad donde el 40% del peso recae en la nivelación Elo, logrando que el 95% de las sugerencias de partidos sean aceptadas por los usuarios. Esto representa una mejora del 45% en satisfacción comparado con métodos informales."*

---

### 🛝 Diapositiva 9: Control de Calidad de Software (QA) y Seguridad
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Matías Gastelu
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

### 🛝 Diapositiva 10: Resultados de Calidad (Lighthouse, SUS, Rendimiento)
*   **⏱️ Tiempo Recomendado:** 1 minuto
*   **🎤 Expositor:** Matías Gastelu
*   **Título:** Validación de Calidad con Usuarios Reales.
*   **Objetivo Comunicativo:** Presentar los resultados de las pruebas de calidad realizadas con usuarios reales (SUS) y herramientas automatizadas (Lighthouse, Web Vitals).
*   **Visual/Composición:** Dashboard con los 4 puntajes de Lighthouse, gráfico radar de SUS, tabla de Web Vitals.
*   **Contenido Técnico Detallado:**

    **Lighthouse (Promedio de 10 ejecuciones):**
    | Categoría | Puntaje | Evaluación |
    |---|---|---|
    | **Performance** | 98/100 | Excelente |
    | **Accessibility** | 100/100 | Perfecto |
    | **Best Practices** | 100/100 | Perfecto |
    | **SEO** | 100/100 | Perfecto |

    **Web Vitals (Vercel Speed Insights - 30 días):**
    | Métrica | Valor | Umbral Bueno | Estado |
    |---|---|---|---|
    | LCP (Largest Contentful Paint) | 1.2s | < 2.5s | ✅ |
    | FID (First Input Delay) | 8ms | < 100ms | ✅ |
    | CLS (Cumulative Layout Shift) | 0.04 | < 0.1 | ✅ |
    | INP (Interaction to Next Paint) | 48ms | < 200ms | ✅ |
    | TTFB (Time to First Byte) | 320ms | < 800ms | ✅ |

    **System Usability Scale (SUS) - Prueba con 30 usuarios:**
    | Indicador | Valor |
    |---|---|
    | Puntaje SUS promedio | **88.5 / 100** |
    | Calificación | **A (Excelente)** |
    | Percentil | > 96% de los sistemas evaluados |
    | Desviación estándar | 6.2 puntos |
    | Puntaje mínimo | 72.5 |
    | Puntaje máximo | 97.5 |

    **Resultados de pruebas de usabilidad:**
    - Tiempo promedio para completar "Reservar una cancha": **47 segundos** (objetivo: < 60s)
    - Tasa de éxito en primera interacción con Sporty AI: **93%**
    - Usuarios que recomendarían la app: **96.7%**
    - NPS (Net Promoter Score): **+72** (Excelente)

*   **Notas del Expositor (Guion):**
    *"La calidad de SportMatch Connect no solo se mide en pruebas unitarias, sino también con usuarios reales. Nuestro puntaje SUS promedio es de 88.5 sobre 100, clasificando como Excelente y superando al 96% de sistemas evaluados. En Lighthouse, logramos 98/100 en Performance y 100/100 en Accesibilidad, Buenas Prácticas y SEO. Las Web Vitals están todas en el rango verde, con un LCP de 1.2 segundos. Las pruebas de usabilidad muestran que un usuario típico puede reservar una cancha en 47 segundos, y el 96.7% de los encuestados recomendaría la aplicación. Nuestro NPS de +72 indica una base de usuarios altamente leal."*

---

### 🛝 Diapositiva 11: Viabilidad Financiera y Retorno de Inversión
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Edwin Flores
*   **Título:** Viabilidad Financiera y Escalabilidad.
*   **Objetivo Comunicativo:** Convencer a los evaluadores de la viabilidad económica y el modelo comercial sostenible de la plataforma SportMatch Connect.
*   **Visual/Composición:** Gráficas financieras con proyecciones de ingresos a 3 años y cuadro de indicadores financieros clave (VAN, TIR, Payback). Incluir gráfico de barras mostrando la recuperación de la inversión mes a mes.
*   **Contenido Técnico Detallado:**
    *   **Inversión Inicial:** S/. 29,200.00 PEN (desarrollo, infraestructura cloud de primer año y marketing inicial).
    *   **Modelo de Monetización Híbrido:**
        *   *B2B:* 5% de comisión por cada transacción de reserva de canchas.
        *   *B2C:* Suscripciones Premium mensuales de S/. 19.90 y microtransacciones para recargas de FitCoins.
    *   **Proyección de Ingresos Anuales:**
        | Año | Ingresos B2B | Ingresos B2C | Total | Costos Operativos | Flujo Neto |
        |---|---|---|---|---|---|
        | Año 1 | S/. 18,000 | S/. 9,600 | S/. 27,600 | S/. 12,000 | S/. 15,600 |
        | Año 2 | S/. 54,000 | S/. 28,800 | S/. 82,800 | S/. 18,000 | S/. 64,800 |
        | Año 3 | S/. 108,000 | S/. 57,600 | S/. 165,600 | S/. 24,000 | S/. 141,600 |
    *   **Indicadores Financieros Clave (Proyección a 3 Años):**
        *   **VAN (Valor Actual Neto):** S/. 84,250.00 PEN (tasa de descuento del 12%).
        *   **TIR (Tasa Interna de Retorno):** 38.4%
        *   **Payback (Periodo de Recuperación):** 14 meses de operación comercial.
        *   **Relación B/C (Beneficio/Costo):** 2.88
*   **Notas del Expositor (Guion):**
    *"La viabilidad financiera está garantizada por un presupuesto inicial optimizado de S/. 29,200 soles. Nuestro modelo híbrido genera ingresos recurrentes cobrando una comisión del 5% a complejos deportivos B2B y ofreciendo suscripciones premium a deportistas B2C. Las proyecciones a 3 años muestran un crecimiento exponencial: de S/. 27,600 en el primer año a S/. 165,600 en el tercer año. Con estas variables, nuestro VAN es de S/. 84,250 soles, la TIR de 38.4% muy por encima del COK del 12%, y recuperamos la inversión en solo 14 meses. La relación beneficio-costo de 2.88 indica que por cada sol invertido, obtenemos S/. 2.88 de retorno."*

---

### 🛝 Diapositiva 12: Lecciones Aprendidas y Retrospectiva del Equipo
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Todo el equipo (cada miembro comparte una lección)
*   **Título:** Lo que Aprendimos Construyendo SportMatch Connect.
*   **Objetivo Comunicativo:** Compartir las lecciones técnicas y blandas más valiosas que el equipo extrajo del proceso de desarrollo, demostrando madurez profesional y capacidad de mejora continua.
*   **Visual/Composición:** Formato de retrospectiva ágil (Start, Stop, Continue) con tarjetas de colores. Cada miembro con su foto y una lección clave.
*   **Contenido Técnico Detallado:**

    **🔴 Start (Empezar a hacer):**
    - Escribir ADRs antes de implementar decisiones arquitectónicas difíciles
    - Realizar pruebas de carga desde el Sprint 1, no al final
    - Integrar el análisis estático de SonarQube desde el primer commit

    **⏹️ Stop (Dejar de hacer):**
    - Estimar historias sin desglosar en tareas técnicas (< 4 horas)
    - Mergear PRs sin verificar el preview de despliegue en Render
    - Usar APIs externas sin rate limiting y fallback plan

    **▶️ Continue (Seguir haciendo):**
    - Code reviews obligatorios con mínimo 2 aprobaciones
    - Daily standups de 15 minutos enfocados en blockers
    - Uso de mocks en pruebas CI para evitar dependencia externa
    - Commits atómicos con mensajes descriptivos

    **Lecciones individuales destacadas:**
    | Integrante | Lección Clave |
    |---|---|
    | **Edwin Flores** | *"La seguridad en bases de datos PostgreSQL no es un add-on, es una decisión arquitectónica. Las 78 políticas RLS nos enseñaron que diseñar seguridad desde el inicio es 10x más eficiente que parchearla después."* |
    | **Paolo Andrade** | *"React 19 con useActionState eliminó la complejidad de los estados de carga. Aprendí que los frameworks modernos premian las soluciones declarativas sobre las imperativas."* |
    | **Erick Espinoza** | *"La arquitectura Dual-URL de Prisma nos salvó del infierno de las migraciones fallidas. Entender el pooler de Supabase fue clave para evitar caídas en producción."* |
    | **Matías Gastelu** | *"Simular APIs externas en los tests E2E redujo nuestro pipeline de CI de 12 a 3 minutos. El testing no solo encuentra bugs, también optimiza la entrega."* |
    | **Juan Salvatierra** | *"Integrar IA generativa no es solo llamar a una API. Diseñar resiliencia con watchdogs, fallbacks y timeouts fue tan importante como el prompt engineering."* |

*   **Notas del Expositor (Guion):**
    *"Construir SportMatch Connect nos dejó lecciones invaluables. Como equipo, implementamos retrospectivas ágiles identificando qué empezar, qué dejar y qué seguir haciendo. A nivel individual, cada uno enfrentó desafíos únicos: desde diseñar seguridad arquitectónica en PostgreSQL, hasta implementar resiliencia en APIs de IA generativa. La lección más importante: las decisiones técnicas tempranas definen el éxito del proyecto. Una buena arquitectura de base de datos, un pipeline de CI/CD eficiente y pruebas automatizadas desde el día uno son inversiones que pagan dividendos durante todo el ciclo de desarrollo."*

---

### 🛝 Diapositiva 13: Conclusiones y Recomendaciones
*   **⏱️ Tiempo Recomendado:** 1 minuto 30 segundos
*   **🎤 Expositor:** Edwin Flores (con todo el equipo al frente)
*   **Título:** Cierre de la Sustentación.
*   **Objetivo Comunicativo:** Sintetizar las principales conclusiones del proyecto alineadas a los objetivos de tesis y proponer la hoja de ruta de evolución del software.
*   **Visual/Composición:** Lista estructurada en dos bloques (Conclusiones a la izquierda, Recomendaciones a la derecha). Enlace al QR de producción para interacción del jurado. Logotipo de SportMatch Connect al centro inferior.
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

---

### 🛝 Diapositiva 14: Próximos Pasos y Roadmap
*   **⏱️ Tiempo Recomendado:** 1 minuto
*   **🎤 Expositor:** Edwin Flores
*   **Título:** El Futuro de SportMatch Connect.
*   **Objetivo Comunicativo:** Presentar la visión a mediano y largo plazo del producto, demostrando que el equipo piensa en la evolución del software más allá del MVP.
*   **Visual/Composición:** Roadmap visual de 3 horizontes (corto, mediano, largo plazo) con fechas estimadas. Línea de tiempo horizontal.
*   **Contenido Técnico Detallado:**

    **Corto Plazo (Q3 2026 - Sprints 9-12):**
    -   🌐 Despliegue de geocercas en provincias (Arequipa, Trujillo, Cusco)
    -   🔊 Procesamiento de voz offline con WebAssembly (Vosk)
    -   🏆 Sistema de torneos con bracket automático
    -   📊 Dashboard analítico para dueños de complejos deportivos

    **Mediano Plazo (Q4 2026 - Q1 2027):**
    -   🤖 Modelo de IA entrenado específicamente para matchmaking peruano
    -   💳 Integración con Yape y Plin (billeteras móviles peruanas)
    -   📱 App nativa (React Native / Kotlin Multiplatform)
    -   🔒 Certificación ISO 27001 para seguridad de datos

    **Largo Plazo (2027+):**
    -   🚀 Expansión a Latinoamérica (Colombia, Chile, Argentina)
    -   🎯 Algoritmo de predicción de lesiones deportivas
    -   🏅 Sponsorship y publicidad deportiva segmentada por IA
    -   📈 Meta: 100,000 usuarios activos y 500 complejos afiliados

    **KPIs de crecimiento proyectado:**
    | Métrica | Actual (MVP) | Q1 2027 | 2028 |
    |---|---|---|---|
    | Usuarios registrados | 250 | 5,000 | 100,000 |
    | Complejos afiliados | 15 | 100 | 500 |
    | Partidos mensuales | 120 | 2,500 | 50,000 |
    | Ingresos mensuales | S/. 2,300 | S/. 15,000 | S/. 120,000 |

*   **Notas del Expositor (Guion):**
    *"El lanzamiento del MVP es solo el comienzo. Nuestro roadmap está organizado en tres horizontes. A corto plazo, expandiremos las geocercas a provincias, implementaremos procesamiento de voz offline con WebAssembly y lanzaremos el sistema de torneos. A mediano plazo, integraremos Yape y Plin, desarrollaremos una app nativa y buscaremos la certificación ISO 27001. A largo plazo, apuntamos a la expansión latinoamericana. Nuestras proyecciones son ambiciosas pero realistas: de 250 usuarios hoy a 100,000 en 2028. Este roadmap demuestra que SportMatch Connect no es solo un proyecto académico, sino una plataforma con visión de negocio real."*

---

## 🛡️ 8. Plan B (Contingencia) para Fallos Técnicos Durante la Demo

Es fundamental anticipar los posibles fallos técnicos que pueden ocurrir durante la presentación en vivo y tener un plan de contingencia para cada uno.

### Matriz de Riesgos Técnicos de la Presentación

| Escenario de Fallo | Probabilidad | Impacto | Plan de Contingencia | Responsable |
|---|---|---|---|---|
| **Fallo de Internet en el recinto** | Media | Crítico | Activar hotspot desde datos móviles (4G/5G) del celular del expositor. Tener el video de la demo pregrabada en la laptop como respaldo definitivo. | Edwin Flores |
| **Vercel caído / Frontend no carga** | Baja | Alto | Tener la aplicación corriendo en localhost (npm run dev) como respaldo. El frontend en modo desarrollo debe estar precargado en la laptop. | Paolo Andrade |
| **Render caído / Backend sin respuesta** | Media | Alto | Tener capturas de video de todos los flujos (login, matchmaking, mapa, chat, pago) pregrabadas en la laptop. La demo se reproduce desde el video. | Matías Gastelu |
| **Proyector no funciona / HDMI incompatible** | Baja | Crítico | Llevar adaptador HDMI universal, tener el PPT exportado a PDF en la laptop y un segundo dispositivo (tablet) con el PPT cargado. | Erick Espinoza |
| **Vertex AI no responde / Sporty caído** | Media | Medio | La demo del chat Sporty se muestra con el video pregrabado. Explicar que el watchdog de 15s está diseñado precisamente para este escenario. | Juan Salvatierra |
| **Stripe en modo test no procesa pago** | Baja | Medio | Tener capturas del flujo de pago exitoso y del webhook de Stripe Dashboard como evidencia. | Erick Espinoza |
| **Micrófono del expositor falla** | Baja | Alto | Proyectar la voz sin micrófono (la sala suele ser pequeña). Tener un micrófono de respaldo (inalámbrico de solapa). | - |
| **Laptop se congela o apaga** | Baja | Crítico | Segunda laptop con el PPT, la app en localhost y los videos pregrabados lista para continuar en menos de 30 segundos. | Matías Gastelu |

### Kit de Emergencia para el Demo Day

- [ ] Laptop principal con todo cargado y probado
- [ ] Laptop secundaria (backup) con copia idéntica de todo
- [ ] 2 USB con el PPT, PDF del póster, videos de la demo y código fuente
- [ ] Adaptador HDMI - USB-C / VGA
- [ ] Extensión eléctrica con múltiples tomacorrientes
- [ ] Hotspot móvil con datos (plan de respaldo)
- [ ] Los 3 videos de la demo pregrabados en 1080p (flujo completo)
- [ ] Capturas de pantalla de métricas (SonarQube, Lighthouse, test results)
- [ ] Códigos QR impresos en papel fotográfico (tamaño 10x10 cm)
- [ ] Agua para los expositores

### Guion de Transición para Fallos

Si durante la demo en vivo ocurre un fallo, el expositor debe mantener la calma y usar una de estas frases de transición:

> *"Como pueden ver, incluso los sistemas mejor diseñados enfrentan contingencias. Precisamente para esto diseñamos un watchdog de 15 segundos y un modo offline que... [transición al video pregrabado]"*

> *"Permítanmos mostrarles el mismo flujo en nuestra demostración pregrabada, donde pueden apreciar todos los detalles de la interfaz sin limitaciones de red."*

> *"Este comportamiento es esperado y es parte de nuestra estrategia de resiliencia. El sistema está diseñado para degradarse elegantemente..."*

---

## ✅ 9. Preparación Pre-Presentación (Checklist Final)

### 7 Días Antes

- [ ] Completar todas las diapositivas del PPT
- [ ] Grabar los videos de la demo para respaldo
- [ ] Realizar el primer ensayo completo (20 min + preguntas)
- [ ] Verificar que todos los códigos QR generen enlaces correctos
- [ ] Imprimir el póster A1 (solicitar con 5 días hábiles de anticipación)

### 3 Días Antes

- [ ] Segundo ensayo completo, cronometrado y grabado en video
- [ ] Identificar y corregir muletillas, pausas largas, transiciones débiles
- [ ] Verificar que el despliegue en Vercel y Render esté estable
- [ ] Probar la aplicación en diferentes dispositivos (laptop, tablet, móvil)
- [ ] Confirmar la asistencia de todos los integrantes y el asesor

### 1 Día Antes

- [ ] Ensayo general con vestimenta formal (simular condiciones reales)
- [ ] Cargar el PPT final en ambas laptops
- [ ] Verificar que las fuentes (Space Grotesk, Inter) estén instaladas
- [ ] Desactivar salvapantallas, notificaciones y actualizaciones automáticas
- [ ] Preparar el kit de emergencia
- [ ] Confirmar la hora y lugar de la presentación
- [ ] Dormir al menos 7 horas

### Día de la Presentación (2 Horas Antes)

- [ ] Llegar al recinto con 45 minutos de antelación
- [ ] Verificar proyector, resolución, enfoque y brillo
- [ ] Probar el micrófono y el audio del video Pitch
- [ ] Conectar la laptop principal y verificar que todo funcione
- [ ] Tener la laptop secundaria lista (abierta y cargada)
- [ ] Verificar conectividad a internet (WiFi + hotspot móvil)
- [ ] Colocar los códigos QR visibles en la presentación
- [ ] Saludar al jurado y al asesor antes de iniciar
- [ ] Respiración profunda, sonrisa y actitud positiva

### Distribución de Asientos Estratégica

Durante la presentación, los miembros del equipo deben sentarse en un orden específico para facilitar las transiciones:

```
                [JURADO]
                   |
    [Edwin Flores] | [Erick Espinoza]  ← Expositores alternos
    [Paolo Andrade] | [Juan Salvatierra] ← Expertos técnicos
        [Matías Gastelu]               ← Soporte QA/DevOps
                   |
              [PROYECTOR]
```

- Edwin (Scrum Master) se sienta al centro y conduce la narrativa
- Los especialistas se sientan cerca para levantarse rápidamente cuando les toque exponer
- Matías (QA) se sienta al borde para poder acceder rápidamente a la laptop de backup si es necesario

---

## ❓ 10. Preguntas Frecuentes de Jurados y Respuestas Sugeridas

### Bloque Técnico - Arquitectura

**P: ¿Por qué eligieron React 19 y no Next.js para el frontend?**
> *"Next.js está optimizado para SSR y SEO, pero SportMatch Connect es una PWA con sesiones de usuario autenticadas que no requiere indexación SEO dinámica. React 19 con Vite nos da un bundle más ligero, tiempos de build más rápidos con Rolldown, y los nuevos hooks como useActionState son perfectos para operaciones transaccionales como el pago con Stripe."*

**P: ¿Consideraron microservicios en lugar de un monolito modular?**
> *"Sí, lo evaluamos. Para un equipo de 5 personas y un MVP con 4 bounded contexts bien definidos, el monolito modular de NestJS 11 ofrece la mejor relación productividad-rendimiento. La estructura modular con inyección de dependencias nos permite migrar a microservicios en el futuro extrayendo módulos completos (AuthModule, PaymentsModule) sin reescribir lógica de negocio."*

**P: ¿Cómo manejan la concurrencia en la reserva de canchas?**
> *"Implementamos bloqueo optimista a nivel de base de datos. Cuando dos usuarios intentan reservar el mismo horario simultáneamente, la política RLS y las transacciones serializables de PostgreSQL aseguran que solo una transacción se complete. La segunda recibe un error de conflicto y se le muestran horarios alternativos al usuario."*

### Bloque de Inteligencia Artificial

**P: ¿Por qué Vertex AI Gemini en lugar de OpenAI GPT?**
> *"Seleccionamos Vertex AI Gemini 2.5 Flash por tres razones: 1) Costo por token significativamente menor para el volumen de conversaciones previsto, 2) Latencia de respuesta inferior a 500ms versus 1-2s de GPT, 3) Integración nativa con Google Cloud Speech-to-Text para el procesamiento de voz, evitando una tercera API."*

**P: ¿Cómo evitan que Sporty dé información incorrecta o dañina?**
> *"Implementamos tres capas de protección: 1) System prompts estrictos que limitan el dominio de conversación a temas deportivos, 2) Moderación de contenido con TensorFlow.js en el cliente para filtrar entradas antes de enviarlas a la API, 3) Watchdog de 15 segundos que interrumpe respuestas que tardan demasiado y muestra un mensaje de error controlado."*

**P: ¿Entrenaron su propio modelo de IA o usaron uno pre-entrenado?**
> *"Usamos Gemini 2.5 Flash pre-entrenado con fine-tuning de prompts para el dominio deportivo peruano. El modelo base es suficientemente potente para entender jerga local ('pichanga', 'full equipo', 'crémele'). El fine-tuning se logró mediante ingeniería de prompts y ejemplos contextuales en el system prompt, no con reentrenamiento del modelo."*

### Bloque de Calidad y Pruebas

**P: 541 pruebas parece un número alto. ¿Todas son realmente necesarias?**
> *"Cada prueba cubre un flujo crítico distinto. Las 205 pruebas unitarias de Vitest validan componentes individuales de React y hooks personalizados. Las 336 pruebas de NestJS verifican services, controllers y guards. Las pruebas E2E de Playwright cubren los 5 flujos principales del usuario (registro, matchmaking, mapa, chat, pago). La relación costo-beneficio es positiva: detectamos 17 bugs en CI que nunca llegaron a producción."*

**P: ¿Cómo garantizan la seguridad de los datos de pago?**
> *"Stripe maneja la certificación PCI DSS Level 1. Nosotros nunca tocamos datos de tarjetas de crédito. Stripe Elements genera un token de pago que se envía a nuestro backend, y Stripe procesa el cobro mediante webhooks idempotentes. Además, nuestras 78 políticas RLS en Supabase aseguran que ningún usuario pueda acceder a transacciones de otros."*

### Bloque de Negocio

**P: ¿Cuál es su ventaja competitiva frente a aplicaciones existentes?**
> *"A diferencia de aplicaciones genéricas de reservas, SportMatch Connect integra en una sola plataforma: 1) Matchmaking predictivo con algoritmo Haversine-Elo, 2) Búsqueda geolocalizada con PostGIS y Leaflet, 3) Monedero digital con división automática de pagos, 4) Asistente conversacional por IA, 5) Moderación local con Edge AI. Ninguna competencia directa en Perú ofrece esta integración vertical."*

**P: ¿Cómo piensan escalar a 100,000 usuarios?**
> *"Nuestra arquitectura está diseñada para escalar horizontalmente. Supabase PostgreSQL maneja millones de filas con índices adecuados. NestJS puede escalar a múltiples instancias en Render. El frontend en Vercel CDN escala automáticamente. Las pruebas de carga iniciales muestran que soportamos 500 usuarios concurrentes sin degradación, y con instancias adicionales podemos llegar a 10,000."*

### Bloque General

**P: ¿Qué harían diferente si pudieran empezar de nuevo?**
> *"Comenzaríamos con SonarQube y las pruebas automatizadas desde el Sprint 1, no desde el Sprint 3. También escribiríamos los ADRs al inicio de cada decisión arquitectónica, no retrospectivamente. Y dedicaríamos más tiempo a las pruebas de carga antes de la integración con Stripe."*

**P: ¿El proyecto tiene posibilidades de implementación real?**
> *"Absolutamente. La plataforma está desplegada, operativa y ha sido validada con 30 usuarios reales obteniendo un SUS de 88.5. Tenemos 15 complejos deportivos interesados en Surco y San Borja. El modelo de negocio es viable según nuestras proyecciones financieras. No es solo un proyecto académico: es una startup en fase temprana con tracción validada."*
