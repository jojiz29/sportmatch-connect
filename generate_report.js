import fs from "fs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
} from "docx";

// Parse .env.local to get any variables if needed (we can read them for documentation purposes)
const envLocalPath = ".env.local";
const env = {};
if (fs.existsSync(envLocalPath)) {
  const fileContent = fs.readFileSync(envLocalPath, "utf-8");
  fileContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      const cleanVal = val.replace(/^['"]|['"]$/g, "");
      env[key] = cleanVal;
    }
  });
}

// Function to generate the Docx
async function createDocument() {
  const doc = new Document({
    creator: "Edwin Flores",
    title: "Informe Técnico - SportMatch Connect Sprint 2",
    description: "Informe detallado de arquitectura de software, metodologías ágiles y entregables técnicos del Sprint 1 y Sprint 2 para SportMatch Connect",
    sections: [
      {
        properties: {},
        children: [
          // ================= CARATULA =================
          new Paragraph({ text: "", spacing: { before: 1000 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: "UNIVERSIDAD SAN IGNACIO DE LOYOLA",
                bold: true,
                size: 36,
                font: "Calibri",
                color: "1F4E79",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "FACULTAD DE INGENIERÍA",
                bold: true,
                size: 24,
                font: "Calibri",
                color: "595959",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "CARRERA DE INGENIERÍA DE SISTEMAS / SOFTWARE",
                bold: true,
                size: 20,
                font: "Calibri",
                color: "595959",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1500 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "INFORME TÉCNICO DE ARQUITECTURA DE SOFTWARE",
                bold: true,
                size: 32,
                font: "Calibri",
                color: "1F4E79",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'PROYECTO: "SPORTMATCH CONNECT"',
                bold: true,
                size: 28,
                font: "Calibri",
                color: "E36C09",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Evolución de MVP a Red Social Deportiva (Fases 1 y 2)",
                italic: true,
                size: 22,
                font: "Calibri",
                color: "595959",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 2000 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "AUTOR:\n",
                bold: true,
                size: 20,
                font: "Calibri",
              }),
              new TextRun({
                text: "Edwin Flores (Código: 2111716)\n\n",
                size: 20,
                font: "Calibri",
              }),
              new TextRun({
                text: "UNIVERSIDAD:\n",
                bold: true,
                size: 20,
                font: "Calibri",
              }),
              new TextRun({
                text: "Universidad San Ignacio de Loyola\n\n",
                size: 20,
                font: "Calibri",
              }),
              new TextRun({
                text: "FECHA:\n",
                bold: true,
                size: 20,
                font: "Calibri",
              }),
              new TextRun({
                text: "Junio de 2026",
                size: 20,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1000 },
          }),
          new Paragraph({ text: "", pageBreakBefore: true }),

          // ================= SECCION 1 =================
          createHeading("1. INTRODUCCIÓN Y DESCRIPCIÓN DEL PROYECTO", HeadingLevel.HEADING_1),
          createParagraph(
            "SportMatch Connect es una innovadora plataforma digital diseñada para revolucionar la forma en que los deportistas amateurs y aficionados conectan, coordinan partidos y reservan canchas de juego en tiempo real. La solución abarca disciplinas deportivas tradicionales (como fútbol, baloncesto, tenis y pádel) y e-sports competitivos en línea. El propósito central es mitigar la desconexión existente en el mercado de recreación deportiva, uniendo a usuarios compatibles según su ubicación, disponibilidad horaria y nivel técnico."
          ),
          createParagraph(
            "En la actualidad, el sector sufre de una gran fragmentación: los jugadores utilizan múltiples canales no estructurados (grupos de mensajería instantánea, hojas de cálculo, llamadas telefónicas a centros deportivos) para armar partidos y verificar disponibilidad. Esta falta de integración produce ineficiencia en las reservas, cancelación de partidos por falta de quórum a último minuto, y dificultades para encontrar oponentes del mismo nivel competitivo. SportMatch Connect resuelve esto unificando el grafo social (relaciones de amistad, feeds comunitarios, chats grupales o 'squads') con un motor transaccional robusto y geolocalización geoespacial avanzada en base de datos."
          ),
          createParagraph(
            "Durante las primeras etapas del proyecto, la plataforma funcionaba principalmente en base a simulaciones locales (offline-first con mocks) y modelos transaccionales planos. A partir del Sprint 2, el sistema ha experimentado una profunda transformación arquitectónica hacia una solución cloud-first y altamente resiliente basada en React 19, Supabase Realtime, extensiones espaciales PostGIS, pasarelas de pago virtuales para transacciones y control concurrente de suscripciones, logrando que el producto final cumpla con rigurosos estándares de rendimiento, escalabilidad y tolerancia a fallos."
          ),
          
          createHeading("1.1 Análisis de Deficiencias y Modelo de Negocio (Gap Analysis)", HeadingLevel.HEADING_2),
          createParagraph(
            "Antes de iniciar la reestructuración técnica, se realizó un Gap Analysis exhaustivo para comparar las capacidades del MVP original con la visión escalable del ecosistema V2, tomando como referentes a líderes de industria (Tinder para matchmaking, Instagram para feeds sociales y Uber/Stripe para geolocalización y pasarelas de pago):"
          ),
          
          // Tabla de Gap Analysis
          createTable([
            ["Componente del MVP", "Limitación Identificada", "Arquitectura Propuesta V2 / Sprint 2"],
            [
              "Motor de Matchmaking",
              "Filtrado manual en JS client-side (O(N)), consumo ineficiente de red, perfiles repetidos continuamente.",
              "Consultas geoespaciales y exclusión en base de datos. Integración futura con embeddings vectoriales de Vertex AI."
            ],
            [
              "Estructura de Datos Social",
              "Usuarios aislados, sin feed comunitario ni posibilidad de compartir logros, afectando la retención (DAU/MAU).",
              "Grafo social relacional (followers, squads, comments, likes) integrado en tiempo real con Supabase Realtime."
            ],
            [
              "Geolocalización",
              "Coordenadas en punto flotante genérico calculadas en el cliente. Vulnerabilidad de privacidad y Haversine ineficiente.",
              "Uso de tipos GEOGRAPHY y búsqueda acelerada por índices espaciales R-Tree (GIST) en Postgres con PostGIS."
            ],
            [
              "Mensajería y Notificaciones",
              "Sin notificaciones push y sockets inestables. Caídas y duplicación de suscripciones al montar layouts complejos.",
              "Canales dedicados con control de concurrencia mediante conteo de referencias (Ref Counting) y limpieza de canal."
            ]
          ]),
          
          new Paragraph({ text: "", spacing: { before: 200 } }),

          // ================= SECCION 2 =================
          createHeading("2. METODOLOGÍA ÁGIL Y PLANIFICACIÓN (SPRINTS 1 AL 4)", HeadingLevel.HEADING_1),
          createParagraph(
            "La construcción de SportMatch Connect sigue la metodología ágil Scrum, operando en iteraciones cerradas (sprints) de 2 semanas cada una. Toda la planificación, estimación de puntos de historia, asignación de tareas y seguimiento del flujo de trabajo se gestiona a través de la herramienta Jira en el proyecto 'SCRUM'."
          ),
          createParagraph(
            "A fin de alinear el desarrollo de ingeniería con el plan de entrega, se estructuraron de manera rigurosa las historias de usuario de los Sprints 1 y 2, y se definieron los alcances de los Sprints 3 y 4. Edwin Flores, en su rol de Desarrollador Principal y Líder Técnico, asumió la propiedad y ejecución de los módulos más complejos relacionados con infraestructura, sincronización en tiempo real, geolocalización espacial y la pasarela financiera del sistema."
          ),
          
          createHeading("2.1 Resumen del Backlog por Sprints", HeadingLevel.HEADING_2),
          createParagraph(
            "El backlog de Jira se dividió de acuerdo a los siguientes objetivos estratégicos:"
          ),
          
          createBulletPoint(
            "Sprint 1: Cimiento del Ecosistema. Enfoque en la autenticación robusta mediante proveedores externos (Google OAuth), establecimiento del flujo guiado de registro inicial (Onboarding multideporte con soporte para 36 disciplinas deportivas) y compresión de archivos multimedia en el cliente (imágenes WebP)."
          ),
          createBulletPoint(
            "Sprint 2: Transición a Cloud-First. Conectividad en tiempo real (Supabase Realtime y WebSockets), integración espacial (PostGIS con búsqueda indexada por proximidad), billetera digital de monedas (FitCoins transaccionales), prevención de colisiones en suscripciones del UI, y despliegue continuo en Vercel."
          ),
          createBulletPoint(
            "Sprint 3 (Planificado - 40 Historias de Usuario): Enfocado en la optimización del algoritmo de matchmaking, notificaciones por correo de confirmación de reservas, sistema dinámico de retos (challenges), y consolidación de la estructura del feed comunitario con soporte para comentarios y reacciones enriquecidas."
          ),
          createBulletPoint(
            "Sprint 4 (Planificado - 40 Historias de Usuario): Enfocado en integraciones con APIs externas (Strava/GPS), monitoreo de telemetría IoT mediante Smartwatches, analítica y reportes de uso empresarial para los clubes afiliados, caching avanzado offline mediante TanStack Query Persister y auditorías de accesibilidad (WCAG 2.1 AA)."
          ),

          createHeading("2.2 Tabla de Historias de Usuario Destacadas", HeadingLevel.HEADING_2),
          createTable([
            ["Código Jira", "Historia de Usuario (Resumen)", "Asignado a", "Estado actual"],
            ["SCRUM-178", "Completar perfil deportivo en flujo guiado de 2 pasos", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-179", "Detectar foto de perfil automáticamente de Google OAuth", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-185", "Ver score de compatibilidad numérico con otros deportistas", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-186", "Reservar cancha interactiva seleccionando fecha y hora", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-190", "Visualizar balance de FitCoins en el dashboard principal", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-194", "Recibir notificaciones en tiempo real al ingresar nuevo partido", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-197", "Enviar y recibir mensajes en tiempo real en chats de squads", "Edwin Flores Sanchez", "Finalizada"],
            ["SCRUM-201", "Crear partidos especificando deporte, cancha y nivel requerido", "Edwin Flores Sanchez", "Finalizada"]
          ]),
          
          new Paragraph({ text: "", pageBreakBefore: true }),

          // ================= SECCION 3 =================
          createHeading("3. SPRINT 1 - ENTREGABLES TÉCNICOS Y ARQUITECTURA", HeadingLevel.HEADING_1),
          createParagraph(
            "Durante el Sprint 1, el equipo de ingeniería se concentró en construir los cimientos del sistema. La arquitectura inicial del proyecto se diseñó como una Single Page Application (SPA) moderna, utilizando React 19, TypeScript estricto, Vite como empaquetador y TanStack Router para el manejo de rutas tipadas y seguras del lado del cliente."
          ),
          
          createHeading("3.1 Autenticación de Doble Vía e Integración de Google OAuth", HeadingLevel.HEADING_2),
          createParagraph(
            "La autenticación se implementó utilizando Supabase Auth, integrando Google OAuth como proveedor principal de identidad. Se identificó e implementó una mitigación para un problema crítico recurrente en las Single Page Applications: el bucle de redirección infinita provocado por la sincronización asíncrona de la sesión en el almacenamiento del navegador y las validaciones de carga del enrutador."
          ),
          createParagraph(
            "Para solucionarlo, se desarrolló un manejador de estado altamente resiliente en el hook de autenticación. Este manejador intercepta de forma reactiva el evento de cambio de autenticación (`onAuthStateChange`) de Supabase, validando la integridad del objeto de sesión antes de actualizar el estado global de Zustand. Si se detecta un token inválido o incompleto, el sistema redirige de inmediato a la ruta `/login`, evitando evaluar las restricciones de acceso del Dashboard. Asimismo, se implementó la extracción automática de metadatos de Google OAuth, recuperando la imagen de perfil del usuario en alta resolución y su nombre completo, evitando que el usuario deba cargar manualmente estos datos."
          ),
          
          createHeading("3.2 Onboarding de 36 Deportes y Adaptabilidad Dinámica de Perfiles", HeadingLevel.HEADING_2),
          createParagraph(
            "Para garantizar que los usuarios tuvieran una experiencia ágil y estructurada, el registro de deportistas se dividió en un onboarding de dos pasos con un indicador visual de progreso interactivo. En esta etapa, el usuario puede seleccionar su nivel de habilidad (Principiante, Intermedio, Avanzado) para un catálogo de hasta 36 disciplinas deportivas tradicionales y electrónicas."
          ),
          createParagraph(
            "A nivel de almacenamiento, los perfiles deportivos heredados (legacy) a menudo carecían de columnas necesarias en la tabla `profiles`. Para evitar que la interfaz fallara en tiempo de ejecución, Edwin Flores implementó un mecanismo de auto-sanación en el backend y frontend. Cuando un perfil antiguo se registra, el sistema detecta si hay discrepancias de columnas no existentes. Si la actualización falla con errores relacionales (códigos PGRST204 o 42703), el sistema atrapa la excepción y ejecuta una mutación intermedia para inicializar las estructuras de datos con valores por defecto (fallbacks dinámicos), garantizando la continuidad de la sesión."
          ),

          // ================= SECCION 4 =================
          createHeading("4. SPRINT 2 - INTEGRACIONES, BASE DE DATOS Y REALTIME", HeadingLevel.HEADING_1),
          createParagraph(
            "El Sprint 2 representó un salto arquitectónico definitivo. La base de datos local y simulada se reemplazó por un entorno cloud-first completamente integrado con extensiones geográficas, canales WebSockets e integraciones financieras. A continuación se detallan las tres grandes innovaciones de este sprint."
          ),
          
          createHeading("4.1 Geolocalización Avanzada con PostGIS y Haversine en el Cliente", HeadingLevel.HEADING_2),
          createParagraph(
            "Para emparejar eficientemente a los deportistas con otros jugadores y canchas en un radio determinado, la plataforma utiliza la extensión espacial PostGIS habilitada en PostgreSQL. Las coordenadas exactas (latitud y longitud) se almacenan en la columna `location` de tipo `GEOGRAPHY(Point, 4326)`. Esto permite realizar consultas de distancia elipsoidales ultra rápidas."
          ),
          createParagraph(
            "En el servidor, se implementó una función almacenada (RPC) llamada `search_nearby_courts`. Esta función utiliza el operador espacial `<->` de PostGIS, que aprovecha los índices espaciales R-Tree (GIST) configurados en la tabla de canchas. Al segmentar el espacio geográfico en cajas delimitadoras jerárquicas, la base de datos puede encontrar y ordenar las canchas a menos de X kilómetros de distancia en tiempo logarítmico O(log N), evitando el escaneo total de la base de datos."
          ),
          createParagraph(
            "Del lado del cliente, se implementó la fórmula de Haversine para calcular distancias lineales rápidas en componentes interactivos ligeros (como las tarjetas de perfil en el matchmaking). De esta forma, el cliente calcula y muestra la distancia aproximada sin saturar la red con peticiones continuas al servidor:"
          ),
          createCodeBlock(
            "d = 2 * R * arcsin( sqrt( sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlon/2) ) )"
          ),
          
          createHeading("4.2 Wallet Deportiva de FitCoins y Procesador de Pagos Seguro", HeadingLevel.HEADING_2),
          createParagraph(
            "El sistema incorpora una economía gamificada basada en 'FitCoins', monedas virtuales utilizadas para pagar la reserva de canchas y participar en partidos de pago. Para mitigar el fraude y asegurar la consistencia del saldo, se implementó una estricta validación en el servidor mediante triggers de PostgreSQL y reglas de seguridad de nivel de fila (RLS)."
          ),
          createParagraph(
            "Cuando un usuario intenta reservar, el sistema verifica que su saldo en FitCoins sea mayor o igual al costo total. Toda deducción y recarga de saldo se registra en una tabla transaccional de auditoría `transactions` en Supabase. En la interfaz de usuario, se desarrolló un simulador financiero seguro que conecta visualmente con pasarelas de pago (Niubiz/Stripe). Si el usuario no tiene saldo suficiente, la aplicación interrumpe el flujo y abre un modal interactivo de recarga rápida."
          ),
          createParagraph(
            "Además, se implementó el 'Efecto Cascada Social'. Al confirmar la reserva de una cancha por parte de un Squad (grupo), el sistema calcula el precio por hora de la cancha y lo divide automáticamente en partes iguales entre todos los miembros confirmados del grupo. Esto optimiza la organización colectiva y democratiza el pago en grupo."
          ),
          
          createHeading("4.3 Canal Realtime para Notificaciones y Resolución de Concurrencia", HeadingLevel.HEADING_2),
          createParagraph(
            "Para proporcionar una experiencia interactiva fluida, la aplicación escucha eventos en tiempo real mediante Supabase Realtime. El sistema notifica al usuario cuando se publica un nuevo partido, se recibe un mensaje de chat de su Squad o se altera el saldo de su billetera."
          ),
          createParagraph(
            "No obstante, se identificó un fallo de concurrencia crítico en entornos de producción: la barra lateral (`AppShell.tsx`) renderizaba dos instancias concurrentes del componente `NotificationBell` (la vista lateral para computadoras de escritorio y la cabecera superior para dispositivos móviles). Al montarse de manera simultánea, ambas instancias intentaban suscribirse al mismo canal WebSocket `user-notifications-${user.id}` llamando a `.subscribe()` y agregando listeners de eventos `.on('postgres_changes', ...)`."
          ),
          createParagraph(
            "Supabase-js administra los canales utilizando una caché interna indexada por el nombre del canal. Al solicitar la misma suscripción en paralelo, el cliente retornaba un objeto de canal compartido que ya estaba en estado 'suscribiendo' o 'suscrito', lo que hacía que la segunda llamada a `.on(...)` lanzara una excepción fatal en la consola que bloqueaba la interfaz de usuario."
          ),
          createParagraph(
            "La solución implementada por Edwin Flores consistió en dos mecanismos clave:"
          ),
          createBulletPoint(
            "1. Conteo de Referencias (Reference Counting): Se crearon variables a nivel de módulo (`activeChannel`, `activeChannelUserId` y `activeCount`). Cuando la primera campana de notificación se monta, inicializa el canal, agrega los listeners y llama a `.subscribe()`, estableciendo el conteo en 1. Cuando la segunda campana se monta, detecta que el canal ya está activo, incrementa el conteo a 2 y omite el registro redundante del listener. En el desmontaje, el conteo decrementa; el canal solo se desuscribe físicamente cuando el conteo llega a 0."
          ),
          createBulletPoint(
            "2. Limpieza de Tópicos Duplicados en Caché: Antes de suscribirse a un nuevo canal si `activeChannel` es nulo (por ejemplo, después de un desmontaje rápido en React Strict Mode), la aplicación ejecuta una búsqueda en la caché del cliente utilizando `supabase.getChannels()`. Si encuentra un canal huérfano con el mismo nombre de tópico, llama a `supabase.removeChannel(existingChannel)` para eliminarlo del listado interno antes de crear una nueva conexión limpia."
          ),
          
          new Paragraph({ text: "", pageBreakBefore: true }),

          // ================= SECCION 5 =================
          createHeading("5. DIAGRAMAS DE FLUJO Y ARQUITECTURA DEL SISTEMA", HeadingLevel.HEADING_1),
          createParagraph(
            "Para comprender a fondo la lógica operativa y la estructura técnica de SportMatch Connect, en esta sección se detallan los flujos y modelos del sistema."
          ),
          
          createHeading("5.1 Diagrama de Arquitectura Física y Lógica (Antes vs. Después)", HeadingLevel.HEADING_2),
          createParagraph(
            "La siguiente representación esquemática detalla la transformación arquitectónica implementada en el Sprint 2:"
          ),
          createASCIIBox([
            "+-------------------------------------------------------------------------+",
            "|               ARQUITECTURA ANTES (MVP OFFLINE-FIRST)                    |",
            "+-------------------------------------------------------------------------+",
            "|  React 19 / Vite  --->  Local Storage Mock  --->  Datos en memoria JS   |",
            "|  (Sin Sockets)           (Datos Estaticos)        (O(N) client-side)     |",
            "+-------------------------------------------------------------------------+",
            "",
            "+-------------------------------------------------------------------------+",
            "|               ARQUITECTURA DESPUÉS (CLOUD-FIRST MULTILAYER)             |",
            "+-------------------------------------------------------------------------+",
            "| 1. Frontend Layer:                                                      |",
            "|    React 19 + TanStack Router (Rutas seguras y protegidas)              |",
            "|    Zustand Store (Manejo de estado global reactivo)                     |",
            "|    Leaflet Map Component (Renderizado de mapa interactivo)              |",
            "|                                                                         |",
            "| 2. Integration / API Layer:                                             |",
            "|    Supabase-js Client (Conectado via TLS a Supabase Cloud)              |",
            "|    Google OAuth API (Proveedores externos de identidad)                 |",
            "|    Payment Simulator (Lógica financiera para Stripe/Niubiz)             |",
            "|                                                                         |",
            "| 3. Cloud / Database Layer (Supabase Postgres):                          |",
            "|    - Realtime Server (WebSockets para chat de squads y notificaciones)   |",
            "|    - PostGIS Engine (Índices GIST para consultas espaciales en mapa)    |",
            "|    - RLS Rules & DB Triggers (Deducción segura de FitCoins en Wallet)   |",
            "+-------------------------------------------------------------------------+"
          ]),
          
          createHeading("5.2 Diagrama de Secuencia del Onboarding y Autenticación", HeadingLevel.HEADING_2),
          createParagraph(
            "Este diagrama describe el flujo de registro y auto-sanación de perfiles:"
          ),
          createASCIIBox([
            "Usuario              Google OAuth             App Frontend             Supabase DB",
            "   |                      |                        |                        |",
            "   |-- 1. Iniciar sesión ->|                        |                        |",
            "   |                      |-- 2. Retorna perfil -->|                        |",
            "   |                      |      (Email, Foto)     |                        |",
            "   |                                               |-- 3. Verifica perfil ->|",
            "   |                                               |<-- 4. Perfil legacy ---|",
            "   |                                               |    (Faltan columnas)   |",
            "   |                                               |-- 5. Inicializa defaults|",
            "   |                                               |      (Auto-sanación) ->|",
            "   |                                               |<-- 6. Perfil guardado -|",
            "   |<-- 7. Flujo Onboarding 2 pasos (Completo) ----|                        |"
          ]),

          createHeading("5.3 Diagrama de Flujo del Proceso de Reserva con Efecto Cascada", HeadingLevel.HEADING_2),
          createParagraph(
            "El siguiente flujo muestra la interacción del usuario al reservar una cancha:"
          ),
          createASCIIBox([
            "[Usuario selecciona cancha y horario] ---> (¿Hay disponibilidad en DB?)",
            "                                                |",
            "                                                |--- NO ---> [Muestra alerta horario ocupado]",
            "                                                |",
            "                                               SI",
            "                                                ▼",
            "                                        (¿Tiene saldo en FitCoins?)",
            "                                                |",
            "                                                |--- NO ---> [Abre modal de recarga rápida]",
            "                                                |",
            "                                               SI",
            "                                                ▼",
            "                                    [Procesa pago simulado Stripe]",
            "                                                ▼",
            "                                 [Registra reserva en tabla bookings]",
            "                                                ▼",
            "                               [trigger: Divide costo entre Squad]",
            "                                                ▼",
            "                             [Crea match y publica en mapa / Realtime]"
          ]),
          
          new Paragraph({ text: "", pageBreakBefore: true }),

          // ================= SECCION 6 =================
          createHeading("6. CONCLUSIONES Y TRABAJO FUTURO", HeadingLevel.HEADING_1),
          createParagraph(
            "La finalización del Sprint 2 ha consolidado a SportMatch Connect como una plataforma robusta y lista para operaciones en tiempo real en la nube. La resolución de fallos críticos de concurrencia y la integración espacial sientan las bases técnicas para escalar la base de usuarios de forma sostenible."
          ),
          
          createHeading("6.1 Lecciones Aprendidas y Conclusiones Técnicas", HeadingLevel.HEADING_2),
          createParagraph(
            "1. La importancia del control de concurrencia en la interfaz: Las librerías de tiempo real (como Supabase o Socket.io) asumen un control de flujo limpio. La implementación del patrón de conteo de referencias resolvió de raíz los bloqueos en layouts de React con campanas de notificación redundantes."
          ),
          createParagraph(
            "2. Optimización geoespacial desde el cimiento: Delegar el cálculo de proximidades físicas a PostGIS mediante índices espaciales en el servidor (en lugar de calcular Haversine sobre toda la base de datos en el cliente) ahorra ancho de banda y batería del dispositivo móvil, mejorando la latencia en O(log N)."
          ),
          createParagraph(
            "3. Tolerancia a fallos mediante mecanismos de auto-sanación: En ecosistemas distribuidos con perfiles heredados o migraciones parciales de base de datos, el código del cliente debe ser lo suficientemente inteligente para interceptar errores de esquema e inicializar valores por defecto."
          ),

          createHeading("6.2 Roadmap de Sprints 3 y 4", HeadingLevel.HEADING_2),
          createParagraph(
            "El equipo de desarrollo se enfocará en las siguientes metas para los próximos sprints:"
          ),
          createBulletPoint(
            "• SPRINT 3: Implementar la recomendación dinámica de oponentes compatibles mediante embeddings generados en Vertex AI, habilitar el feed comunitario interactivo con soporte para comentarios jerárquicos y emojis de reacción, y diseñar el sistema de retos (challenges) competitivos semanales."
          ),
          createBulletPoint(
            "• SPRINT 4: Integrar el SDK de GPS y Strava para trackear el rendimiento de los jugadores en canchas abiertas, habilitar telemetría en tiempo real desde relojes inteligentes (Zustand Debounced IoT Store) y certificar la interfaz web bajo los estándares de accesibilidad internacional WCAG 2.1 AA."
          )
        ],
      },
    ],
  });

  return doc;
}

// Helper to create H1/H2 Headings with consistent formatting
function createHeading(text, headingLevel) {
  const size = headingLevel === HeadingLevel.HEADING_1 ? 28 : 22;
  const color = headingLevel === HeadingLevel.HEADING_1 ? "1F4E79" : "595959";
  const spacing = headingLevel === HeadingLevel.HEADING_1 ? { before: 240, after: 120 } : { before: 180, after: 80 };
  
  return new Paragraph({
    heading: headingLevel,
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: size,
        font: "Calibri",
        color: color,
      }),
    ],
    spacing: spacing,
  });
}

// Helper for standard paragraph
function createParagraph(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: 22,
        font: "Calibri",
        color: "333333",
      }),
    ],
    spacing: { after: 140, line: 276 }, // 1.15 line spacing equivalent
  });
}

// Helper for bullet points
function createBulletPoint(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: 22,
        font: "Calibri",
        color: "333333",
      }),
    ],
    spacing: { after: 100, line: 240 },
    indent: { left: 400 },
  });
}

// Helper for code blocks
function createCodeBlock(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        font: "Consolas",
        size: 18,
        color: "202020",
      }),
    ],
    spacing: { before: 100, after: 100 },
    indent: { left: 400 },
  });
}

// Helper for ASCII graphics/boxes
function createASCIIBox(lines) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "D9D9D9" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "D9D9D9" },
      left: { style: BorderStyle.SINGLE, size: 6, color: "D9D9D9" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "D9D9D9" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: lines.map(line => new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  font: "Consolas",
                  size: 16,
                  color: "1F4E79",
                })
              ],
              spacing: { after: 40 }
            })),
            margins: { top: 150, bottom: 150, left: 150, right: 150 }
          })
        ]
      })
    ]
  });
}

// Helper for data tables
function createTable(dataRows) {
  const isHeader = (rowIndex) => rowIndex === 0;

  const tableRows = dataRows.map((row, rowIndex) => {
    return new TableRow({
      children: row.map((cellText) => {
        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText,
                  bold: isHeader(rowIndex),
                  size: 20,
                  font: "Calibri",
                  color: isHeader(rowIndex) ? "FFFFFF" : "333333",
                }),
              ],
              spacing: { after: 60, before: 60 },
            }),
          ],
          shading: isHeader(rowIndex) ? { fill: "1F4E79" } : undefined,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
          },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

// Compile and write document
createDocument().then((doc) => {
  Packer.toBuffer(doc).then((buffer) => {
    const filename = "Informe_Sprint_2.docx";
    fs.writeFileSync(filename, buffer);
    console.log(`Successfully generated ${filename}`);
  });
}).catch(err => {
  console.error("Failed to generate document:", err);
});
