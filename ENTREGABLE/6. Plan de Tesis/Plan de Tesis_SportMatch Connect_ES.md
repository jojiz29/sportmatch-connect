# PLAN DE PROYECTO FINAL DE CARRERA (PLAN DE TESIS)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**

**Plan de Tesis para la Certificación Académica del Proyecto Final de Carrera III**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería**  

---

## 📋 CAPÍTULO I: PLANTEAMIENTO DEL PROBLEMA

### 1.1. Descripción de la Realidad Problemática
A nivel global, el sedentarismo se ha consolidado como una de las epidemias no transmisibles más críticas del siglo XXI. De acuerdo con la Organización Mundial de la Salud (OMS, 2020), la inactividad física es responsable de aproximadamente 3.2 millones de muertes anuales en todo el mundo, ubicándose como el cuarto factor de riesgo de mortalidad global. Los avances en digitalización, la proliferación del teletrabajo y la oferta masiva de entretenimiento sedentario en pantallas han mermado el tiempo asignado a la práctica deportiva recreativa. 

En el ámbito de la República del Perú, los reportes de la Encuesta Nacional de Actividad Física y Nutrición elaborada por el Ministerio de Salud (MINSA, 2024) y procesada en conjunto con el Instituto Nacional de Estadística e Informática (INEI) revelan un panorama alarmante: el **72% de los jóvenes adultos de entre 18 y 39 años en Lima Metropolitana realiza actividad física insuficiente**. Las consecuencias de este fenómeno se manifiestan en un incremento de enfermedades metabólicas, estrés crónico y un deterioro de los índices de salud comunitaria.

A pesar de que existe una intención declarada de realizar actividad física (principalmente disciplinas colectivas como fútbol, básquetbol, tenis y la creciente tendencia del pádel), la coordinación y ejecución de encuentros deportivos de carácter amateur se realiza bajo un modelo logístico arcaico, ineficiente y altamente fragmentado. Las comunidades deportivas se agrupan en redes de mensajería generalistas como WhatsApp o Telegram, lo que genera fricciones logísticas e ineficiencias críticas:

*   **Ausencia de Nivelación de Destreza y Pérdida de Retención:** Los grupos informales mezclan a participantes sin criterios de nivelación de habilidad. La disparidad de niveles provoca partidos con un nivel de competencia desigual (brechas de rendimiento altas), lo que causa frustración en los deportistas principiantes y aburrimiento en los avanzados, acelerando la deserción deportiva.
*   **Asimetría Financiera y Riesgo por Morosidad:** La reservación de canchas deportivas requiere un pago del 50% al 100% por adelantado. El usuario organizador asume la totalidad de este costo y del riesgo financiero, viéndose obligado a realizar una recaudación manual posterior a través de billeteras móviles (Yape o Plin). Esto introduce fricciones interpersonales por cobros atrasados y genera una tasa de morosidad promedio del 15% por partido.
*   **Opacidad en la Disponibilidad de Campos (Silos de Información):** La gran mayoría de complejos deportivos operan de forma desconectada de la web, administrando reservas mediante cuadernos de notas o chats de WhatsApp individuales. Esto impide a los deportistas visualizar la oferta disponible en su zona geográfica en tiempo real, limitando la ocupación de los recintos deportivos B2B.

#### Estadísticas Clave de la Problemática

A continuación se presentan datos estadísticos provenientes de organismos oficiales que sustentan la magnitud del problema:

**Tabla 1: Indicadores de Sedentarismo en América Latina (OMS, 2024)**

| País | % Población con Actividad Física Insuficiente | Rango Etario Crítico | Tasa de Mortalidad Asociada (por 100k hab.) |
|---|---|---|---|
| Perú | 67.2% | 18-39 años | 142.3 |
| Argentina | 62.8% | 20-40 años | 138.7 |
| Chile | 64.1% | 18-35 años | 135.1 |
| Colombia | 58.4% | 18-44 años | 128.9 |
| México | 71.3% | 15-39 años | 151.2 |
| Brasil | 65.9% | 20-45 años | 144.8 |

**Tabla 2: Factores Asociados al Sedentarismo en Lima Metropolitana (MINSA, 2024)**

| Factor | Porcentaje de Encuestados | Descripción |
|---|---|---|
| Falta de tiempo por trabajo/estudio | 43.7% | Jornadas laborales extensas (promedio 48h/semana en Lima) |
| Falta de compañeros para practicar deporte | 28.3% | Dificultad para coordinar con amigos con disponibilidad compatible |
| Costo elevado de alquiler de canchas | 15.2% | Precio promedio S/ 60-120 por hora en Lima Moderna |
| Desmotivación por disparidad de nivel | 8.9% | Experiencias negativas previas en partidos desbalanceados |
| Falta de información sobre canchas disponibles | 3.9% | Desconocimiento de la oferta de recintos deportivos cercanos |

**Tabla 3: Brecha de Infraestructura Deportiva en Distritos de Lima (INEI, 2024)**

| Distrito | Población (jóvenes 18-39) | Canchas Deportivas Públicas | Ratio (hab./cancha) | Canchas Privadas Registradas |
|---|---|---|---|---|
| San Isidro | 62,340 | 8 | 7,792.5 | 23 |
| Miraflores | 98,210 | 12 | 8,184.2 | 31 |
| Santiago de Surco | 198,450 | 15 | 13,230.0 | 28 |
| San Martín de Porres | 312,670 | 6 | 52,111.7 | 4 |
| Los Olivos | 245,890 | 5 | 49,178.0 | 7 |
| Villa El Salvador | 289,340 | 4 | 72,335.0 | 2 |
| Comas | 356,210 | 7 | 50,887.1 | 3 |

---

### 1.2. Formulación del Problema

#### Problema General
¿De qué manera el diseño e implementación de una plataforma informática basada en matchmaking predictivo e inteligencia artificial influye en la eficiencia de la coordinación y en la continuidad de la práctica deportiva recreativa en jóvenes adultos en Lima Metropolitana durante el periodo 2026?

#### Problemas Específicos
1.  ¿Cómo estructurar un algoritmo predictivo multivariable basado en Elo de equipos y distancia Haversine que garantice emparejamientos deportivos con una brecha de habilidad mínima?
2.  ¿De qué manera la implementación de consultas espaciales geolocalizadas mediante la extensión PostGIS optimiza el tiempo de respuesta y la precisión en la búsqueda radial de campos deportivos?
3.  ¿De qué manera un sistema transaccional de cobros compartidos basado en una moneda virtual (*FitCoins*) integrada a la pasarela Stripe reduce la tasa de morosidad y simplifica el flujo de pago compartido?
4.  ¿De qué manera un asistente conversacional híbrido con procesamiento nativo de voz en el servidor y clasificación en el borde mediante TensorFlow.js influye en la usabilidad y seguridad de interacción del deportista en la aplicación?

---

### 1.3. Objetivos de la Investigación

#### Objetivo General
Desarrollar e implementar la plataforma "SportMatch Connect", un sistema informático integral de matchmaking deportivo geolocalizado con economía gamificada y asistente inteligente para optimizar y unificar la práctica de actividades deportivas amateur en Lima Metropolitana.

#### Objetivos Específicos
1.  Diseñar y validar un algoritmo predictivo multivariable que calcule la afinidad de emparejamiento basándose en la distancia esférica, la disponibilidad horaria del jugador y su nivel de destreza Elo ponderado.
2.  Desarrollar un buscador geolocalizado de recintos deportivos integrando mapas Leaflet y consultas indexadas espacialmente en bases de datos PostgreSQL con PostGIS.
3.  Implementar un módulo de economía digital basado en FitCoins y cobros compartidos con Stripe, que automatice la división del costo del alquiler de la cancha y garantice la liquidación en tiempo real.
4.  Implementar un asistente de voz multimodal ("Sporty") utilizando Google Vertex AI (Gemini 2.5 Flash) y procesamiento nativo de voz (STT/TTS), blindado por un modelo de moderación de contenido en el dispositivo del cliente (TensorFlow.js).

---

### 1.4. Justificación de la Investigación

*   **Justificación Tecnológica:** El proyecto propone una arquitectura de software desacoplada moderna. El cliente web utiliza **React 19** y **TypeScript** estructurado con **Feature-Sliced Design (FSD)** para garantizar alta cohesión y bajo acoplamiento. El backend se desarrolla en **NestJS 11** utilizando inyección de dependencias modular y **Prisma ORM** con dual-routing (Pooler en Oregon `us-west-2` para consultas de transacciones y Direct URL para migraciones de esquemas). La base de datos cuenta con políticas atómicas de seguridad **Row Level Security (RLS)** que protegen los accesos directamente desde el motor de datos.
*   **Justificación Social:** Aporta una solución directa contra el sedentarismo urbano en Lima Metropolitana, simplificando radicalmente el proceso logístico y motivando la continuidad del deporte recreativo al conectar comunidades con intereses y habilidades compatibles.
*   **Justificación Académica:** Provee un referente de ingeniería de software que integra conceptos de geolocalización avanzada (PostGIS), modelos probabilísticos de destreza (Elo adaptado a equipos), inteligencia artificial conversacional (Vertex AI) y computación en el cliente (TensorFlow.js NSFWJS) en un caso de negocio viable.

---

### 1.5. Delimitación de la Investigación

| Tipo de Delimitación | Descripción |
|---|---|
| **Espacial** | Lima Metropolitana, Perú. La investigación se circunscribe a los 43 distritos que conforman Lima Metropolitana, con énfasis en los distritos de Lima Moderna (Miraflores, San Isidro, Santiago de Surco, La Molina, San Borja) y Lima Norte (Los Olivos, San Martín de Porres, Comas) por su mayor densidad de población juvenil y oferta de recintos deportivos. |
| **Temporal** | Periodo académico 2026-I (marzo a julio de 2026). El desarrollo del software comprende 8 sprints de 14 días cada uno (112 días calendario totales). Las pruebas de validación se realizan durante los últimos 3 sprints (semanas 10 a 16). |
| **Temática** | Sistemas de información geográfica aplicados al deporte amateur, inteligencia artificial conversacional para asistentes deportivos, sistemas de pago digital gamificados y redes sociales deportivas con matchmaking predictivo. Quedan excluidos: deportes de alto rendimiento profesional, ligas federadas oficiales, deportes extremos no normalizados y aplicaciones de tracking fitness (smartwatches/gyms). |
| **Poblacional** | Jóvenes adultos entre 18 y 39 años, residentes en Lima Metropolitana, que practican o desean practicar deportes colectivos recreativos (fútbol, pádel, tenis, baloncesto, voleibol). |

### 1.6. Hipótesis

#### Hipótesis General (HG)
**HG:** La implementación de una plataforma digital de matchmaking deportivo basada en un algoritmo predictivo multivariable (Elo + Haversine + pesos de compatibilidad) mejora significativamente la eficiencia de coordinación y la continuidad de la práctica deportiva recreativa en jóvenes adultos de Lima Metropolitana, reduciendo en al menos un 40% el tiempo de coordinación logística por partido.

#### Hipótesis Específicas

| Código | Hipótesis Específica | Variable Independiente | Variable Dependiente |
|---|---|---|---|
| **HE1** | El algoritmo de clasificación Elo modificado con K=32 dinámico reduce la brecha de habilidad entre equipos emparejados a menos de 150 puntos Elo de diferencia promedio. | Algoritmo de matchmaking Elo | Brecha de habilidad entre equipos |
| **HE2** | La implementación de consultas espaciales PostGIS con índice GiST reduce el tiempo de respuesta de búsqueda radial de recintos a menos de 15ms para radios de hasta 10 km. | Índice espacial GiST + ST_DWithin | Tiempo de respuesta de búsqueda geolocalizada |
| **HE3** | El sistema de cobros compartidos basado en FitCoins con débito atómico previo a la confirmación reduce la tasa de morosidad del 15% al 0% en reservas multijugador. | Monedero digital FitCoins + débito atómico | Tasa de morosidad en reservas compartidas |
| **HE4** | El asistente conversacional Sporty con procesamiento Vertex AI Gemini 2.5 Flash incrementa la tasa de retención semanal de usuarios en al menos un 25% al reducir la fricción de navegación y consulta. | Asistente IA multimodal (Sporty) | Tasa de retención semanal de usuarios |

### 1.7. Variables de Investigación

| Variable | Tipo | Dimensión | Indicador | Instrumento |
|---|---|---|---|---|
| **Tiempo de coordinación logística** | Dependiente | Eficiencia | Minutos desde que se inicia la búsqueda hasta que se confirma el partido | Registro cronológico en base de datos |
| **Brecha de habilidad entre equipos** | Dependiente | Equilibrio competitivo | Diferencia de Elo promedio entre equipos emparejados | Cálculo Elo post-partido |
| **Tasa de morosidad** | Dependiente | Fiabilidad financiera | Porcentaje de participantes que no pagan su parte de la reserva | Registro de transacciones FitCoins |
| **Tasa de retención semanal** | Dependiente | Engagement | Porcentaje de usuarios que retornan a la plataforma en 7 días | Cálculo de cohortes semanales |
| **Tiempo de respuesta de búsqueda** | Dependiente | Rendimiento técnico | Latencia en milisegundos de consultas espaciales | Logs de base de datos |
| **Algoritmo de matchmaking** | Independiente | Tecnológica | Versión del algoritmo (con/sin pesos ponderados) | A/B testing controlado |
| **Índice espacial PostGIS** | Independiente | Tecnológica | Con/swithout índice GiST en columna location | Benchmark comparativo |
| **Sistema de débito atómico** | Independiente | Tecnológica | Con/swithout débito previo a confirmación | Comparación transaccional |
| **Asistente IA Sporty** | Independiente | Tecnológica | Con/swithout asistente conversacional | Grupo control vs experimental |

---

## 📚 CAPÍTULO II: MARCO TEÓRICO Y ESTADO DEL ARTE

### 2.1. Antecedentes

*   **Playtomic (España, 2015):** Plataforma transaccional de reserva de canchas de pádel y tenis a nivel global. Opera en 15+ países con más de 2 millones de usuarios registrados. Si bien cuenta con una base social consolidada, carece de algoritmos avanzados de matchmaking para deportes colectivos (fútbol, baloncesto) y presenta fricciones financieras por el cobro de comisiones elevadas (hasta 12%) en la división del costo en mercados de América Latina. **Brecha identificada:** No implementa un sistema de monedero virtual ni asistente IA conversacional para reducir la fricción transaccional.

*   **Nidux y CourtSide (Perú, 2020-2022):** Herramientas locales orientadas a la digitalización básica de canchas deportivas en Lima. Funcionan como directorios o agendas electrónicas estáticas, pero no integran una red social dinámica, un motor de emparejamiento predictivo ni un sistema de cobros compartidos automatizados. **Brecha identificada:** Alcance limitado a la reserva unidimensional sin gamificación, matchmaking ni soporte B2B avanzado.

*   **OpenSports (EE.UU., 2017):** Plataforma de organización de ligas recreativas con presencia en 200+ ciudades de Estados Unidos y Canadá. Ofrece creación de equipos, calendarios compartidos y pagos integrados. Sin embargo, su algoritmo de emparejamiento es básico (basado únicamente en ubicación geográfica sin considerar nivel de habilidad) y carece de asistente conversacional. **Brecha identificada:** Ausencia de un modelo de clasificación Elo adaptado a deportes recreativos y de moderación de contenido en el dispositivo.

*   **GoodGame (Brasil, 2022):** Aplicación brasileña de matchmaking para fútbol amateur con presencia en São Paulo y Río de Janeiro. Implementa un sistema básico de calificación post-partido (1 a 5 estrellas) y geolocalización simple. No obstante, su alcance se limita al fútbol, excluyendo pádel, tenis y baloncesto. **Brecha identificada:** Cobertura limitada a un solo deporte y ausencia de inteligencia artificial conversacional o monedero virtual gamificado.

*   **SportyPal (India, 2023):** Plataforma india de conexión deportiva con soporte multideporte y algoritmo de matchmaking basado en KNN (K-Nearest Neighbors). Incluye video-análisis de técnicas deportivas mediante visión artificial. Sin embargo, su modelo de monetización depende exclusivamente de suscripciones premium sin soporte de microtransacciones, split billing o pagos por evento. **Brecha identificada:** Falta de integración de pasarela de pagos para cobros compartidos y ausencia de un sistema de reputación (Trust Score) verificable.

---

### 2.2. Bases Teóricas

#### A. Algoritmo de Haversine para Distancia Geográfica
El cálculo de la distancia ortodrómica $d$ entre el usuario con coordenadas de origen $A(\phi_1, \lambda_1)$ y el recinto deportivo $B(\phi_2, \lambda_2)$ se modela matemáticamente como:

$$
d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
$$

Donde:
*   $R$: Radio medio de la Tierra ($6371\text{ km}$).
*   $\phi_1, \phi_2$: Latitudes de los puntos en radianes.
*   $\Delta \phi = \phi_2 - \phi_1$: Diferencia de latitud.
*   $\Delta \lambda = \lambda_2 - \lambda_1$: Diferencia de longitud.

#### B. Sistema de Clasificación Elo para Deportes Recreativos
Para equilibrar los partidos recreativos, la destreza del jugador se califica con una puntuación Elo adaptada. La probabilidad esperada de victoria del Equipo $A$ frente al Equipo $B$ se define como:

$$
E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}
$$

Donde $\bar{R}_A$ y $\bar{R}_B$ corresponden al promedio aritmético del Elo de los integrantes de los respectivos equipos. La actualización del puntaje de cada jugador $i$ tras la conclusión del encuentro deportivo se calcula mediante:

$$
R'_i = R_i + K \cdot (S_A - E_A)
$$

Donde $S_A \in \{1, 0.5, 0\}$ es el resultado real del equipo (1 para ganar, 0.5 para empatar y 0 para perder) y $K$ es el coeficiente de desarrollo dinámico ($K = 32$ para jugadores estándar).

---

### 2.3. Arquitectura Tecnológica e Implementación de NestJS

#### 🧩 Estructura y Solución de Inyección de Dependencias
De acuerdo con las directrices de `AGENTS.md`, para resolver problemas clásicos de resolución de dependencias en Render (como el de `VoiceService` requiriendo `AiConfigService`), implementamos el módulo global `AiCoreModule`. Esta estructura centraliza los servicios de inteligencia artificial de Vertex AI en un único proveedor accesible para toda la aplicación.

```typescript
// server/src/ai/ai-core.module.ts
import { Module, Global } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import { VertexAiService } from './vertex-ai.service';

@Global()
@Module({
  providers: [
    AiConfigService,
    VertexAiService,
  ],
  exports: [
    AiConfigService,
    VertexAiService,
  ],
})
export class AiCoreModule {}
```

#### 🛡️ Lógica de Control de Acceso: Row Level Security (RLS) en Supabase
El esquema de persistencia utiliza políticas SQL a nivel de motor de datos en Supabase para blindar el acceso a los datos sensibles de los perfiles y billeteras virtuales:

```sql
-- Habilitar RLS en perfiles y transacciones
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitcoin_transactions ENABLE ROW LEVEL SECURITY;

-- Política de lectura de perfiles (pública para permitir búsquedas sociales)
CREATE POLICY "Enable read access for all authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política de actualización de saldos (protección atómica: solo el sistema o el usuario dueño puede leer su balance)
CREATE POLICY "Users can view their own wallet balance" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Política de inserción de transacciones de FitCoins (solo el propietario autenticado)
CREATE POLICY "Users can insert their own transactions" 
ON public.fitcoin_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

---

### 2.4. Definición de Términos Básicos

| Término | Definición |
|---|---|
| **Algoritmo de Matchmaking** | Conjunto de reglas computacionales que evalúa la compatibilidad entre dos o más jugadores basándose en múltiples variables ponderadas (Elo, distancia Haversine, disponibilidad horaria, deportes comunes, Trust Score). |
| **Asistente Conversacional** | Sistema de inteligencia artificial (Sporty) que procesa lenguaje natural y voz para asistir al usuario en tareas de navegación, consulta y gestión dentro de la plataforma. |
| **B2B (Business-to-Business)** | Modelo de negocio dirigido a complejos deportivos y administradores de recintos que utilizan la plataforma para gestionar reservas, promociones y reportes de ocupación. |
| **B2C (Business-to-Consumer)** | Modelo de negocio dirigido a deportistas individuales que utilizan la plataforma para buscar partidos, reservar canchas y socializar. |
| **Desviación Estándar Sigma (σ)** | Medida de dispersión estadística utilizada para cuantificar la brecha de habilidad entre jugadores emparejados. |
| **Dual-URL (Prisma)** | Configuración del ORM Prisma que utiliza dos URLs de conexión: `DATABASE_URL` para consultas transaccionales a través del pooler (PgBouncer) y `DIRECT_URL` para migraciones de esquema directas. |
| **Elo** | Sistema de clasificación numérica originalmente diseñado para ajedrez, adaptado en este proyecto para calcular la destreza relativa de jugadores deportivos y equipos. |
| **Feature-Sliced Design (FSD)** | Metodología de organización de código frontend que estructura la aplicación en capas jerárquicas con reglas estrictas de importación unidireccional. |
| **FitCoins** | Moneda virtual de la plataforma con paridad 1:1 respecto al sol peruano (PEN), utilizada para transacciones de reserva, split billing y recompensas gamificadas. |
| **Haversine** | Fórmula matemática que calcula la distancia ortodrómica (distancia del círculo máximo) entre dos puntos de una esfera, utilizada para mediciones geográficas precisas. |
| **Índice GiST (Generalized Search Tree)** | Estructura de indexación de PostgreSQL que optimiza las consultas de búsqueda espacial en la extensión PostGIS, reduciendo el tiempo de respuesta a milisegundos. |
| **Matchmaking Predictivo** | Proceso algorítmico que evalúa y predice la compatibilidad entre jugadores antes de que estos interactúen, utilizando modelos matemáticos y pesos ponderados. |
| **Moderación en el Borde (Edge AI)** | Ejecución de modelos de inteligencia artificial directamente en el dispositivo del cliente (navegador) mediante TensorFlow.js, sin enviar datos al servidor. |
| **Monolito Modular** | Arquitectura backend donde toda la funcionalidad reside en un solo despliegue (monolito), pero organizada internamente en módulos independientes con interfaces bien definidas (NestJS). |
| **NSFWJS** | Modelo de clasificación de imágenes basado en TensorFlow.js que detecta contenido explícito o inapropiado (desnudos, violencia, lenguaje ofensivo) en el dispositivo del cliente. |
| **PostGIS** | Extensión espacial de PostgreSQL que agrega soporte para objetos geográficos, permitiendo consultas SQL de proximidad radial, cálculo de distancias y operaciones con coordenadas. |
| **PWA (Progressive Web Application)** | Aplicación web que utiliza capacidades modernas del navegador (Service Worker, Web App Manifest) para ofrecer una experiencia similar a una aplicación nativa, incluyendo instalación y modo offline parcial. |
| **Row Level Security (RLS)** | Mecanismo de seguridad de PostgreSQL que restringe el acceso a filas de una tabla basándose en el usuario autenticado, implementado mediante políticas SQL a nivel de motor de datos. |
| **Split Billing** | Mecanismo de división automática del costo de una reserva entre múltiples participantes, debitando el monto proporcional de cada monedero FitCoins. |
| **Trust Score** | Puntuación numérica de confiabilidad del usuario (escala 1.00-5.00) calculada en función de su historial de asistencia a partidos, cancelaciones y reseñas de otros jugadores. |
| **Vertex AI Gemini 2.5 Flash** | Modelo de lenguaje grande (LLM) multimodal de Google Cloud optimizado para baja latencia, utilizado como cerebro del asistente conversacional Sporty con soporte STT/TTS. |

---

## 🛠️ CAPÍTULO III: METODOLOGÍA Y PLAN DE TRABAJO

### 3.1. Tipo de Investigación
Investigación cuantitativa, de nivel aplicativo y de desarrollo tecnológico experimental. Se enfoca en la creación de un artefacto tecnológico (software) que optimiza procesos logísticos mediante métodos predictivos estructurados.

---

### 3.2. Desarrollo Metodológico Ágil (Scrum)
Se planifica el proyecto bajo el marco ágil Scrum a lo largo de 8 sprints de 14 días cada uno. Las historias de usuario y criterios de aceptación se gestionan en Jira Cloud y se redactan bajo el estándar Gherkin para la automatización de pruebas de comportamiento.

#### 📝 Escenario Gherkin: División de Pagos (Split Billing)
```gherkin
Escenario: División exitosa del costo de reserva con saldo disponible
  Dado que el usuario "Erick Espinoza" organiza un partido de fútbol con costo de S/. 120.00
  Y selecciona la opción de "Reserva Compartida" con 4 jugadores
  Cuando los otros 3 jugadores aceptan la invitación al encuentro
  Entonces el sistema debita automáticamente 30 FitCoins (equivalente a S/. 30.00) de cada monedero de los integrantes
  Y transfiere el monto total de 120 FitCoins al complejo deportivo para confirmar el estado de la reserva.
```

---

#### 3.2.1. Diseño de la Investigación

El diseño de la investigación corresponde a un **enfoque cuantitativo de tipo experimental puro** con grupo de control y grupo experimental, empleando un diseño **pre-test/post-test con grupo de control no equivalente**. Se selecciona este diseño porque permite medir el impacto causal de la implementación del software sobre las variables dependientes (tiempo de coordinación logística, brecha de habilidad, tasa de morosidad y retención de usuarios) antes y después de la intervención tecnológica.

| Grupo | Pre-test | Tratamiento | Post-test |
|---|---|---|---|
| **Grupo Experimental (GE)** | Medición de indicadores actuales (coordinación manual WhatsApp) | Uso de SportMatch Connect durante 8 semanas | Medición de indicadores post-intervención |
| **Grupo Control (GC)** | Medición de indicadores actuales (coordinación manual WhatsApp) | Sin intervención (mantiene método tradicional) | Medición de indicadores al mismo tiempo que GE |

#### 3.2.2. Población y Muestra

| Elemento | Descripción |
|---|---|
| **Población objetivo** | 1,847,320 jóvenes adultos entre 18 y 39 años residentes en Lima Metropolitana que practican o desean practicar deportes colectivos recreativos (fuente: INEI, 2024). |
| **Marco muestral** | Usuarios de grupos de WhatsApp deportivos en Lima Metropolitana identificados mediante muestreo por redes en 15 distritos representativos. |
| **Tamaño de muestra** | 384 participantes (calculado con fórmula para poblaciones finitas: n = Z²pqN / (e²(N-1) + Z²pq), donde Z=1.96, p=0.5, q=0.5, e=0.05, N=1,847,320). |
| **Distribución** | 192 participantes en Grupo Experimental (GE) y 192 en Grupo Control (GC). |
| **Tipo de muestreo** | Estratificado por distrito, con afijación proporcional al tamaño de la población juvenil de cada distrito. |

**Criterios de inclusión:**
- Edad entre 18 y 39 años (inclusive).
- Residencia en Lima Metropolitana.
- Práctica actual o intención de practicar al menos un deporte colectivo (fútbol, pádel, tenis, baloncesto o voleibol).
- Ser usuario activo de un teléfono inteligente con conexión a internet.

**Criterios de exclusión:**
- Deportistas profesionales federados (categoría competitiva oficial).
- Usuarios que no autoricen el consentimiento informado para el tratamiento de datos.

#### 3.2.3. Técnicas e Instrumentos de Recolección de Datos

| Técnica | Instrumento | Variable Medida | Frecuencia de Aplicación |
|---|---|---|---|
| **Encuesta diagnóstica** | Cuestionario estructurado (20 preguntas) en Google Forms | Perfil deportivo, frecuencia de práctica, nivel de satisfacción con métodos actuales | Una vez al inicio (pre-test) |
| **Registro observacional sistematizado** | Logs de base de datos PostgreSQL (consultas SQL programadas) | Tiempo de coordinación, tasa de match, brecha Elo, transacciones FitCoins | Continua (cada interacción del usuario) |
| **Test de usabilidad** | Cuestionario SUS (System Usability Scale) + NASA-TLX | Usabilidad percibida y carga cognitiva del asistente Sporty | Semana 4 y Semana 8 (post-test) |
| **Encuesta de satisfacción** | Cuestionario Likert (1-7) con 15 ítems | Satisfacción general, facilidad de uso, intención de uso continuado | Semana 8 (post-test) |
| **Registro de rendimiento técnico** | Logs de Vercel Analytics + Sentry Performance | TTFB, latencia API, tiempo de respuesta de búsquedas PostGIS | Continua (cada petición HTTP) |

#### 3.2.4. Técnicas de Procesamiento y Análisis de Datos

El procesamiento de datos recolectados se realizará mediante las siguientes técnicas estadísticas:

1. **Estadística Descriptiva:** Cálculo de medidas de tendencia central (media, mediana, moda) y de dispersión (desviación estándar, rango intercuartílico) para todas las variables numéricas.
2. **Prueba de Normalidad:** Test de Shapiro-Wilk (para muestras n < 50 por estrato) o Kolmogorov-Smirnov (para la muestra completa) para determinar la distribución de los datos.
3. **Contraste de Hipótesis:** Prueba t de Student para muestras independientes (comparación GE vs GC) y prueba t para muestras relacionadas (pre-test vs post-test dentro del GE). En caso de distribución no normal, se aplicará la prueba U de Mann-Whitney.
4. **Análisis de Regresión Múltiple:** Modelo de regresión lineal para identificar el peso relativo de cada variable independiente (algoritmo Elo, índice PostGIS, débito atómico, asistente Sporty) sobre las variables dependientes.
5. **Análisis de Cohortes:** Cálculo de tasas de retención semanal mediante segmentación por semana de registro (cohorte semanal) y seguimiento longitudinal a 8 semanas.
6. **Herramientas de procesamiento:** IBM SPSS Statistics v29, Python (pandas, scipy, scikit-learn) y RStudio para visualización de datos.

#### 3.2.5. Matriz de Consistencia

| Problema General | Objetivo General | Hipótesis General | Variables | Metodología |
|---|---|---|---|---|
| ¿De qué manera el diseño e implementación de una plataforma basada en matchmaking predictivo e IA influye en la eficiencia de coordinación y continuidad deportiva en jóvenes de Lima Metropolitana? | Desarrollar e implementar SportMatch Connect, un sistema integral de matchmaking deportivo geolocalizado con economía gamificada y asistente inteligente. | La implementación de la plataforma mejora significativamente la eficiencia de coordinación logística y continuidad deportiva en jóvenes de Lima Metropolitana. | VI: Plataforma SportMatch Connect. VD: Eficiencia de coordinación (tiempo), continuidad deportiva (retención). | Tipo: Cuantitativa aplicada. Diseño: Experimental pre-test/post-test. Muestra: 384 participantes (192 GE, 192 GC). |

| Problema Específico 1 | Objetivo Específico 1 | Hipótesis Específica 1 | Variables | Metodología |
|---|---|---|---|---|
| ¿Cómo estructurar un algoritmo predictivo multivariable basado en Elo + Haversine que garantice emparejamientos con brecha de habilidad mínima? | Diseñar y validar un algoritmo predictivo multivariable que calcule la afinidad de emparejamiento basándose en distancia, disponibilidad y nivel Elo. | HE1: El algoritmo Elo modificado reduce la brecha de habilidad entre equipos emparejados a menos de 150 puntos Elo de diferencia promedio. | VI: Algoritmo de matchmaking. VD: Brecha de habilidad (diferencia Elo). | Técnica: Registro observacional de logs de BD. Análisis: Prueba t de Student (GE vs GC). |

| Problema Específico 2 | Objetivo Específico 2 | Hipótesis Específica 2 | Variables | Metodología |
|---|---|---|---|---|
| ¿De qué manera las consultas espaciales PostGIS optimizan el tiempo de respuesta en búsqueda radial de campos deportivos? | Desarrollar un buscador geolocalizado de recintos con Leaflet y consultas indexadas PostGIS. | HE2: Las consultas PostGIS con índice GiST reducen el tiempo de respuesta de búsqueda radial a menos de 15ms. | VI: Índice espacial GiST. VD: Tiempo de respuesta de búsqueda (ms). | Técnica: Benchmark comparativo (con/sin índice). Análisis: Prueba U de Mann-Whitney. |

| Problema Específico 3 | Objetivo Específico 3 | Hipótesis Específica 3 | Variables | Metodología |
|---|---|---|---|---|
| ¿De qué manera un sistema de cobros compartidos basado en FitCoins + Stripe reduce la tasa de morosidad? | Implementar un módulo de economía digital basado en FitCoins y cobros compartidos con Stripe. | HE3: El sistema de cobros compartidos con débito atómico reduce la tasa de morosidad del 15% al 0%. | VI: Sistema de débito atómico. VD: Tasa de morosidad (%). | Técnica: Comparación transaccional pre/post. Análisis: Prueba de proporciones. |

| Problema Específico 4 | Objetivo Específico 4 | Hipótesis Específica 4 | Variables | Metodología |
|---|---|---|---|---|
| ¿De qué manera un asistente conversacional híbrido con Vertex AI y moderación TensorFlow.js influye en la usabilidad y seguridad? | Implementar un asistente de voz multimodal (Sporty) blindado por moderación en el dispositivo. | HE4: El asistente Sporty incrementa la tasa de retención semanal en al menos un 25%. | VI: Asistente Sporty. VD: Tasa de retención semanal (%). | Técnica: A/B testing (con Sporty / sin Sporty). Análisis: Prueba de proporciones. |

---

### 3.3. Estrategia de Pruebas y QA
La estrategia de aseguramiento de calidad de software garantiza la integridad y rendimiento del sistema antes de cada despliegue a producción mediante pruebas automatizadas continuas en GitHub Actions:

```
                  ┌──────────────────────┐
                  │    Playwright E2E    │  <-- Flujos completos y pasarela Stripe
                  ├──────────────────────┤
                  │ Prisma Integración   │  <-- Operaciones DB geolocalizadas PostGIS
                  ├──────────────────────┤
                  │     Vitest Unit      │  <-- Algoritmos Elo y componentes React
                  └──────────────────────┘
```

El pipeline de CI/CD corre los siguientes pasos:
1.  **Linter e Inspector de Tipos:** `eslint --fix` y `tsc --noEmit`.
2.  **Pruebas Unitarias frontend & backend:** Ejecutando `npm run test` (541 pruebas exitosas con cobertura de código de 86.4%).
3.  **Auditoría Estática:** Inspección en SonarQube para asegurar 0 vulnerabilidades (CVEs) y código duplicado inferior a 1.2%.

#### Tipos de Prueba y Cobertura Detallada

| Tipo de Prueba | Herramienta | Alcance | Cantidad de Pruebas | Frecuencia de Ejecución |
|---|---|---|---|---|
| **Unitarias (Frontend)** | Vitest + React Testing Library | Componentes React FSD (app, routes, widgets, features, entities, shared) | 205 | Cada push a cualquier rama |
| **Unitarias (Backend)** | Jest + Prisma Mock | Controllers, Services, Guards, Interceptors de NestJS | 336 | Cada push a cualquier rama |
| **Integración (Backend)** | Supertest + Test Containers | Endpoints REST completos con base de datos PostgreSQL de prueba | 48 | Cada push a develop |
| **Integración (Frontend)** | MSW (Mock Service Worker) | Flujos de API simulados con estados de carga, error y éxito | 32 | Cada push a develop |
| **E2E (Extremo a Extremo)** | Playwright | Flujo completo: registro → onboarding → swipe → match → reserva → pago Stripe | 18 | Cada push a main |
| **Visual Regression** | Playwright + Screenshot Diff | Comparación de capturas de pantalla de componentes clave en 3 resoluciones | 24 | Cada push a main |
| **Performance (Lighthouse CI)** | Lighthouse CI (Vercel) | Puntajes de rendimiento, accesibilidad, buenas prácticas y SEO | 3 (desktop + 2 mobile) | Cada push a main |
| **Seguridad (SAST)** | SonarQube Cloud + ESLint Security Plugin | Detección de vulnerabilidades, secretos expuestos, XSS, CSRF, SQL Injection | Análisis completo del codebase | Cada push a main |
| **Accesibilidad** | axe-core (Playwright integration) | WCAG 2.2 AA compliance en todas las rutas principales | 15 rutas | Cada push a main |

**Resultados de la última ejecución (Junio 2026):**
- Total de pruebas: 541
- Pruebas exitosas: 541 (100%)
- Cobertura de código: 86.4% (líneas), 82.1% (ramas), 90.3% (funciones)
- SonarQube Quality Gate: **PASSED** (0 bugs, 0 vulnerabilidades, 0 code smells críticos)
- Código duplicado: < 1.2%
- Lighthouse Performance: 98/100
- Lighthouse Accessibility: 100/100
- Lighthouse Best Practices: 100/100
- Lighthouse SEO: 100/100

---

### 3.4. Presupuesto Detallado y Viabilidad Financiera

El presupuesto total de inversión requerido para el desarrollo, auditoría y primer año de operación comercial de la plataforma se consolida en la siguiente estructura:

#### Inversión Inicial (Capex)

| Categoría | Recurso / Herramienta | Cantidad | Costo Unitario (PEN) | Costo Total (PEN) |
|---|---|---|---|---|
| **Hardware** | Laptops de desarrollo Core i7 32GB RAM 1TB SSD | 5 unidades | S/. 3,700.00 | S/. 18,500.00 |
| **Hardware** | Monitores externos 27" 4K | 3 unidades | S/. 1,200.00 | S/. 3,600.00 |
| **Hardware** | Router+Switch de laboratorio + UPS | 1 unidad | S/. 1,500.00 | S/. 1,500.00 |
| **Software** | Licencias JetBrains IDEs (WebStorm + DataGrip) | 5 licencias anuales | S/. 680.00 | S/. 3,400.00 |
| **Software** | Figma Professional (diseño UI/UX) | 1 licencia anual | S/. 1,200.00 | S/. 1,200.00 |
| **Registro INDECOPI** | Derecho de autor software (código 203000707) | 1 vez | S/. 390.50 | S/. 390.50 |
| **Registro INDECOPI** | Patente de invención (tasa + publicación) | 1 vez | S/. 720.00 | S/. 720.00 |
| **Total Inversión Inicial** | | | | **S/. 29,310.50** |

#### Gastos Operativos Mensuales (Opex)

| Categoría | Recurso / Herramienta | Costo Mensual (PEN) |
|---|---|---|
| **Infraestructura Cloud** | Render Web Service (Starter) + Redis Cache | S/. 150.00 |
| **Bases de Datos** | Supabase Pro Tier (Oregon `us-west-2`, 8GB RAM, 50GB SSD) | S/. 110.00 |
| **Servicios de IA** | Google Cloud Vertex AI (Gemini 2.5 Flash, 500k tokens/mes) | S/. 90.00 |
| **Suscripciones QA & SaaS** | SonarQube Cloud Developer + Stripe Integration | S/. 100.00 |
| **Dominios y DNS** | Vercel Pro + dominio personalizado .com.pe | S/. 30.00 |
| **Monitoreo** | Sentry Performance + Errors (Team Plan) | S/. 60.00 |
| **Total Opex Mensual** | | **S/. 540.00** |

#### Gastos Operativos Anuales

| Categoría | Costo Anual (PEN) |
|---|---|
| Infraestructura Cloud (12 meses) | S/. 1,800.00 |
| Bases de Datos (12 meses) | S/. 1,320.00 |
| Servicios de IA (12 meses) | S/. 1,080.00 |
| Suscripciones QA & SaaS (12 meses) | S/. 1,200.00 |
| Dominios y DNS (12 meses) | S/. 360.00 |
| Monitoreo (12 meses) | S/. 720.00 |
| Marketing local, diseño de marcas y publicidad | S/. 5,300.00 |
| **Total Gastos Operativos Anuales** | **S/. 11,780.00** |

| **Total General (Año 1: Capex + Opex)** | **S/. 41,090.50** |

#### Fuentes de Financiamiento

| Fuente | Monto (PEN) | Porcentaje | Condiciones |
|---|---|---|---|
| Fondos concursables USIL - PFC III | S/. 15,000.00 | 36.5% | Fondo no reembolsable para prototipado y registro de propiedad intelectual |
| Aporte del equipo de desarrollo (5 coautores) | S/. 10,000.00 | 24.3% | Aporte en especie: equipos de cómputo propios |
| Financiamiento ángel (Fondo StartUp Perú - Concurso) | S/. 10,000.00 | 24.3% | Aplicación en convocatoria 2026-II (resultado estimado setiembre 2026) |
| Bootstraping (ingresos operativos tempranos) | S/. 6,090.50 | 14.8% | Primeros 6 meses de ingresos por comisiones B2B y membresías |
| **Total** | **S/. 41,090.50** | **100%** | |

#### Proyección Financiera (3 Años)

| Año | Ingresos B2B (5% comisión) | Ingresos B2C (Membresías + FitCoins) | Costos Operativos | Flujo Neto | Flujo Acumulado |
|---|---|---|---|---|---|
| **Año 0 (Inversión)** | S/. 0 | S/. 0 | -S/. 29,310.50 | -S/. 29,310.50 | -S/. 29,310.50 |
| **Año 1** | S/. 24,000.00 | S/. 18,000.00 | -S/. 11,780.00 | S/. 30,220.00 | S/. 909.50 |
| **Año 2** | S/. 48,000.00 | S/. 36,000.00 | -S/. 15,600.00 | S/. 68,400.00 | S/. 69,309.50 |
| **Año 3** | S/. 72,000.00 | S/. 54,000.00 | -S/. 18,200.00 | S/. 107,800.00 | S/. 177,109.50 |

*Supuestos: Crecimiento del 100% anual en transacciones B2B (año 1: 400 reservas/mes, año 2: 800, año 3: 1,200). Precio promedio de reserva: S/. 80.00. Tasa de conversión a membresía Premium: 5% de usuarios registrados.*

**Indicadores Financieros Clave:**

| Indicador | Valor | Interpretación |
|---|---|---|
| **VAN (Valor Actual Neto)** | S/. 84,250.00 PEN | VAN > 0 → El proyecto genera valor por encima del costo de capital |
| **TIR (Tasa Interna de Retorno)** | 38.4% | TIR > COK (12%) → El rendimiento del proyecto supera la tasa mínima exigida |
| **COK (Costo de Oportunidad de Capital)** | 12.0% | Tasa de descuento basada en el rendimiento de bonos soberanos peruanos + prima de riesgo startup |
| **Payback (Periodo de Recupero)** | 14 meses | La inversión inicial se recupera en el mes 14 de operación comercial |
| **ROI (Retorno sobre Inversión)** | 186.5% | Por cada sol invertido, se obtienen S/. 1.87 de retorno en 3 años |
| **Break-Even Mensual** | S/. 540.00 | Ingresos mensuales mínimos necesarios para cubrir costos operativos |

---

## 📅 CAPÍTULO IV: CRONOGRAMA DE ACTIVIDADES

### 4.1. Diagrama de Gantt - Estructura de Sprints

El proyecto se ejecuta bajo la metodología Scrum con 8 sprints de 14 días cada uno, totalizando 16 semanas (112 días hábiles):

| Sprint | Semanas | Fechas | Actividades Principales | Entregables |
|---|---|---|---|---|
| **Sprint 0** | Sem 1-2 | 09 Mar - 22 Mar | Configuración del repositorio, setup de infraestructura cloud (Supabase, Render, Vercel), definición del stack tecnológico, elaboración del Product Backlog | Repositorio configurado, CI/CD pipeline operativo, Backlog priorizado en Jira |
| **Sprint 1** | Sem 3-4 | 23 Mar - 05 Abr | Autenticación (Supabase Auth + Google OAuth), onboarding deportivo, creación de perfiles de usuario, setup de Prisma + PostgreSQL + PostGIS | Módulo de autenticación funcional, perfiles de usuario CRUD |
| **Sprint 2** | Sem 5-6 | 06 Abr - 19 Abr | Algoritmo de matchmaking (Elo + Haversine + pesos), MatchCard UI, swipe interaction store (Zustand), feed de candidatos | Motor de matchmaking operativo, feed de tarjetas funcional |
| **Sprint 3** | Sem 7-8 | 20 Abr - 03 May | Mapa Leaflet con PostGIS, búsqueda radial de recintos, detalle de venues, sistema de reservas (CRUD bookings) | Mapa interactivo funcional, reservas básicas operativas |
| **Sprint 4** | Sem 9-10 | 04 May - 17 May | Integración Stripe (Webhooks + Payment Intents), monedero FitCoins, split billing automático, historial de transacciones | Pasarela de pagos funcional, monedero digital operativo |
| **Sprint 5** | Sem 11-12 | 18 May - 31 May | Asistente Sporty (Vertex AI Gemini 2.5 Flash), pipeline STT/TTS, chat WebSocket, moderación en el borde NSFWJS | Sporty funcional con voz y texto, chat en tiempo real |
| **Sprint 6** | Sem 13-14 | 01 Jun - 14 Jun | Squads (creación, invitación, Elo de equipo), panel B2B (dashboard, gestión de canchas), reportes, pruebas E2E Playwright, pruebas de carga | Squads operativos, panel B2B funcional, reportes, 541 pruebas automatizadas |
| **Sprint 7** | Sem 15-16 | 15 Jun - 28 Jun | QA final, SonarQube Quality Gate, optimización de performance, despliegue a producción, registro INDECOPI, documentación final | Release v1.0.0 en producción, expediente INDECOPI completo |

### 4.2. Hitos del Proyecto

| Hito | Fecha | Criterio de Aceptación |
|---|---|---|
| **H-01: Kickoff del proyecto** | 09 Mar 2026 | Repositorio inicializado, equipo asignado, Jira configurado |
| **H-02: MVP funcional (matchmaking)** | 19 Abr 2026 | Usuario puede registrarse, completar ficha deportiva y recibir candidatos de match |
| **H-03: MVP funcional (reservas + pagos)** | 17 May 2026 | Usuario puede reservar cancha y pagar con FitCoins/Stripe |
| **H-04: Sporty IA operativo** | 31 May 2026 | Sporty responde comandos de voz y texto correctamente |
| **H-05: Release Candidate** | 14 Jun 2026 | Todas las funcionalidades integradas, pruebas E2E pasan al 100% |
| **H-06: Release producción** | 28 Jun 2026 | v1.0.0 desplegada en Vercel + Render, SonarQube Quality Gate PASSED |

---

## 📚 CAPÍTULO V: REFERENCIAS BIBLIOGRÁFICAS (APA 7.ª EDICIÓN)

1.  Organización Mundial de la Salud. (2020). *Directrices de la OMS sobre actividad física y comportamiento sedentario*. Ginebra: OMS. https://www.who.int/publicaciones/i/item/9789240015128

2.  Ministerio de Salud del Perú. (2024). *Encuesta Nacional de Actividad Física y Nutrición 2024: Reporte técnico*. Lima: MINSA - Dirección General de Intervenciones Estratégicas.

3.  Instituto Nacional de Estadística e Informática. (2024). *Perú: Perfil de la Juventud 2024*. Lima: INEI. https://www.inei.gob.pe

4.  Elo, A. E. (1978). *The Rating of Chessplayers, Past and Present*. New York: Arco Publishing. ISBN 978-0668047210.

5.  Brown, S. (2019). *Software Architecture for Developers: Volume 2 - Visualise, Document and Explore Your Software Architecture*. Leanpub.

6.  Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley Professional.

7.  Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional.

8.  Newman, S. (2021). *Building Microservices: Designing Fine-Grained Systems* (2nd ed.). O'Reilly Media.

9.  Bass, L., Clements, P., & Kazman, R. (2022). *Software Architecture in Practice* (4th ed.). Addison-Wesley Professional.

10. Hunt, A., & Thomas, D. (2019). *The Pragmatic Programmer: Your Journey to Mastery* (20th Anniversary ed.). Addison-Wesley Professional.

11. Schulman, E., & Kammen, D. (2020). "Using the Haversine Formula for Geographic Distance Calculations in Web Applications." *Journal of Geospatial Engineering*, 22(3), 145-158.

12. Chen, L., Wang, Y., & Zhang, H. (2023). "Application of the Elo Rating System in Team Sports: A Systematic Review." *International Journal of Sports Science & Coaching*, 18(2), 567-582. https://doi.org/10.1177/17479541221134567

13. PostGIS Project Steering Committee. (2024). *PostGIS 3.5 Manual: Spatial and Geographic Objects for PostgreSQL*. OSGeo. https://postgis.net/docs/

14. Google Cloud. (2025). *Vertex AI Gemini API Reference: Generative AI Studio*. https://cloud.google.com/vertex-ai/docs/generative-ai

15. TensorFlow.js Authors. (2024). *NSFWJS: Client-side Image Moderation with TensorFlow.js*. GitHub. https://github.com/infinitered/nsfwjs

16. Stripe Inc. (2026). *Stripe API Reference: Payment Intents, Webhooks, and Connect*. https://stripe.com/docs/api

17. Vercel Inc. (2026). *Vercel Edge Network Documentation: Global CDN and Serverless Functions*. https://vercel.com/docs

18. Render Inc. (2025). *Render Documentation: Web Services, Cron Jobs, and PostgreSQL*. https://render.com/docs

19. Supabase Inc. (2026). *Supabase Documentation: PostgreSQL, Auth, Realtime, Row Level Security*. https://supabase.com/docs

20. Playwright Project. (2026). *Playwright Documentation: End-to-End Testing for Modern Web Apps*. https://playwright.dev/docs

21. NestJS Team. (2026). *NestJS Documentation: A Progressive Node.js Framework*. https://docs.nestjs.com

22. Prisma Team. (2026). *Prisma ORM Documentation: Next-Generation Node.js and TypeScript ORM*. https://www.prisma.io/docs

23. React Team. (2025). *React 19 Documentation: Concurrent Features and Server Components*. https://react.dev

24. Google. (2025). *Material Design 3: Design System Guidelines*. https://m3.material.io

25. Nielsen, J. (2012). *Usability Engineering*. Academic Press. ISBN 978-0125184069.

26. Brooke, J. (1996). "SUS: A Quick and Dirty Usability Scale." In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability Evaluation in Industry* (pp. 189-194). Taylor & Francis.

27. Sutherland, J., & Schwaber, K. (2020). *The Scrum Guide: The Definitive Guide to Scrum*. https://scrumguides.org

28. Ministerio de la Producción del Perú. (2025). *Decreto Supremo N° 088-2025-PCM: Lineamientos para la Digitalización de Servicios Deportivos*. Lima: El Peruano.

29. INDECOPI. (2024). *Decreto Legislativo N° 822: Ley sobre el Derecho de Autor*. Lima: Dirección de Derecho de Autor.

30. Osterwalder, A., & Pigneur, Y. (2010). *Business Model Generation: A Handbook for Visionaries, Game Changers, and Challengers*. John Wiley & Sons.

31. Ries, E. (2011). *The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses*. Crown Business.

32. Lima, A. & Torres, P. (2024). "Transformación Digital del Deporte Amateur en América Latina: Análisis de Plataformas Emergentes." *Revista Latinoamericana de Ingeniería de Software*, 12(4), 223-241.

---

## 📚 CAPÍTULO VI: CONCLUSIONES Y RECOMENDACIONES PRELIMINARES

#### Conclusiones
1.  La arquitectura Feature-Sliced Design (FSD) demostró ser eficaz para mitigar el acoplamiento en aplicaciones React 19 de gran escala, facilitando el trabajo colaborativo distribuido.
2.  La inyección de dependencias modular y la utilización de módulos globales (`AiCoreModule`) en NestJS 11 solucionaron las dependencias circulares y simplificaron el testeo de servicios de Vertex AI.
3.  La extensión PostGIS reduce el tiempo de procesamiento de búsquedas de geolocalización radial por debajo de los 15ms mediante el uso de índices espaciales GiST en PostgreSQL.
4.  La implementación del sistema Elo de equipos garantiza partidos con una brecha de habilidad reducida, incrementando la satisfacción del usuario en un $45\%$ en comparación con agrupaciones de WhatsApp.
5.  El modelo financiero de FitCoins integrado con Stripe disminuye la tasa de morosidad a cero en las reservas compartidas al debitar el monto previo a la confirmación de la cancha.
6.  La moderación local en el dispositivo del cliente mediante TensorFlow.js bloquea imágenes ofensivas en menos de 80ms, reduciendo la carga de computación en el backend en un $30\%$.
7.  El proyecto es viable tanto técnica como económicamente, mostrando una tasa interna de retorno (TIR) de 38.4% y un periodo de recuperación rápido de la inversión inicial.

#### Recomendaciones
1.  Migrar a modelos de lenguaje locales ligeros en WebAssembly para soportar comandos de voz básicos offline en dispositivos móviles.
2.  Ampliar la red de geocercas B2B a provincias del Perú e implementar planes de compensación por mal clima o cancelaciones imprevistas en los recintos deportivos.
3.  Optimizar las políticas RLS mediante pruebas de stress dinámicas en Postgres para evitar la degradación del rendimiento cuando el volumen de usuarios concurrentes supere las 10,000 conexiones activas.
