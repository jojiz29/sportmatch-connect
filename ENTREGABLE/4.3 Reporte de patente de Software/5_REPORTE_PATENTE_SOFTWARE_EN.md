# SOFTWARE PATENTABILITY, SEARCH, AND CLAIMS REPORT

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM AND SOCIAL NETWORK WITH EDGE AI**

**Technical Document of Patentability and Industrial Invention under Examination Rules of Decision 486 of the Andean Community**  
**Universidad San Ignacio de Loyola (USIL) — Research Directorate**  

---

## 🔎 1. INTERNATIONAL PATENT CLASSIFICATION (IPC)

According to the categories of the International Patent Classification (IPC), the present invention is classified under the following specialty codes:

*   **G06F 16/29 (Geographic Information Systems - GIS):** Spatial databases and geospatial retrieval (PostGIS).
*   **G06F 17/18 (Statistical Methods and Analysis):** Probabilistic algorithms for matchmaking (Elo Rating).
*   **G06Q 50/10 (Commercial Systems for Sports and Entertainment):** Automated management of bookings and sports communities.
*   **G06N 3/08 (Machine Learning):** Convolutional neural networks at the edge (TensorFlow.js / NSFWJS).

---

## 🔬 2. ANTECEDENTS SEARCH STRATEGY AND STATE-OF-THE-ART

The search of the state-of-the-art was performed in the databases of the **United States Patent and Trademark Office (USPTO)**, the **European Patent Office (EPO - Espacenet)**, and the **World Intellectual Property Organization (WIPO)** using the following boolean search formula:

`("matchmaking" OR "player rating") AND ("geospatial booking" OR "PostGIS") AND ("edge AI" OR "TensorFlow.js") AND ("split billing" OR "split payment")`

### Evaluated Patents and Applications:

1.  **Patent US1104845B2 — "System and method for sports court reservation" (Playtomic S.L.):**
    *   *Analysis:* Describes a transactional booking system and a basic social interface. However, it does not disclose a dynamic probabilistic mechanism for player leveling (Elo Rating) spatially integrated with a PostGIS radial search, nor does it feature a local voice conversational assistant at the edge.
2.  **Patent Application WO202304892A1 — "Sports matchmaking and scheduling apparatus" (CourtSide Inc.):**
    *   *Analysis:* Claims an apparatus and method for organizing matches based on static filters (questionnaires). It does not contemplate multimedia image moderation on the client device using convolutional neural networks in Javascript, nor real-time financial division through SQL atomic wallets linked to payment webhooks.

---

## 📜 3. FORMAL CLAIMS SET (Legal Protection Text)

The claims body defining the scope of requested legal protection is detailed below:

### System Claims (Physical Support Implemented by Software)

*   **Claim 1 (Independent):** A distributed computer system for predictive matchmaking of amateur recreational sports profiles and transactional booking management, characterized by comprising:
    *   a) A frontend web client developed in a Progressive Web Application (PWA) environment structured in Feature-Sliced Design (FSD) layers, executing a local in-memory storage module that caches interactive Leaflet geospatial markers;
    *   b) A NestJS modular backend server coupled to a PostgreSQL database engine extended spatially with PostGIS; and
    *   c) A predictive matchmaking engine that calculates in real-time a compatibility score ($S_{\text{compatibility}} \in [0, 100]$) through the weighted formula:
        
        $$
        S_{\text{compatibility}} = 0.35 \cdot S_{\text{distance}} + 0.30 \cdot S_{\text{skill}} + 0.20 \cdot S_{\text{schedule}} + 0.10 \cdot S_{\text{sports}} + 0.05 \cdot S_{\text{trust}}
        $$

*   **Claim 2 (Dependent):** The computer system of claim 1, wherein the spatial closeness component $S_{\text{distance}}$ is calculated by evaluating the geographic coordinates latitude and longitude through the Haversine orthodromic formula, which measures the linear spherical distance over a terrestrial radius of 6371 kilometers.
*   **Claim 3 (Dependent):** The computer system of claim 1, wherein the skill component $S_{\text{skill}}$ is evaluated by comparing the probabilistic Elo rating of the two users, which is automatically recalculated after the insertion of a match result through a real-time persistent WebSocket.
*   **Claim 4 (Dependent):** The computer system of claim 1, wherein the PostgreSQL database engine implements a GIST spatial index on geography coordinate columns, executing radial searches with logarithmic computational complexity.

### Method Claims (Client-side Security and Moderation at the Edge)

*   **Claim 5 (Independent):** A computer-implemented method for moderating multimedia file uploads on a sports social network, characterized by comprising the steps of:
    *   a) Intercepting the upload of an image on the frontend web client before its transmission through the physical network;
    *   b) Analyzing the image through a local convolutional neural network executed with TensorFlow.js and NSFWJS in the browser's execution thread; and
    *   c) Immediately canceling the upload HTTP request and emitting a visual error Toast on the client if the probability of inappropriate content yielded by the neural network exceeds 80%, avoiding unnecessary database server CPU calls.

### Database Claims (Security and Transactional Isolation)

*   **Claim 6 (Independent):** A relational database system for the transactional control of gamified sports economies, characterized by comprising:
    *   a) A relational schema in PostgreSQL defining financial transaction tables and virtual wallet balances (*FitCoins*); and
    *   b) A plurality of Row Level Security (RLS) policies applied at the database engine level, isolating transaction reads and writes by forcing the user ID to match the unique JWT identifier signed by the Supabase authentication provider.

---

## 🎨 4. FIGURES AND TECHNICAL DRAWINGS DESCRIPTION

*   **Figure 1 (C4 Topology):** Illustrates the distributed software containers, showing secure HTTPS connections and the flow of the asynchronous webhook from the Stripe Gateway to the NestJS server.
*   **Figure 2 (FSD Architecture):** Layout of the React 19 web client showing the downward unidirectional dependency flow between `app`, `routes`, `widgets`, `features`, `entities`, and `shared` layers, demonstrating the absence of circular couplings.
*   **Figure 3 (Spatial ERD Diagram):** Relational schema detailing the `location` column of `Geography(Point, 4326)` type protected by the GIST index.
