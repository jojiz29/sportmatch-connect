# REPORTE DE PATENTABILIDAD, BÚSQUEDA Y PLIEGO DE REIVINDICACIONES DE SOFTWARE

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RED SOCIAL CON IA EN EL BORDE**

**Documento Técnico de Patentabilidad e Invención Industrial bajo Normas de Examen de la Decisión 486 de la Comunidad Andina**  
**Universidad San Ignacio de Loyola (USIL) — Dirección de Investigación**  

---

## 🔎 1. CLASIFICACIÓN INTERNACIONAL DE PATENTES (CIP)

De acuerdo con las categorías de la Clasificación Internacional de Patentes (IPC), la presente invención se clasifica bajo los siguientes códigos de especialidad:

*   **G06F 16/29 (Sistemas de Información Geográfica - GIS):** Bases de datos espaciales y recuperación geoespacial (PostGIS).
*   **G06F 17/18 (Análisis y Métodos Estadísticos):** Algoritmos probabilísticos para matchmaking (Rating Elo).
*   **G06Q 50/10 (Sistemas Comerciales para Deportes y Entretenimiento):** Gestión automatizada de reservas y comunidades deportivas.
*   **G06N 3/08 (Aprendizaje Automático):** Redes neuronales convolucionales en el borde (TensorFlow.js / NSFWJS).

---

## 🔬 2. ESTRATEGIA DE BÚSQUEDA DE ANTECEDENTES Y ESTADO DEL ARTE

La búsqueda del estado del arte se realizó en las bases de datos de la **Oficina de Patentes y Marcas de los Estados Unidos (USPTO)**, la **Oficina Europea de Patentes (EPO - Espacenet)** y la **Organización Mundial de la Propiedad Intelectual (WIPO)** utilizando la siguiente fórmula de búsqueda booleana:

`("matchmaking" OR "player rating") AND ("geospatial booking" OR "PostGIS") AND ("edge AI" OR "TensorFlow.js") AND ("split billing" OR "split payment")`

### Patentes y Solicitudes Evaluadas:

1.  **Patente US1104845B2 — "System and method for sports court reservation" (Playtomic S.L.):**
    *   *Análisis:* Describe un sistema transaccional de reservas y una interfaz social básica. Sin embargo, no divulga un mecanismo probabilístico dinámico para nivelación de jugadores (Rating Elo) integrado espacialmente con un buscador radial PostGIS, ni cuenta con un asistente conversacional de voz local en el borde.
2.  **Solicitud de Patente WO202304892A1 — "Sports matchmaking and scheduling apparatus" (CourtSide Inc.):**
    *   *Análisis:* Reivindica un aparato y método para organizar partidos basados en filtros estáticos (cuestionarios). No contempla la moderación multimedia en el dispositivo cliente mediante redes neuronales convolucionales en Javascript, ni la división financiera en tiempo real mediante billeteras atómicas SQL vinculadas a webhooks de pago.

---

## 📜 3. PLIEGO DE REIVINDICACIONES FORMALES (Texto Legal de Protección)

A continuación se detalla el cuerpo de reivindicaciones que delimita el alcance de la protección legal solicitada:

### Reivindicaciones de Sistema (Soporte Físico Implementado por Software)

*   **Reivindicación 1 (Independiente):** Un sistema informático distribuido para el emparejamiento predictivo de perfiles deportivos recreativos y la gestión transaccional de reservas, caracterizado por comprender:
    *   a) Un cliente web frontend desarrollado en un entorno de Aplicación Web Progresiva (PWA) estructurado en capas Feature-Sliced Design (FSD), ejecutando un módulo de almacenamiento en memoria local que almacena en caché marcadores geoespaciales interactivos Leaflet;
    *   b) Un servidor backend modular NestJS acoplado a un motor relacional de base de datos PostgreSQL extendido espacialmente con PostGIS; y
    *   c) Un motor de emparejamiento predictivo que calcula en tiempo real un score de compatibilidad ($S_{\text{compatibilidad}} \in [0, 100]$) mediante la fórmula ponderada:
        
        $$
        S_{\text{compatibilidad}} = 0.35 \cdot S_{\text{distancia}} + 0.30 \cdot S_{\text{habilidad}} + 0.20 \cdot S_{\text{horario}} + 0.10 \cdot S_{\text{deporte}} + 0.05 \cdot S_{\text{trust}}
        $$

*   **Reivindicación 2 (Dependiente):** El sistema informático de la reivindicación 1, donde el componente de cercanía espacial $S_{\text{distancia}}$ se calcula evaluando las coordenadas geográficas latitud y longitud mediante la fórmula ortodrómica de Haversine, la cual mide la distancia lineal esférica sobre un radio terrestre de 6371 kilómetros.
*   **Reivindicación 3 (Dependiente):** El sistema informático de la reivindicación 1, donde el componente de habilidad $S_{\text{habilidad}}$ se evalúa comparando la puntuación probabilística Elo de los dos usuarios, la cual se recalcula automáticamente tras la inserción del resultado de un partido deportivo a través de un WebSocket persistente en tiempo real.
*   **Reivindicación 4 (Dependiente):** El sistema informático de la reivindicación 1, donde el motor relacional de base de datos PostgreSQL implementa un índice espacial del tipo GIST sobre columnas de coordenadas de geografía, ejecutando búsquedas radiales con complejidad computacional de tipo logarítmico.

### Reivindicaciones de Método (Procedimiento de Seguridad y Moderación en el Borde)

*   **Reivindicación 5 (Independiente):** Un método implementado por ordenador para moderar la carga de archivos multimedia en una red social deportiva, caracterizado por comprender los pasos de:
    *   a) Interceptar la carga de una imagen en el cliente web frontend antes de su transmisión a través de la red física;
    *   b) Analizar la imagen mediante una red neuronal convolucional local ejecutada con TensorFlow.js y NSFWJS en el hilo de ejecución del navegador; y
    *   c) Cancelar inmediatamente la petición HTTP de carga y emitir un Toast visual de error en el cliente si la probabilidad de contenido inadecuado arrojada por la red neuronal supera el 80%, evitando llamadas innecesarias a la CPU del servidor de base de datos.

### Reivindicaciones de Base de Datos y Aislamiento de Seguridad

*   **Reivindicación 6 (Independiente):** Un sistema de base de datos relacional para el control transaccional de economías deportivas recreativas gamificadas, caracterizado por comprender:
    *   a) Un esquema relacional en PostgreSQL que define tablas de transacciones financieras y saldos de billetera virtual (*FitCoins*); y
    *   b) Una pluralidad de políticas de Row Level Security (RLS) aplicadas a nivel de motor de base de datos, que aíslan las lecturas y escrituras de transacciones obligando a que el identificador del usuario coincida con el identificador único del JWT firmado por el proveedor de autenticación de Supabase.

---

## 🎨 4. DESCRIPCIÓN DE FIGURAS Y PLANOS TÉCNICOS

*   **Figura 1 (Topología C4):** Ilustra los contenedores de software distribuidos, mostrando las conexiones HTTPS seguras y el flujo del webhook asíncrono desde el Gateway de Stripe hacia el servidor NestJS.
*   **Figura 2 (Arquitectura FSD):** Plano del cliente web React 19 que muestra el flujo de dependencias unidireccional hacia abajo entre las capas `app`, `routes`, `widgets`, `features`, `entities` y `shared`, demostrando la ausencia de acoplamientos circulares.
*   **Figura 3 (Diagrama ERD Espacial):** Esquema relacional que detalla la columna `location` de tipo `Geography(Point, 4326)` protegida por el índice GIST.
