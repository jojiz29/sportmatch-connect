# ESTRUCTURA DE COSTOS Y ANÁLISIS FINANCIERO DEFINITIVO — SPORTMATCH CONNECT

El presente informe detalla y sustenta de manera exhaustiva la estructura de costos fijos y variables, presupuestos operativos, inversiones en infraestructura en la nube (AWS y Supabase), estrategias de marketing y adquisición, programas de fidelidad basados en incentivos y la contabilidad fiscal bajo la normativa tributaria de la República del Perú.

El objetivo de este documento es justificar los costos reales de **SportMatch Connect** operando como una empresa tecnológica constituida de manera formal.

---

## 1. Sustento y Justificación de Costos de Infraestructura Cloud (AWS & Supabase)

Para estimar con precisión el costo mensual de infraestructura en producción, se ha estructurado una arquitectura en la nube de alta disponibilidad utilizando servicios administrados de **Amazon Web Services (AWS)** en conjunto con el backend-as-a-service de **Supabase** (región de Oregon `us-west-2`).

La estimación se realiza para una base operativa promedio de **10,000 usuarios activos mensuales (MAU)** y una concurrencia pico de 500 solicitudes por minuto.

### 1.1. Base de Datos Relacional y Motor Espacial (Supabase + AWS Aurora)
*   **Supabase Pro Plan ($35.00/mes):** Provee el motor principal de base de datos PostgreSQL 15 en la nube, incluyendo soporte nativo para la extensión PostGIS, autenticación JWT, tiempo de respuesta en realtime y un límite base de 8GB de almacenamiento en disco con PITR backups.
*   **AWS Aurora Serverless v2 PostgreSQL (Multi-AZ) - Replica de Lectura ($120.00/mes):** Para garantizar que las consultas analíticas del feed social y el motor de matchmaking no bloqueen la base de datos transaccional principal, se provisiona una réplica de base de datos relacional de lectura db.t4g.medium (2 vCPU, 4GB RAM) balanceando la carga en alta disponibilidad.

### 1.2. Servidores de Aplicación NestJS (AWS ECS + Fargate)
*   **AWS ECS (Elastic Container Service) con Fargate ($35.00/mes):** Despliegue serverless del backend de NestJS 11 empaquetado en contenedores Docker. Se configuran 2 tareas (tasks) simultáneas con 0.5 vCPU y 1 GB de RAM cada una para balancear la carga de solicitudes HTTP/REST.

### 1.3. Almacenamiento y Entrega de Contenido (AWS S3 + CloudFront)
*   **AWS S3 Standard ($5.00/mes):** Almacenamiento persistente de imágenes de perfil de usuarios, fotos cargadas por las escuadras (Squads), archivos temporales y copias de seguridad de logs.
*   **AWS CloudFront ($10.00/mes):** Red de entrega de contenido (CDN) distribuida globalmente con puntos de presencia en Lima. CloudFront optimiza la velocidad de carga del cliente React 19 y reduce los costos de transferencia de salida de S3 sirviendo los assets estáticos y mapas Leaflet desde el borde de red cercano al usuario.

### 1.4. Seguridad, Networking y Monitoreo
*   **AWS Route 53 + AWS WAF ($20.00/mes):** Gestión de zonas DNS, enrutamiento rápido y protección de la API contra ataques de denegación de servicio (DDoS) o inyecciones de código.
*   **AWS CloudWatch + AWS KMS ($10.00/mes):** Almacenamiento cifrado de logs del sistema para auditorías internas, métricas de rendimiento y encriptación de claves de seguridad transaccionales (Stripe API key, base de datos).

---

## 2. Estrategia de Marketing, Adquisición de Clientes y Fidelización

### 2.1. Costo de Adquisición de Clientes (CAC) y Costo por Clic (CPC)
El marketing digital para una plataforma social y deportiva en Lima Metropolitana requiere campañas hiper-geolocalizadas segmentadas por rango etario (18-35 años) y distritos objetivo (Lima Moderna: Surco, Miraflores, San Borja, etc.).
*   **Presupuesto Mensual Base (Año 1):** **S/. 200.00 PEN** (distribuido en S/. 120.00 para Meta Ads y S/. 80.00 para TikTok Ads).
*   **CPC Promedio Estimado (Meta/TikTok):** **S/. 0.25 PEN**. Con S/. 200.00 al mes, se logran aproximadamente 800 visitas al landing page de descargas.
*   **Tasa de Conversión a Registro Activo (Click-to-Install):** **10%**. Se estiman 80 nuevos usuarios registrados mensuales provenientes de pauta pagada, resultando en un **CAC de S/. 2.50 PEN** por usuario registrado.

### 2.2. Costo del Programa de Fidelidad y Recompensas (FitCoins)
El programa de recompensas premia a los usuarios por su puntualidad y por completar partidos sin cancelaciones de última hora. Las FitCoins acumuladas son canjeables por cupones de descuento físicos y virtuales en complejos deportivos y tiendas asociadas.
*   **Mecánica Financiera:** Por cada partido jugado con éxito sin incidencias, el jugador acumula FitCoins equivalentes a **S/. 0.50 PEN** de valor de canje.
*   **Margen de Redención de Recompensas (Vouchers):** Se establece una alianza B2B comercial donde los complejos deportivos asumen el 20% del valor del cupón como descuento promocional para atraer clientes en horas de baja demanda. Así, un cupón de **S/. 5.00 PEN** canjeado le cuesta a la empresa **S/. 4.00 PEN**.
*   **Costo de Loyalty Mensual Proyectado:** **S/. 400.00 PEN** (soportando hasta 100 cupones de descuento canjeados con éxito en la plataforma).

---

## 3. Régimen Tributario e Impuestos en el Perú (Año Fiscal 2026)

Como empresa de base tecnológica constituida en el Perú, SportMatch Connect opera bajo las regulaciones fiscales controladas por la Superintendencia Nacional de Aduanas y de Administración Tributaria (**SUNAT**).

### 3.1. Régimen MYPE Tributario (RMT)
Debido a que la empresa proyecta ingresos anuales menores a las 1,700 UIT (con la UIT 2026 fijada en **S/. 5,500.00 PEN**), califica para el **Régimen MYPE Tributario**, que ofrece las siguientes ventajas impositivas progresivas sobre la Renta Neta Anual:
*   **Tramo 1 (Hasta 15 UIT = S/. 82,500.00 de utilidad neta):** Tasa del **10%**.
*   **Tramo 2 (Exceso de 15 UIT):** Tasa de **29.5%**.

### 3.2. Pagos a Cuenta Mensuales
Para evitar un desembolso masivo al cierre del ejercicio anual, el RMT exige pagos a cuenta mensuales de Impuesto a la Renta:
*   **Hasta 300 UIT de ingresos anuales:** **1.0%** sobre los ingresos netos del mes (declarado mediante el Formulario Virtual 621).

### 3.3. Impuesto General a las Ventas (IGV)
*   Se aplica una tasa del **18%** (16% de IGV + 2% de Impuesto de Promoción Municipal) sobre las comisiones cobradas a los complejos deportivos B2B y las suscripciones premium facturadas a los usuarios B2C. Este impuesto es de naturaleza traslativa y se compensa mensualmente con el Crédito Fiscal generado por las compras de la empresa (tales como publicidad o equipamiento corporativo).

### 3.4. Impuesto a las Transacciones Financieras (ITF)
*   Tasa del **0.005%** sobre cada movimiento de entrada y salida de fondos de las cuentas bancarias de la empresa (depósitos, transferencias, retiros).

---

## 4. Estructura de Costos del Proyecto

A continuación se consolidan los costos recurrentes anuales y el flujo de caja proyectado a 3 años para la operación del negocio:

### 4.1. Resumen de Inversión Inicial y Depreciación
La inversión total requerida asciende a **S/. 74,388.82 PEN**, donde la mayor proporción corresponde al capital humano de los investigadores (S/. 64,000.00 PEN). Con el fin de estructurar correctamente el estado contable, el equipamiento de computo se deprecia mensualmente a una tasa lineal para 36 meses bajo el Decreto Legislativo N° 822.

### 4.2. Flujo de Caja Proyectado a 3 Años
El flujo financiero asume un crecimiento sostenido impulsado por la adopción de la plataforma en Lima:
*   **Año 1:** Ingresos brutos de S/. 41,500.00, flujos netos de caja positivos a partir del mes 2, acumulando un total de **S/. 27,750.00**.
*   **Año 2:** Crecimiento en reservas y suscripciones premium premium en Lima Moderna, acumulando un flujo neto de **S/. 63,360.00**.
*   **Año 3:** Expansión de recintos en Lima Norte y Este, alcanzando ingresos de S/. 126,000.00 y un flujo de caja neto anual de **S/. 100,240.00**.

### 4.3. Indicadores de Rentabilidad Financiera
*   **Valor Actual Neto (VAN) @ 12% COK:** **S/. 84,250.00 PEN**. Al ser un valor superior a cero, demuestra que el proyecto cubre el costo de oportunidad del capital y genera excedentes monetarios significativos.
*   **Tasa Interna de Retorno (TIR):** **38.4%**. La TIR supera holgadamente la tasa de descuento de referencia (12%), corroborando la excelente viabilidad comercial de la invención tecnológica.
*   **Periodo de Recuperación de Inversión (Payback):** **14 meses** desde el inicio de las operaciones.

*(Nota: Todos estos datos se encuentran estructurados y calculados en la hoja de cálculo [SportMatch_Connect_Financial_Plan.xlsx](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/10.%20Estructura%20de%20Costos%20y%20Flujo%20de%20Caja/SportMatch_Connect_Financial_Plan.xlsx) ubicada en esta misma carpeta entregable).*
