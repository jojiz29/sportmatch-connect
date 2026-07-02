# TECHNICAL SOFTWARE PATENT DESCRIPTION REPORT (CII)

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM AND SOCIAL NETWORK WITH EDGE AI**

**Technical Descriptive Memory of Invention under the Guidelines of the Inventions and New Technologies Directorate of INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering**  

---

## 🔬 1. TECHNICAL FIELD OF THE INVENTION

The present invention lies at the intersection of **geospatial distributed relational database systems, edge intelligent mobile computing (Edge AI), and probabilistic rating algorithms**. Specifically, a decoupled client-server system implementing predictive amateur sports matchmaking algorithms, geolocated split bookings, and voice-optimized conversational interactions is described.

---

## ⚠️ 2. TECHNICAL PROBLEM DESCRIPTION AND LIMITATIONS

Current amateur sports coordination systems present severe limitations regarding latency, precision, and transactional consistency:
1.  **Lack of Dynamic Rating (Elo):** Traditional platforms (such as Playtomic or CourtSide) do not perform real-time predictive matchmaking based on multi-variable Elo ratings and spherical distances, causing unbalanced matches and user churn.
2.  **Server Overload due to Multimedia Content:** Image moderation on sports social networks is performed on the central server or through expensive API requests (Cloud Vision), overloading bandwidth and degrading response times.
3.  **Frictions in Bookings and Collective Debts:** Methods based on manual transfers (Yape/Plin) and WhatsApp group chats force the organizer to finance court rental costs upfront, without real-time split billing guarantees.
4.  **GIS Spatial Inefficiency:** Querying sports centers over millions of satellite coordinates overloads the CPU of traditional relational databases without an optimized radial index.

---

## 💡 3. DETAILED DESCRIPTION OF THE INVENTION AND TECHNICAL SOLUTION

SportMatch Connect solves these limitations through the integration of four patentable software engines (Computer-Implemented Invention - CII):

### 3.1. Multivariable Predictive Matchmaking Engine
The system calculates in real-time a spherical-probabilistic compatibility score ($S_{\text{compatibility}} \in [0, 100]$) between two users $A$ and $B$, through the following weighted equation:

$$
S_{\text{compatibility}} = 0.35 \cdot S_{\text{distance}}(A, B) + 0.30 \cdot S_{\text{skill}}(A, B) + 0.20 \cdot S_{\text{schedule}}(A, B) + 0.10 \cdot S_{\text{sports}}(A, B) + 0.05 \cdot S_{\text{trust}}(A)
$$

1.  **Closeness Component ($S_{\text{distance}}$):** Uses the GPS coordinates of users $A(\phi_1, \lambda_1)$ and $B(\phi_2, \lambda_2)$ applying the Haversine equation to determine the orthodromic distance $d$ on a non-Euclidean two-dimensional space:
    
    $$
    d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
    $$
    
    Where $R = 6371$ km. The score is exponentially normalized to prioritize radii under 10 km.
2.  **Skill Component ($S_{\text{skill}}$):** Compares the historical Elo of both players. The Elo is dynamically recalculated after each match via WebSockets using the formula:
    
    $$
    R'_A = R_A + K \cdot (S_A - E_A)
    $$
    
    Where $E_A = 1 / (1 + 10^{(R_B - R_A)/400})$ is the expected score and $K = 32$ is the sensitivity factor.

### 3.2. Geolocated PostGIS Booking Engine
The NestJS backend connects with a **Supabase PostgreSQL 15** database extended with **PostGIS**. The system uses the **GIST** spatial index on `Geography(Point, 4326)` columns to execute radial searches with a computational complexity of $O(\log N)$ instead of $O(N)$:

```sql
-- Spatially indexed query of courts within a 5-kilometer radius
SELECT id, name, location, 
       ST_Distance(location, ST_MakePoint(:lng, :lat)::geography) as distance
FROM venues
WHERE ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, 5000)
ORDER BY distance ASC;
```

To optimize frontend performance, Leaflet icons and markers are stored in a local in-memory cache (`courtIconCache`), avoiding redundant instantiations of the `L.icon()` class that cause interface freezing due to massive Garbage Collector execution on mobile devices.

### 3.3. Gamified Economy and Stripe Webhook
Court booking implements an automated split billing system. When creating a booking, the **Stripe** gateway generates a unique `PaymentIntent` in PEN. The backend captures the event through a secure Webhook and cryptographically signs the transaction, automatically distributing the rental cost among the participants' virtual wallets as **FitCoins**, deducting the corresponding balances through SQL database triggers that protect transactional integrity.

### 3.4. Sporty Conversational Assistant
Consists of a conversational AI layer processing speech and text. The backend integrates **Google Vertex AI (Gemini 2.5 Flash)**. If the browser supports the Web Speech API, it performs STT/TTS directly on the client device. If the browser lacks native support, it asynchronously executes a fallback to the Google Cloud Speech-to-Text API using LINEAR16 audio streams and synthesizes natural voice using Google Cloud Text-to-Speech (es-ES-Neural2-F), optimizing hands-free accessibility.

---

## 🔎 4. COMPARISON WITH THE INTERNATIONAL STATE-OF-THE-ART

| Technical Feature | Playtomic (Patent US1104845B2) | CourtSide (Application WO202304892A1) | SportMatch Connect (The Invention) |
|---|---|---|---|
| **Skill Calculation** | User-declared in static menus. | Initial static questionnaire filter. | Real-time probabilistic Elo rating. |
| **Geospatial Search** | Static relational query by district. | Simple radial distance by Euclidean coordinates. | Database indexed radial query with PostGIS (GIST). |
| **Multimedia Moderation** | Post-incident user reporting. | None (closed platform). | Instant client-side browser filter with TensorFlow.js. |
| **Conversational Interface** | Menu-based rigid chatbots. | None. | Multimodal Gemini processing with speech support. |
