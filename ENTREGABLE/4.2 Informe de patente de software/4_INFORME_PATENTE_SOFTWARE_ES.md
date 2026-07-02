# INFORME TÉCNICO DE DESCRIPCIÓN DE PATENTE DE SOFTWARE (IIO)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RED SOCIAL CON IA EN EL BORDE**

**Memoria Descriptiva Técnica de Invención bajo Directrices de la Dirección de Invenciones y Nuevas Tecnologías de INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería**  

---

## 🔬 1. SECTOR TECNOLÓGICO DE LA INVENCIÓN

La presente invención se enmarca en la intersección de los **sistemas de bases de datos relacionales distribuidas geoespaciales, la computación móvil inteligente en el borde (Edge AI) y los algoritmos probabilísticos de nivelación**. Específicamente, se describe un sistema cliente-servidor desacoplado que implementa algoritmos predictivos de emparejamiento deportivo recreativo, reserva compartida geolocalizada e interacción por voz optimizada.

---

## ⚠️ 2. DESCRIPCIÓN DEL PROBLEMA TÉCNICO Y LIMITACIONES

Los sistemas actuales de coordinación deportiva amateur presentan severas limitaciones de latencia, precisión y consistencia transaccional:
1.  **Falta de Nivelación Dinámica (Elo):** Las plataformas tradicionales (como Playtomic o CourtSide) no realizan un cálculo predictivo en tiempo real del nivel de destreza de los jugadores, lo que genera partidos desequilibrados y deserción.
2.  **Saturación de Servidores por Carga Multimedia:** La moderación de imágenes en redes sociales deportivas se realiza en el servidor central o mediante peticiones API costosas (Cloud Vision), saturando el ancho de banda y degradando el tiempo de respuesta.
3.  **Fricciones en Reservas y Morosidad Colectiva:** Los métodos basados en transferencias manuales (Yape/Plin) e hilos de conversación en WhatsApp obligan al organizador a financiar el costo de alquiler de forma directa, sin garantías de cobro prorrateado en tiempo real.
4.  **Ineficiencia Espacial GIS:** Las consultas de geolocalización de canchas sobre millones de coordenadas satelitales saturan la CPU de las bases de datos relacionales tradicionales al no contar con un motor de indexación radial optimizado.

---

## 💡 3. DESCRIPCIÓN DETALLADA DE LA INVENCIÓN Y SOLUCIÓN TÉCNICA

SportMatch Connect soluciona estas limitaciones mediante la integración de cuatro motores de software patentables (Invención Implementada por Ordenador - IIO):

### 3.1. Motor de Matchmaking Predictivo Multivariable
El sistema calcula en tiempo real un score de compatibilidad esférico-probabilístico ($S_{\text{compatibilidad}} \in [0, 100]$) entre dos usuarios $A$ y $B$, mediante la siguiente ecuación ponderada:

$$
S_{\text{compatibilidad}} = 0.35 \cdot S_{\text{distancia}}(A, B) + 0.30 \cdot S_{\text{habilidad}}(A, B) + 0.20 \cdot S_{\text{horario}}(A, B) + 0.10 \cdot S_{\text{deporte}}(A, B) + 0.05 \cdot S_{\text{trust}}(A)
$$

1.  **Componente de Cercanía ($S_{\text{distancia}}$):** Utiliza las coordenadas GPS de los usuarios $A(\phi_1, \lambda_1)$ y $B(\phi_2, \lambda_2)$ aplicando la ecuación de Haversine para determinar la distancia ortodrómica $d$ en un espacio bidimensional no euclidiano:
    
    $$
    d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
    $$
    
    Donde $R = 6371$ km. El score se normaliza exponencialmente para priorizar radios menores a 10 km.
2.  **Componente de Habilidad ($S_{\text{habilidad}}$):** Compara el Elo histórico de ambos jugadores. El Elo se recalcula dinámicamente tras cada partido registrado mediante la fórmula:
    
    $$
    R'_A = R_A + K \cdot (S_A - E_A)
    $$
    
    Donde $E_A = 1 / (1 + 10^{(R_B - R_A)/400})$ es la expectativa de victoria y $K = 32$ es el factor de ajuste de sensibilidad del motor.

### 3.2. Motor de Reservas PostGIS Geolocalizadas
El backend en NestJS se conecta con una base de datos **Supabase PostgreSQL 15** extendida con **PostGIS**. El sistema utiliza el índice espacial **GIST** sobre columnas de tipo `Geography(Point, 4326)` para ejecutar búsquedas radiales con una complejidad computacional $O(\log N)$ en lugar de $O(N)$:

```sql
-- Consulta espacial indexada de canchas en un radio de 5 kilometros
SELECT id, name, location, 
       ST_Distance(location, ST_MakePoint(:lng, :lat)::geography) as distance
FROM venues
WHERE ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, 5000)
ORDER BY distance ASC;
```

Para optimizar el rendimiento del frontend, los iconos y marcadores Leaflet se almacenan en una caché en memoria local (`courtIconCache`), evitando instanciaciones redundantes de la clase `L.icon()` que provocan congelamiento de la interfaz debido a la ejecución masiva del Garbage Collector en dispositivos móviles.

### 3.3. Economía Gamificada y Webhook de Stripe
La reserva de canchas implementa un sistema de cobros compartidos automatizado. Al crear una reserva, la pasarela **Stripe** genera un `PaymentIntent` único en soles (PEN). El backend captura el evento mediante un Webhook seguro y firma criptográficamente la transacción, distribuyendo automáticamente el costo del alquiler entre los monederos virtuales de los participantes en forma de **FitCoins**, deduciendo los balances correspondientes mediante disparadores (*triggers*) SQL que blindan la integridad atómica financiera.

### 3.4. Asistente Conversacional Sporty
Consiste en una capa conversacional de Inteligencia Artificial que procesa audio y texto. El backend integra **Google Vertex AI (Gemini 2.5 Flash)**. Si el navegador soporta Web Speech API, realiza el procesamiento STT/TTS directamente en el dispositivo cliente. Si el navegador no cuenta con soporte nativo, ejecuta de forma asíncrona un fallback hacia la API de Google Cloud Speech-to-Text utilizando flujos de audio en codificación LINEAR16, y sintetiza voz natural Neural2 de Google Cloud Text-to-Speech (es-ES-Neural2-F), optimizando la accesibilidad manos libres.

---

## 🔎 4. COMPARATIVA CON EL ESTADO DEL ARTE INTERNACIONAL

| Característica Técnica | Playtomic (Patente US1104845B2) | CourtSide (Solicitud WO202304892A1) | SportMatch Connect (La Invención) |
|---|---|---|---|
| **Cálculo de Habilidad** | Autodeclarativo por el usuario en menús. | Filtro estático inicial por cuestionario. | Puntuación probabilística Elo en tiempo real. |
| **Búsqueda Geoespacial** | Consulta relacional estática por distrito. | Distancia radial simple por coordenadas euclidianas. | Consulta radial indexada en base de datos con PostGIS (GIST). |
| **Moderación Multimedia** | Reporte diferido posterior al incidente. | Ninguno (plataforma cerrada). | Filtro local instantáneo pre-carga en el navegador con TensorFlow.js. |
| **Interfaz conversacional** | Chatbots estáticos basados en menús rígidos. | Ninguno. | Procesamiento multimodal Gemini con soporte de voz. |
