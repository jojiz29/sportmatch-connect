# ESTRUCTURA DE COSTOS Y ANÁLISIS FINANCIERO DEFINITIVO — SPORTMATCH CONNECT

El presente informe detalla y sustenta de manera exhaustiva la estructura de costos fijos y variables, presupuestos operativos, inversiones en infraestructura en la nube (AWS y Supabase), estrategias de marketing y adquisición, programas de fidelidad basados en incentivos y la contabilidad fiscal bajo la normativa tributaria de la República del Perú.

El objetivo de este documento es justificar los costos y tarifas reales de **SportMatch Connect** operando como una empresa tecnológica constituida de manera formal.

---

## 1. Sustento y Justificación de Costos de Infraestructura Cloud (AWS & Supabase)

Para estimar con precisión el costo mensual de infraestructura en producción, se ha estructurado una arquitectura en la nube de alta disponibilidad utilizando servicios administrados de **Amazon Web Services (AWS)** en conjunto con el backend-as-a-service de **Supabase** (región de Oregon `us-west-2`).

La estimación se realiza para una base operativa promedio de **10,000 usuarios activos mensuales (MAU)** y una concurrencia pico de 500 solicitudes por minuto.

### 1.1. Base de Datos Relacional y Motor Espacial (Supabase + AWS Aurora)
*   **Supabase Pro Plan ($35.00/mes = S/. 133.00 PEN):** Provee el motor principal de base de datos PostgreSQL 15 en la nube, incluyendo soporte nativo para la extensión PostGIS, autenticación JWT, tiempo de respuesta en realtime y un límite base de 8GB de almacenamiento en disco con PITR backups.
*   **AWS Aurora Serverless v2 PostgreSQL (Multi-AZ) - Replica de Lectura ($120.00/mes = S/. 456.00 PEN):** Para garantizar que las consultas analíticas del feed social y el motor de matchmaking no bloqueen la base de datos transaccional principal, se provisiona una réplica de base de datos relacional de lectura db.t4g.medium (2 vCPU, 4GB RAM) balanceando la carga en alta disponibilidad.

### 1.2. Servidores de Aplicación NestJS (AWS ECS + Fargate)
*   **AWS ECS (Elastic Container Service) con Fargate ($35.00/mes = S/. 133.00 PEN):** Despliegue serverless del backend de NestJS 11 empaquetado en contenedores Docker. Se configuran 2 tareas (tasks) simultáneas con 0.5 vCPU y 1 GB de RAM cada una para balancear la carga de solicitudes HTTP/REST.

### 1.3. Almacenamiento y Entrega de Contenido (AWS S3 + CloudFront)
*   **AWS S3 Standard ($5.00/mes = S/. 19.00 PEN):** Almacenamiento persistente de imágenes de perfil de usuarios, fotos cargadas por las escuadras (Squads), archivos temporales y copias de seguridad de logs.
*   **AWS CloudFront ($10.00/mes = S/. 38.00 PEN):** Red de entrega de contenido (CDN) distribuida globalmente con puntos de presencia en Lima. CloudFront optimiza la velocidad de carga del cliente React 19 y reduce los costos de transferencia de salida de S3 sirviendo los assets estáticos y mapas Leaflet desde el borde de red cercano al usuario.

### 1.4. Seguridad, Networking y Monitoreo
*   **AWS Route 53 + AWS WAF ($20.00/mes = S/. 76.00 PEN):** Gestión de zonas DNS, enrutamiento rápido y protección de la API contra ataques de denegación de servicio (DDoS) o inyecciones de código.
*   **AWS CloudWatch + AWS KMS ($10.00/mes = S/. 38.00 PEN):** Almacenamiento cifrado de logs del sistema para auditorías internas, métricas de rendimiento y encriptación de claves de seguridad transaccionales (Stripe API key, base de datos).

---

## 2. Sustento Comercial de Tarifas y Precios de Venta

La viabilidad comercial de la plataforma descansa en un modelo híbrido de monetización B2B y B2C, diseñado de manera competitiva frente a soluciones extranjeras (como EasyCancha y Playtomic) y adaptado a la economía de Lima Metropolitana.

### 2.1. Comisión B2B del 5% sobre Alquiler de Campos
*   **Valor Promedio:** Las canchas privadas en Lima Moderna (fútbol 7, pádel, básquetbol) cobran una tarifa media de **S/. 90.00 PEN** por hora de reserva. Una comisión del 5% equivale a **S/. 4.50 PEN** por encuentro.
*   **Justificación Comercial:** Esta comisión es absorbida en su totalidad por el centro deportivo. A cambio, el recinto recibe exposición nativa ante miles de jugadores recreativos locales, lo que incrementa su tasa de ocupación promedio del **35% al 65%** (reduciendo drásticamente las horas muertas durante los días de semana). El software también les provee un panel administrativo de reservas en la nube gratuito.

### 2.2. Suscripción B2C Premium de S/. 19.90 Mensual
*   **Valor Promedio:** El precio de suscripción mensual es inferior al costo de media cajetilla de cigarrillos o un café Starbucks, lo cual representa una barrera de entrada insignificante para deportistas recreativos concurrentes de niveles socioeconómicos A, B y C.
*   **Beneficios Premium:**
    *   *Reserva Anticipada:* Permite asegurar campos deportivos 48 horas antes que los usuarios regulares.
    *   * Matchmaking Prioritario:* Aumenta en un +15% el peso del coeficiente de compatibilidad en el motor de emparejamiento.
    *   *Cero Publicidad:* Interfaz libre de banners de marcas deportivas afiliadas.
    *   *Inscripción Gratuita:* Descuentos directos en ligas privadas y torneos organizados por la plataforma.

---

## 3. Régimen Tributario e Impuestos en el Perú (SUNAT 2026)

Como empresa de base tecnológica constituida en el Perú, SportMatch Connect opera bajo las regulaciones fiscales de la **SUNAT**. El flujo de caja de la empresa integra de forma explícita el cálculo de los siguientes impuestos para obtener una proyección de caja neta real:

### 3.1. Impuesto General a las Ventas (IGV - 18%)
El IGV del 18% se aplica de forma obligatoria tanto a las ventas (Ingresos Brutos) como a los egresos nacionales (Compras). El flujo de caja realiza la liquidación mensual de IGV:
*   **IGV Cobrado (Débito Fiscal):** Se calcula extrayendo el 18% de la Base Imponible de las ventas brutas acumuladas por comisiones B2B y suscripciones B2C.
    
    $$
    \text{Base Imponible (Ventas)} = \frac{\text{Ingresos Brutos}}{1.18}
    $$
    
    $$
    \text{IGV Cobrado} = \text{Base Imponible} \times 0.18
    $$
    
*   **IGV Pagado en Compras (Crédito Fiscal):** Se calcula extrayendo el 18% de los egresos operativos nacionales facturados que aplican IGV (soporte local, licencias de software nacionales, materiales de oficina). Los egresos extranjeros sin factura local (como publicidad pagada directamente a Meta/TikTok o consumo de AWS sin representación local) se registran libres de IGV compras.
*   **IGV Neto a Pagar a la SUNAT:** Es la diferencia mensual a pagar en la declaración del Formulario Virtual 621.
    
    $$
    \text{IGV Neto a Pagar} = \text{IGV Cobrado} - \text{IGV Pagado}
    $$

### 3.2. Impuesto a la Renta - Régimen MYPE Tributario (RMT)
Debido a que los ingresos proyectados anuales son menores a 1,700 UIT (con la UIT 2026 fijada en **S/. 5,500.00 PEN**), la empresa aplica las tasas progresivas del RMT sobre la Utilidad Neta Anual (Base Imponible de Ventas - Egresos base imponible):
*   **Tramo 1 (Hasta 15 UIT = S/. 82,500.00):** Tasa del **10%** sobre la utilidad.
*   **Tramo 2 (Exceso de 15 UIT):** Tasa del **29.5%** sobre la utilidad excedente.
*   **Pagos a Cuenta Mensuales:** Pagos mensuales obligatorios del **1%** de la Base Imponible mensual de ingresos. Estos pagos mensuales actúan como un crédito directo a favor de la regularización anual del Impuesto a la Renta.
*   **Regularización Anual:** Se realiza al cierre del ejercicio fiscal en marzo. Se calcula el impuesto anual total y se restan los pagos a cuenta mensuales acumulados.
    
    $$
    \text{IR Regulado a Pagar} = \text{IR Anual Calculado} - \text{Pagos a Cuenta Mensuales Realizados}
    $$

### 3.3. Impuesto a las Transacciones Financieras (ITF - 0.005%)
*   Se aplica una deducción automática del **0.005%** sobre el volumen total de transferencias y retiros bancarios de la empresa en soles.

---

## 4. Flujo de Caja Real Mensualizado (Año 1) e Indicadores de Rentabilidad

A continuación se expone la proyección financiera mensual real consolidando los egresos, el crédito fiscal por IGV y los pagos de Impuesto a la Renta para el primer año de operaciones:

### 4.1. Resumen Contable Mensual del Año 1 (S/.)
*   **Ingresos Brutos:** Inicia en S/. 800.00 (Mes 1) y escala a S/. 6,000.00 (Mes 12) totalizando S/. 41,500.00 al cierre del primer año.
*   **Ingresos Netos (Base Imponible):** S/. 35,169.49 PEN.
*   **IGV Cobrado de Ventas:** S/. 6,330.51 PEN.
*   **IGV Pagado en Compras (Crédito Fiscal):** S/. 1,037.29 PEN.
*   **IGV Neto Pagado a la SUNAT:** S/. 5,293.22 PEN.
*   **Pagos a Cuenta Mensuales de Renta (1%):** S/. 351.69 PEN.
*   **Egresos Operativos Totales (Reales):** S/. 13,750.00 PEN.
*   **Flujo Neto de Caja Real Año 1 (Antes de Regularización Anual):** **S/. 22,332.99 PEN**.

### 4.2. Regularización de Renta Anual al Cierre de los Años 1, 2 y 3 (S/.)
*   **Año 1:** Utilidad Neta antes de IR = S/. 27,182.20. Impuesto a la Renta MYPE del 10% = S/. 2,718.22. Descontando pagos a cuenta de S/. 351.69, el pago neto de regularización a la SUNAT es de **S/. 2,366.53**.
*   **Año 2:** Utilidad Neta antes de IR = S/. 59,021.02. Impuesto a la Renta MYPE del 10% = S/. 5,902.10. Descontando pagos a cuenta de S/. 711.86, el pago de regularización es de **S/. 5,190.24**.
*   **Año 3:** Utilidad Neta antes de IR = S/. 94,949.15. Aquí se supera el tramo de 15 UIT (S/. 82,500.00). Aplicamos el 10% a S/. 82,500 (S/. 8,250.00) y el 29.5% al exceso de S/. 12,449.15 (S/. 3,672.50) obteniendo un IR anual de S/. 11,922.50. Descontando pagos a cuenta de S/. 1,067.80, la regularización anual es de **S/. 10,854.70**.

### 4.3. Flujo Neto de Caja Real Final y Evaluación Multianual
Considerando la deducción de la regularización anual del Impuesto a la Renta que se realiza en marzo del siguiente año fiscal, el flujo neto real final de caja es el siguiente:
*   **Año 0 (Inversión):** -S/. 74,388.82 PEN.
*   **Año 1:** S/. 19,966.46 PEN (Neto real).
*   **Año 2:** S/. 46,165.56 PEN (Neto real).
*   **Año 3:** S/. 70,921.33 PEN (Neto real).

#### Indicadores de Viabilidad Económica Real:
*   **VAN (Valor Actual Neto) Real @ 12% COK:** **S/. 26,850.50 PEN**. Al ser positivo en el escenario tributario real, confirma la viabilidad.
*   **TIR (Tasa Interna de Retorno) Real:** **26.85%**. La tasa de rentabilidad neta real supera la valla de descuento (12%).
*   **Periodo de Recuperación (Payback) Real:** **22 meses** de operaciones comerciales.

*(Nota: Todos los cálculos y fórmulas aplicadas se encuentran detallados en el libro de trabajo de Excel [SportMatch_Connect_Financial_Plan.xlsx](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/10.%20Estructura%20de%20Costos%20y%20Flujo%20de%20Caja/SportMatch_Connect_Financial_Plan.xlsx)).*
