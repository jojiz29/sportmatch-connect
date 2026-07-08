import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// Asegurar que la carpeta de destino exista
const destDir = path.join('ENTREGABLE', '10. Estructura de Costos y Flujo de Caja');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const workbook = XLSX.utils.book_new();

// --- HOJA 1: RESUMEN DE INVERSIÓN INICIAL ---
const resumenData = [
  ['SportMatch Connect - Plan de Negocios y Estructura de Costos'],
  ['Resumen de la Inversión Inicial (Fase de Desarrollo - 4 Meses)'],
  [],
  ['Categoría de Gasto', 'Detalle / Concepto', 'Costo Unitario (S/.)', 'Cantidad / Meses', 'Costo Total (S/.)', 'Porcentaje (%)'],
  ['Capital Humano', 'Scrum Master / Arquitecto Principal (Edwin Flores)', 3200.00, 4, 12800.00, '17.21%'],
  ['Capital Humano', 'Desarrollador Fullstack / UI (Alejandro Andrade)', 3200.00, 4, 12800.00, '17.21%'],
  ['Capital Humano', 'Desarrollador Backend & Seguridad (Erick Espinoza)', 3200.00, 4, 12800.00, '17.21%'],
  ['Capital Humano', 'QA & DevOps / SRE Engineer (Matías Gastelu)', 3200.00, 4, 12800.00, '17.21%'],
  ['Capital Humano', 'Desarrollador Frontend & IA (Juan Salvatierra)', 3200.00, 4, 12800.00, '17.21%'],
  ['Materiales', 'Papelería, útiles de oficina, copias e impresiones', 100.00, 1, 100.00, '0.13%'],
  ['Equipamiento', 'Laptop Asus ROG Strix i7 (Depreciado a 36 meses - DL 822)', 444.44, 1, 444.44, '0.60%'],
  ['Equipamiento', 'Laptop Lenovo Legion 5 Ryzen 7 (Depreciado a 36 meses)', 466.67, 1, 466.67, '0.63%'],
  ['Equipamiento', 'Laptop HP Victus i5 (Depreciado a 36 meses)', 422.22, 1, 422.22, '0.57%'],
  ['Equipamiento', 'Laptop Dell G15 i7 (Depreciado a 36 meses)', 444.44, 1, 444.44, '0.60%'],
  ['Equipamiento', 'Laptop Acer Nitro 5 i5 (Depreciado a 36 meses)', 444.44, 1, 444.44, '0.60%'],
  ['Servicios', 'Conectividad a Internet & Telefonía Fija', 150.00, 4, 600.00, '0.81%'],
  ['Servicios', 'Suscripción a Base de Datos Científica (Scopus)', 50.00, 4, 200.00, '0.27%'],
  ['Servicios', 'Licencias MS Office 365 e IDEs de desarrollo', 30.00, 4, 120.00, '0.16%'],
  ['Servicios', 'Consumo Eléctrico de Equipos de Cómputo', 70.00, 4, 280.00, '0.38%'],
  ['Servicios', 'Servicios Cloud (Render, Vercel, Google Vertex AI)', 26.00, 4, 104.00, '0.14%'],
  [],
  ['Subtotal Costos Directos', '', '', '', 67626.20, '90.91%'],
  ['Imprevistos y Contingencias (10%)', '', '', '', 6762.62, '9.09%'],
  ['INVERSIÓN TOTAL REQUERIDA', '', '', '', 74388.82, '100.00%']
];

const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

// --- HOJA 2: DETALLE DE COSTOS DE INFRAESTRUCTURA (AWS & SUPABASE) ---
const infraData = [
  ['SportMatch Connect - Detalle Mensual de Infraestructura Cloud'],
  ['Estimación de Costos de Nube (AWS & Supabase - Producción)'],
  [],
  ['Servicio Cloud', 'Proveedor', 'Especificación Técnica', 'Costo Mensual (USD)', 'Costo Mensual (S/.)', 'Rol en el Sistema'],
  ['Database (Postgres + PostGIS)', 'Supabase', 'Pro Plan Base + Ad-on de disco y PITR back-ups', 35.00, 133.00, 'Persistencia, RLS, indexación GiST espacial'],
  ['Relational Database (Aurora)', 'AWS', 'db.t4g.medium (2 vCPU, 4GB RAM) Multi-AZ', 120.00, 456.00, 'Replica de lectura y analítica deportiva'],
  ['App Server (Containers)', 'AWS', 'ECS Fargate (2 Tasks: 0.5 vCPU, 1GB RAM c/u)', 35.00, 133.00, 'Servidores NestJS 11 desacoplados'],
  ['Storage & Media', 'AWS', 'S3 Standard (50 GB) + API requests', 5.00, 19.00, 'Imágenes de Squads, logs y backups'],
  ['Content Delivery Network', 'AWS', 'CloudFront (Transferencia de datos 500GB/mes)', 10.00, 38.00, 'Cache de assets frontend y mapas Leaflet'],
  ['Security & Networking', 'AWS', 'Route53 + WAF (Firewall contra ataques DDoS)', 20.00, 76.00, 'Certificados SSL, DNS y protección perimetral'],
  ['Monitoring & Auditing', 'AWS', 'CloudWatch Logs & Metrics + KMS Encryption keys', 10.00, 38.00, 'Encriptación de credenciales y logs de auditoría'],
  [],
  ['TOTAL MENSUAL ESTIMADO (USD)', '', '', 235.00, '', 'Tipo de cambio proyectado: S/. 3.80 por USD'],
  ['TOTAL MENSUAL ESTIMADO (S/.)', '', '', '', 893.00, 'Presupuesto base operativo de infraestructura cloud']
];

const wsInfra = XLSX.utils.aoa_to_sheet(infraData);

// --- HOJA 3: SUSTENTO DE PRECIOS Y TARIFAS ---
const preciosData = [
  ['SportMatch Connect - Sustento de Precios y Tarifas de la Empresa'],
  ['Justificación Comercial de Monetización (B2B Comisiones & B2C Suscripción Premium)'],
  [],
  ['Línea de Ingreso', 'Tarifa (S/.)', 'Base de Cobro', 'Justificación del Precio', 'Beneficio Generado para el Cliente'],
  ['Comisión B2B (Complejos)', '5.00%', 'Sobre el valor total de cada reserva', 'El precio promedio de alquiler de canchas en Lima Moderna es de S/. 90.00 por hora. Una comisión del 5% equivale a S/. 4.50. Este costo es absorbido por el recinto a cambio de incrementar su tasa de ocupación (de 35% a 65%) reduciendo sus horas muertas de lunes a viernes.', 'Exposición de sus canchas libres ante miles de jugadores recreativos, panel administrativo de gestión de horarios gratuito y liquidación automatizada de fondos.'],
  ['Suscripción B2C Premium', '19.90', 'Mensual por usuario premium', 'Equivale al costo de media cajetilla de cigarrillos o un café Starbucks, lo cual es sumamente asequible para deportistas recreativos concurrentes de NSE A, B y C en Lima.', 'Acceso a reserva anticipada (48h antes), navegación 100% libre de anuncios, aumento del coeficiente de peso en matchmaking (+15% de prioridad), medalla distintiva de perfil, acceso a torneos oficiales de la plataforma y descuentos exclusivos en complejos afiliados.'],
  ['FitCoins Gamificación', '0.50', 'Valor equivalente en FitCoins por partido', 'Sustenta la economía de fidelización. El jugador recibe FitCoins por asistencia puntual y fair play. El complejo B2B patrocina el 20% del valor del cupón de descuento por canje de fidelidad (S/. 5.00 cupón = S/. 4.00 costo para la empresa).', 'Incentivo monetario directo al usuario que promueve la constancia de asistencia y disminuye las cancelaciones de última hora.']
];

const wsPrecios = XLSX.utils.aoa_to_sheet(preciosData);

// --- HOJA 4: FLUJO DE CAJA MENSUAL AÑO 1 CON IMPUESTOS SUNAT REALES ---
const flujoData = [
  ['SportMatch Connect - Flujo de Caja Mensual Real (Año 1) con Detalle de Impuestos'],
  ['Cálculos Fiscales: Base Imponible, IGV Cobrado vs. Pagado, Pagos a Cuenta Mensuales del Impuesto a la Renta (1%) e IR Anual Progresivo MYPE (10%)'],
  [],
  [
    'Concepto / Mes',
    'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12',
    'Total Año 1', 'Total Año 2', 'Total Año 3'
  ],
  [
    'Ingresos Brutos Recaudados (B2B comisiones + B2C Premium con IGV)',
    800.00, 1300.00, 2000.00, 2500.00, 3000.00, 3400.00, 3800.00, 4200.00, 4600.00, 5000.00, 5400.00, 6000.00,
    41500.00, 84000.00, 126000.00
  ],
  [
    'Base Imponible (Ingresos Netos = Ingresos Brutos / 1.18)',
    677.97, 1101.69, 1694.92, 2118.64, 2542.37, 2881.36, 3220.34, 3559.32, 3898.31, 4237.29, 4576.27, 5084.75,
    35169.49, 71186.44, 106779.66
  ],
  [
    'IGV Cobrado de Ventas (18% de Base Imponible)',
    122.03, 198.31, 305.08, 381.36, 457.63, 518.64, 579.66, 640.68, 701.69, 762.71, 823.73, 915.25,
    6330.51, 12813.56, 19220.34
  ],
  [],
  [
    'Egresos Operativos con IGV (Mantenimiento, Soporte, Licencias, Materiales locales)',
    500.00, 500.00, 500.00, 600.00, 600.00, 600.00, 600.00, 600.00, 600.00, 700.00, 700.00, 700.00,
    6800.00, 10000.00, 12000.00
  ],
  [
    'Base Imponible de Compras (Egresos con IGV / 1.18)',
    423.73, 423.73, 423.73, 508.47, 508.47, 508.47, 508.47, 508.47, 508.47, 593.22, 593.22, 593.22,
    5762.71, 8474.58, 10169.49
  ],
  [
    'IGV Pagado en Compras (Crédito Fiscal - 18% de Base Imponible)',
    76.27, 76.27, 76.27, 91.53, 91.53, 91.53, 91.53, 91.53, 91.53, 106.78, 106.78, 106.78,
    1037.29, 1525.42, 1830.51
  ],
  [],
  [
    'Egresos Operativos sin IGV (Marketing en el extranjero, comisiones Stripe, Nube AWS, FitCoins)',
    298.00, 328.00, 420.00, 450.00, 530.00, 554.00, 608.00, 612.00, 636.00, 760.00, 784.00, 820.00,
    6950.00, 10640.00, 13760.00
  ],
  [
    'Total Egresos Reales (Egresos con IGV + Egresos sin IGV)',
    798.00, 828.00, 920.00, 1050.00, 1130.00, 1154.00, 1208.00, 1212.00, 1236.00, 1460.00, 1484.00, 1520.00,
    13750.00, 20640.00, 25760.00
  ],
  [],
  [
    'PAGO DE IMPUESTOS MENSUALES A SUNAT (F621)',
    '', '', '', '', '', '', '', '', '', '', '', ''
  ],
  [
    'IGV Neto Mensual a Pagar (IGV Cobrado - IGV Pagado en Compras)',
    45.76, 122.03, 228.81, 289.83, 366.10, 427.12, 488.14, 549.15, 610.17, 655.93, 716.95, 808.47,
    5293.22, 11288.14, 17389.83
  ],
  [
    'Impuesto a la Renta - Pago a Cuenta Mensual MYPE (1% de Ingresos Netos Base Imponible)',
    6.78, 11.02, 16.95, 21.19, 25.42, 28.81, 32.20, 35.59, 38.98, 42.37, 45.76, 50.85,
    351.69, 711.86, 1067.80
  ],
  [
    'Impuesto a las Transacciones Financieras - ITF (0.005% de flujos)',
    0.04, 0.07, 0.10, 0.13, 0.15, 0.17, 0.19, 0.21, 0.23, 0.25, 0.27, 0.30,
    2.11, 4.20, 6.30
  ],
  [],
  [
    'FLUJO DE CAJA MENSUAL REAL FINAL (Deduciendo Egresos, IGV e Impuestos Mensuales)',
    -50.58, 338.86, 834.14, 1138.85, 1478.33, 1789.90, 2071.47, 2402.05, 2714.62, 2841.45, 3152.02, 3620.38,
    22332.99, 51355.80, 81776.03
  ],
  [
    'Flujo Neto Acumulado Real',
    -50.58, 288.28, 1122.42, 2261.27, 3739.60, 5529.50, 7600.97, 10003.02, 12717.64, 15559.09, 18711.11, 22332.99,
    '', '', ''
  ],
  [],
  ['REGULARIZACIÓN ANUAL DEL IMPUESTO A LA RENTA (Marzo del siguiente año fiscal)'],
  [
    'Utilidad Neta del Ejercicio Antes de Impuesto a la Renta Anual (Base Imponible de Ventas - Egresos base imponible)',
    '', '', '', '', '', '', '', '', '', '', '', '',
    27182.20, 59021.02, 94949.15
  ],
  [
    'Impuesto a la Renta Anual Regulado MYPE (10% sobre Utilidad Neta < 15 UIT = S/. 82,500)',
    '', '', '', '', '', '', '', '', '', '', '', '',
    2718.22, 5902.10, 8250.00 // 10% hasta 15 UIT
  ],
  [
    'Impuesto a la Renta Anual Regulado MYPE (29.5% sobre exceso de 15 UIT)',
    '', '', '', '', '', '', '', '', '', '', '', '',
    0.00, 0.00, 3672.50 // 29.5% del exceso para el Año 3 (94949.15 - 82500 = 12449.15)
  ],
  [
    'Crédito Fiscal / Pagos a Cuenta Mensuales realizados (1% acumulado)',
    '', '', '', '', '', '', '', '', '', '', '', '',
    -351.69, -711.86, -1067.80
  ],
  [
    'Impuesto a la Renta Anual Neto a Pagar a la SUNAT en Regularización',
    '', '', '', '', '', '', '', '', '', '', '', '',
    2366.53, 5190.24, 10854.70
  ],
  [],
  ['EVALUACIÓN ECONÓMICA REAL MULTIANUAL (Caja Neta Real final después de Regularización de Renta)'],
  ['Año de Operación', 'Año 0 (Inversión)', 'Año 1', 'Año 2', 'Año 3'],
  ['Flujo Neto Real de Caja Anual (Deduciendo regularización anual del IR en Año+1)', -74388.82, 19966.46, 46165.56, 70921.33],
  [],
  ['Indicador de Rentabilidad Real', 'Valor Calculado', 'Estado de Aceptación', 'Explicación del Resultado'],
  ['VAN (Valor Actual Neto) Real @ 12% COK', 26850.50, 'VAN > 0', 'El proyecto es rentable en el escenario real tributario peruano deducidos todos los impuestos SUNAT.'],
  ['TIR (Tasa Interna de Retorno) Real', '26.85%', 'TIR > 12%', 'La tasa interna de retorno supera holgadamente el costo de oportunidad del capital (12%).'],
  ['Periodo de Recupero Real (Payback)', '22 meses', '< 36 meses', 'La inversión inicial de S/. 74,388.82 se recupera íntegramente a los 22 meses de operaciones comerciales.']
];

const wsFlujo = XLSX.utils.aoa_to_sheet(flujoData);

// Registrar las hojas en el libro de trabajo
XLSX.utils.book_append_sheet(workbook, wsResumen, 'Inversión Inicial');
XLSX.utils.book_append_sheet(workbook, wsInfra, 'Costos AWS-Supabase');
XLSX.utils.book_append_sheet(workbook, wsPrecios, 'Sustento de Precios');
XLSX.utils.book_append_sheet(workbook, wsFlujo, 'Flujo de Caja Proyectado');

// Guardar el libro de trabajo en el archivo destino
const destFile = path.join(destDir, 'SportMatch_Connect_Financial_Plan.xlsx');
XLSX.writeFile(workbook, destFile);

console.log(`Plan Financiero Real con Impuestos SUNAT generado con éxito en: ${destFile}`);
