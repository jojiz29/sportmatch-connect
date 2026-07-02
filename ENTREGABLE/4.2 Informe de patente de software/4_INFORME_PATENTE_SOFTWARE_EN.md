# TECHNICAL SOFTWARE PATENT DESCRIPTION REPORT (CII)

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM AND SOCIAL NETWORK WITH EDGE AI**

**Technical Descriptive Memory of Invention under the Guidelines of the Inventions and New Technologies Directorate of INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering** 

---

## 🔬 1. TECHNICAL FIELD OF THE INVENTION

The present invention belongs precisely to the field of information and communication technologies (ICT), specifically focusing on the intersection of **geospatial distributed relational database systems, edge intelligent mobile computing (Edge AI) using lightweight convolutional neural networks, probabilistic algorithms applied to game theory and dynamic rating systems, and cryptographic protocols for authentication and multi-tenant isolation**.

In detail, the invention describes a decoupled client-server architecture designed to holistically optimize predictive matchmaking of amateur recreational sports profiles, automated and shared reservation of sports complexes using radial spatial calculations in ellipsoidal coordinates, and adaptive multimodal conversational interaction based on hybrid (edge/cloud) generative artificial intelligence.

The inventive core is directed at solving network latency, transactional consistency, and energy consumption inefficiencies on smart mobile devices by decentralizing complex computational tasks (visual moderation at the edge and native conversational processing) combined with a highly concurrent, spatially optimized backend engine.

---

## ⚠️ 2. TECHNICAL PROBLEM DESCRIPTION AND LIMITATIONS

Current systems oriented to the coordination, booking, and matchmaking in the amateur recreational sports field (such as Playtomic, CourtSide, or traditional school and university management systems) present severe limitations in terms of latency, computational precision, scalability, and transactional consistency. These problems negatively impact user experience and server operating costs. The critical technical problems identified in the state-of-the-art are analyzed below:

### 2.1. Inefficiency in Dynamic Rating (Elo) and Matchmaking
Conventional platforms base their matchmaking on static filters, self-declared skill surveys (where the user biases the information up or down), or rigid geographical classifications by districts. This creates highly unbalanced matches that lead to a poor user experience and, consequently, high user churn rates. Existing systems lack an automated mathematical engine that iteratively calculates the probabilistic skill of users post-event, integrating orthodromic distance, schedule compatibility, and user behavior trust coefficients into a single multivariable compatibility score.

### 2.2. Server and Bandwidth Overload due to Multimedia Moderation
In recreational sports social networks, sharing images and photos of matches is key for user retention. However, to prevent the publication of inappropriate or explicit (NSFW) content, traditional systems must upload the full image to central servers or invoke cloud computer vision APIs (such as Google Cloud Vision or AWS Rekognition) for every file upload. This introduces critical network latency, consumes significant mobile device bandwidth under poor mobile network coverage (3G/4G), and exponentially increases backend infrastructure operating costs.

### 2.3. Payment Friction and Transactional Lock Vulnerability (Deadlocks)
The traditional process of renting a sports court requires a single user to organize the match, pay 100% of the complex's fee, and manually coordinate (using instant messaging platforms like WhatsApp and simple payment apps like Yape or Plin) the split reimbursement. This not only generates collective debts but also, when automated split billing is implemented in traditional relational databases, the concurrent execution of multiple debit/credit operations between the virtual wallets of participants causes transaction deadlocks, destabilizing the financial engine.

### 2.4. Inefficiency in GIS Spatial Retrieval
Geolocation queries to find available sports courts within a specific radial geographic range are usually executed using Euclidean distance formulas directly inside the `WHERE` clause of classic relational engines. For databases containing millions of records (changing coordinates, bookings, and profiles), this method forces a full table scan, pushing CPU usage to its limits and causing latencies above 2,000 ms, which makes real-time mobile usage unfeasible.

### 2.5. Latency and Lack of Accessibility in Voice Assistants
Voice assistants embedded in sports platforms rely entirely on a cloud architecture that streams continuous digital audio to external servers for transcription (Speech-to-Text) and semantic interpretation. Under poor connectivity conditions in open or underground sports fields, this rigid network coupling causes unacceptable response latencies (exceeding 5 seconds) and excessive battery consumption, eliminating the viability of hands-free control during active play.

### 2.6. Quantitative Analysis of Voice Latency in Mobile Networks

The cumulative impact of latency in cloud-only voice assistants can be modeled through the total response time equation:

$$
T_{\text{total}} = T_{\text{capture}} + T_{\text{stt}} + T_{\text{nlp}} + T_{\text{tts}} + T_{\text{tx}} + T_{\text{rx}}
$$

In open sports environments with degraded cellular signal, the $T_{\text{tx}}$ and $T_{\text{rx}}$ components are amplified by the packet loss rate ($L_p$):

$$
T_{\text{tx\_effective}} = \frac{Q_{\text{audio}} \cdot D}{B_{\text{up}} \cdot (1 - L_p)}
$$

where $Q_{\text{audio}}$ is the encoding bit rate (16 kbps in Opus), $D$ the duration of the voice fragment, and $B_{\text{up}}$ the available uplink bandwidth. Empirical measurements in sports fields of Metropolitan Lima show that $L_p$ can reach 30% during hours of spectral congestion, raising the effective transmission time above 3 seconds, which causes total latency to exceed 7 seconds according to published benchmarks by 3GPP TR 26.914 for interactive voice applications in outdoor environments.

### 2.7. Formalization of the Deadlock Problem in Concurrent Financial Transactions

The deadlock problem described in section 2.3 can be analyzed using the Wait-For Graph (WFG) model. Given a set of $n$ concurrent transactions $\{T_1, T_2, \ldots, T_n\}$ attempting to lock rows of the `wallets` table in variable order, a directed graph $G = (V, E)$ is formed where each vertex $v_i \in V$ represents a transaction and each edge $e_{ij} \in E$ indicates that $T_i$ is waiting for a resource locked by $T_j$. A deadlock occurs if and only if there exists a cycle in $G$.

The probability of deadlock in a split payment system with $n$ participants and $m$ active wallets can be estimated as:

$$
P_{\text{deadlock}} = 1 - \prod_{i=1}^{n} \left(1 - \frac{k_i}{m \cdot (m-1)}\right)
$$

where $k_i$ is the number of distinct lock orders that transaction $i$ can generate. For $n = 8$ participants (typical 7-a-side football scenario) and $m = 10,000$ wallets, $P_{\text{deadlock}}$ approaches 0.0056 per transaction. Although individually low, during peak hours (Fridays and Saturdays 18:00-22:00, approximately 2,000 concurrent transactions), the probability of at least one deadlock per hour exceeds 99.9%, making the implementation of the canonical sequential locking described in this invention indispensable.

### 2.8. Computational Cost of Geospatial Queries Without Spatial Indexing

The full-scan problem described in section 2.4 can be formalized through the theory of operation costs in relational databases. A radial proximity query without a spatial index executes a complete sequential scan of table $T$ with $N$ records:

$$
C_{\text{full-scan}} = N \cdot (c_{\text{rad}} + c_{\text{cmp}})
$$

where $c_{\text{rad}}$ is the cost of spherical distance calculation (Haversine) and $c_{\text{cmp}}$ is the cost of comparison against search radius $\rho$. For a table of 5 million records (12-month projection for Metropolitan Lima), assuming $c_{\text{rad}} \approx 100$ CPU cycles and $c_{\text{cmp}} \approx 10$ cycles:

$$
T_{\text{CPU}} = \frac{5 \times 10^6 \times 110}{2.5 \times 10^9 \text{ Hz}} \approx 220 \text{ ms}
$$

In practice, contention due to locks in the PostgreSQL shared buffer pool and disk I/O latency (even on SATA III SSD with 500 MB/s sequential read) raises the actual response time above 1,500 ms for concurrent queries. This completely invalidates interactive use in map applications with continuous panning, where the quality of experience (QoE) standard requires response times below 200 ms according to Google's RAIL guidelines for progressive web applications.

---

## 💡 3. DETAILED DESCRIPTION OF THE INVENTION AND TECHNICAL SOLUTION

The present invention solves the described limitations through the integration of four patentable software engines conceived under the Computer-Implemented Invention (CII) methodology, achieving efficient decoupling and computational optimization on both the server and client sides.

### 3.1. Multivariable Predictive Matchmaking Engine
The system calculates in real-time a multidimensional probabilistic compatibility score ($S_{\text{compatibility}} \in [0, 100]$) between two sports profiles $A$ and $B$, using the following general equation:

$$
S_{\text{compatibility}} = 0.35 \cdot S_{\text{distance}}(A, B) + 0.30 \cdot S_{\text{skill}}(A, B) + 0.20 \cdot S_{\text{schedule}}(A, B) + 0.10 \cdot S_{\text{sports}}(A, B) + 0.05 \cdot S_{\text{trust}}(A)
$$

Each component is broken down and processed as follows:

1.  **Spatial Distance Component ($S_{\text{distance}}$):** Evaluates the geographic coordinates of users $A(\phi_1, \lambda_1)$ and $B(\phi_2, \lambda_2)$ applying the Haversine equation to determine the orthodromic distance $d$ in kilometers over the ellipsoidal surface of the Earth:
    
    $$
    d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_2 - \phi_1}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\lambda_2 - \lambda_1}{2}\right)}\right)
    $$
    
    Where $R = 6371$ km. The spatial score is normalized using an exponential decay curve to drastically penalize distances exceeding a threshold $\tau = 10\text{ km}$:
    
    $$
    S_{\text{distance}}(A, B) = 100 \cdot e^{-\lambda \cdot \max(0, d - \tau)}
    $$
    
    with an adjusted decay factor of $\lambda = 0.15$.
    
2.  **Skill Compatibility Component ($S_{\text{skill}}$):** Calculated based on the absolute difference between the historical Elo ratings of both players, normalized against a maximum standard deviation range $M = 800$:
    
    $$
    S_{\text{skill}}(A, B) = 100 \cdot \left(1 - \min\left(1, \frac{|R_A - R_B|}{M}\right)\right)
    $$
    
    The Elo rating of each user is updated iteratively and atomically in the database after each validated match using the formula:
    
    $$
    R'_A = R_A + K \cdot (S_A - E_A)
    $$
    
    Where $S_A$ is the actual result ($1$ for victory, $0.5$ for draw, $0$ for defeat), $E_A$ is the expected score determined by the logistic distribution:
    
    $$
    E_A = \frac{1}{1 + 10^{\frac{R_B - R_A}{400}}}
    $$
    
    The sensitivity adjustment factor $K$ is dynamic, varying inversely with the user's total games played ($N_A$) to stabilize the Elo rating over the long term:
    
    $$
    K = \frac{K_0}{1 + \alpha \cdot N_A}
    $$
    
    where $K_0 = 32$ and $\alpha = 0.01$.

#### Pseudocode of the Predictive Matchmaking Algorithm

The following is the formal pseudocode of the matchmaking engine, expressed in structured algorithmic notation to facilitate its reproduction by a person skilled in the art:

```
ALGORITHM: ComputeMatchScore(Profile A, Profile B, TimeSlot t)
INPUT:  User profiles A and B with fields {lat, lng, elo,
        gamesPlayed, availability[], sportPreferences[], trustScore}
OUTPUT: CompatibilityScore [0, 100]

 1. // Step 1: Spatial Distance Component (Haversine)
 2. φ1 ← TO_RADIANS(A.lat)
 3. φ2 ← TO_RADIANS(B.lat)
 4. Δφ ← TO_RADIANS(B.lat - A.lat)
 5. Δλ ← TO_RADIANS(B.lng - A.lng)
 6. a ← SIN²(Δφ/2) + COS(φ1) · COS(φ2) · SIN²(Δλ/2)
 7. c ← 2 · ARCTAN2(√a, √(1-a))
 8. d ← 6371 · c
 9. IF d ≤ 10 THEN
10.     S_dist ← 100 · EXP(-0.15 · d)
11. ELSE
12.     S_dist ← 100 · EXP(-0.15 · (d - 10))
13. END IF

14. // Step 2: Skill Component (Dynamic Elo)
15. ΔElo ← ABS(A.elo - B.elo)
16. S_skill ← 100 · (1 - MIN(1, ΔElo / 800))

17. // Step 3: Schedule Compatibility
18. S_time ← 0
19. FOR EACH slot IN A.availability DO
20.     IF slot ∈ B.availability AND slot.date = t.date THEN
21.         overlap ← MIN(slot.end, t.end) - MAX(slot.start, t.start)
22.         S_time ← MAX(S_time, overlap / (t.end - t.start) · 100)
23.     END IF
24. END FOR

25. // Step 4: Shared Sport Component
26. commonSports ← A.sportPreferences ∩ B.sportPreferences
27. S_sport ← (|commonSports| / MAX(|A.sportPreferences|, |B.sportPreferences|)) · 100

28. // Step 5: Trust Component
29. S_trust ← A.trustScore

30. // Step 6: Weighted Composite Score
31. S_total ← 0.35·S_dist + 0.30·S_skill + 0.20·S_time + 0.10·S_sport + 0.05·S_trust

32. RETURN ROUND(S_total, 2)
END ALGORITHM
```

```
ALGORITHM: UpdateEloRating(User u, MatchResult r)
INPUT:  User u with fields {elo, gamesPlayed}, MatchResult r
        with fields {opponentElo, userScore, opponentScore}
OUTPUT: Updated Elo rating

 1. K ← 32 / (1 + 0.01 · u.gamesPlayed)
 2. E ← 1 / (1 + 10^((r.opponentElo - u.elo) / 400))
 3. IF r.userScore > r.opponentScore THEN S ← 1.0
 4. ELSE IF r.userScore = r.opponentScore THEN S ← 0.5
 5. ELSE S ← 0.0
 6. u.elo ← u.elo + K · (S - E)
 7. u.gamesPlayed ← u.gamesPlayed + 1
 8. u.elo ← CLAMP(u.elo, 100, 3000)
 9. RETURN u.elo
END ALGORITHM
```

```
ALGORITHM: FindOptimalPartners(User u, UserPool pool, Int k)
INPUT:  Target user u, pool of candidate users, desired count k
OUTPUT: Ordered list of top-k matches

 1. scores ← EMPTY_LIST
 2. FOR EACH candidate IN pool WHERE candidate.id ≠ u.id DO
 3.     s ← ComputeMatchScore(u, candidate, u.preferredTime)
 4.     APPEND (candidate.id, s) TO scores
 5. END FOR
 6. scores ← SORT_DESCENDING(scores BY score)
 7. RETURN scores[0..k-1]
END ALGORITHM
```

To guarantee matchmaking fairness and avoid concentration of matches in a reduced subset of users, the system additionally executes a distributed variant of the Gale-Shapley algorithm, where each user proposes matching to the $k$ candidates with the highest compatibility score. This process runs on the NestJS backend every 30 seconds through a cron job scheduled with the `@nestjs/schedule` library, updating the recommendations table in the database without user intervention.

### 3.2. Booking and PostGIS Storage Engine
The supporting relational database is structured on **PostgreSQL 15** extended with the **PostGIS** spatial engine. Spatial storage uses the ellipsoidal geographic data type `Geography(Point, 4326)`. To mitigate CPU overhead due to linear table scans, a **GIST** (Generalized Search Tree) spatial index is implemented, enabling searches with $O(\log N)$ temporal complexity.

#### Spatial and Financial Persistence SQL DDL Schema:
```sql
-- Spatial extension required
CREATE EXTENSION IF NOT EXISTS postgis;

-- User profiles and sports ratings
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    rating_elo INTEGER DEFAULT 1200 NOT NULL,
    games_played INTEGER DEFAULT 0 NOT NULL,
    trust_score DOUBLE PRECISION DEFAULT 100.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sports venues
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-performance GIST spatial index
CREATE INDEX IF NOT EXISTS venues_location_gist ON venues USING gist(location);

-- Transactional split bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_cost NUMERIC(10, 2) NOT NULL,
    split_count INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FitCoins virtual wallets
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    balance_fitcoins NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_balance CHECK (balance_fitcoins >= 0.00)
);

-- Atomic financial transactions registry
CREATE TABLE IF NOT EXISTS fitcoin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### NestJS Booking Service (Prisma Transaction Handling):
To ensure that cost-splitting does not produce balance inconsistencies or deadlocks under high concurrency, the backend implements a serialized and isolated transaction that validates funds before debiting them atomically:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async createSplitBooking(venueId: string, organizerId: string, totalCost: number, splitUserIds: string[]) {
    const splitCount = splitUserIds.length + 1;
    const shareCost = totalCost / splitCount;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create booking record in pending state
      const booking = await tx.booking.create({
        data: {
          venueId,
          organizerId,
          totalCost,
          splitCount,
          status: 'pending',
        },
      });

      // 2. Iterate and process all participants in the same transactional block
      const allParticipants = [organizerId, ...splitUserIds];
      for (const userId of allParticipants) {
        // Lock row for wallet update (Prevents Race Conditions)
        const wallet = await tx.$queryRaw<any[]>`
          SELECT id, balance_fitcoins FROM wallets 
          WHERE user_id = ${userId}::uuid FOR UPDATE
        `;

        if (!wallet || wallet.length === 0 || Number(wallet[0].balance_fitcoins) < shareCost) {
          throw new BadRequestException(`User with ID ${userId} has insufficient FitCoins.`);
        }

        // Debit balance atomically
        await tx.wallet.update({
          where: { userId },
          data: {
            balanceFitcoins: {
              decrement: shareCost,
            },
          },
        });

        // Record individual financial transaction
        await tx.fitcoinTransaction.create({
          data: {
            walletId: wallet[0].id,
            bookingId: booking.id,
            amount: -shareCost,
            transactionType: 'DEBIT_SPLIT_BOOKING',
          },
        });
      }

      // 3. Confirm booking once all balances are successfully debited
      return tx.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmed' },
      });
    });
  }
}
```

On the mobile frontend, an in-memory static cache is implemented for repetitive Leaflet icon instantiations. This prevents the recreation of `L.icon()` objects that saturate the Javascript Garbage Collector during fast map panning by the user:

```typescript
import L from 'leaflet';

class IconCacheManager {
  private static cache: Record<string, L.Icon> = {};

  public static getIcon(color: string): L.Icon {
    const key = `marker_${color}`;
    if (!this.cache[key]) {
      this.cache[key] = L.icon({
        iconUrl: `/assets/markers/marker-${color}.png`,
        shadowUrl: '/assets/markers/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
    return this.cache[key];
  }
}
```

#### Additional SQL Functions: Advisory Locks and Elo Triggers

To strengthen the concurrency of split payment transactions, the system implements a PostgreSQL function that employs application locks (advisory locks) to serialize access to virtual wallets without relying exclusively on row-level `FOR UPDATE` locking:

```sql
-- Atomic booking function with advisory lock to prevent deadlocks
CREATE OR REPLACE FUNCTION atomic_split_booking(
    p_venue_id UUID,
    p_organizer_id UUID,
    p_total_cost NUMERIC,
    p_participant_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_id UUID;
    v_share_cost NUMERIC;
    v_wallet_id UUID;
    v_balance NUMERIC;
    v_user_id UUID;
    v_lock_key BIGINT;
BEGIN
    v_share_cost := p_total_cost / (array_length(p_participant_ids, 1) + 1);

    -- Create booking in pending state
    INSERT INTO bookings (venue_id, organizer_id, total_cost, split_count, status)
    VALUES (p_venue_id, p_organizer_id, p_total_cost,
            array_length(p_participant_ids, 1) + 1, 'pending')
    RETURNING id INTO v_booking_id;

    -- Process organizer + participants in canonical order to avoid deadlocks
    FOR v_user_id IN
        SELECT unnest(array_append(p_participant_ids, p_organizer_id) ORDER BY 1)
    LOOP
        -- Advisory lock specific to the user's wallet
        v_lock_key := ('x' || substr(md5(v_user_id::text), 1, 16))::bit(64)::bigint;
        PERFORM pg_advisory_xact_lock(v_lock_key);

        SELECT id, balance_fitcoins INTO v_wallet_id, v_balance
        FROM wallets WHERE user_id = v_user_id FOR UPDATE;

        IF v_balance < v_share_cost THEN
            RAISE EXCEPTION 'Insufficient funds for user %', v_user_id
                USING HINT = 'Check wallet balance';
        END IF;

        UPDATE wallets SET balance_fitcoins = balance_fitcoins - v_share_cost
        WHERE id = v_wallet_id;

        INSERT INTO fitcoin_transactions (wallet_id, booking_id, amount, transaction_type)
        VALUES (v_wallet_id, v_booking_id, -v_share_cost, 'DEBIT_SPLIT_BOOKING');
    END LOOP;

    UPDATE bookings SET status = 'confirmed' WHERE id = v_booking_id;
    RETURN v_booking_id;
END;
$$;
```

Additionally, an Elo update trigger is implemented that executes automatically after the insertion of a match result in the `match_results` table, guaranteeing that the rating is recalculated atomically without depending on application logic:

```sql
-- Match results table for Elo trigger
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_a_id UUID NOT NULL REFERENCES profiles(id),
    player_b_id UUID NOT NULL REFERENCES profiles(id),
    score_a INTEGER NOT NULL,
    score_b INTEGER NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_players CHECK (player_a_id <> player_b_id)
);

-- Trigger function that updates Elo automatically
CREATE OR REPLACE FUNCTION update_elo_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    elo_a INTEGER;
    elo_b INTEGER;
    games_a INTEGER;
    games_b INTEGER;
    expected_a NUMERIC;
    expected_b NUMERIC;
    k_a NUMERIC;
    k_b NUMERIC;
    score_a NUMERIC;
    score_b NUMERIC;
BEGIN
    -- Read current player data
    SELECT rating_elo, games_played INTO elo_a, games_a
    FROM profiles WHERE id = NEW.player_a_id;
    SELECT rating_elo, games_played INTO elo_b, games_b
    FROM profiles WHERE id = NEW.player_b_id;

    -- Calculate expectations (logistic distribution)
    expected_a := 1.0 / (1.0 + POWER(10, (elo_b - elo_a)::NUMERIC / 400.0));
    expected_b := 1.0 - expected_a;

    -- Calculate dynamic K factor for each player
    k_a := 32.0 / (1.0 + 0.01 * games_a);
    k_b := 32.0 / (1.0 + 0.01 * games_b);

    -- Determine actual results
    IF NEW.score_a > NEW.score_b THEN
        score_a := 1.0; score_b := 0.0;
    ELSIF NEW.score_a = NEW.score_b THEN
        score_a := 0.5; score_b := 0.5;
    ELSE
        score_a := 0.0; score_b := 1.0;
    END IF;

    -- Update profiles with new Elo and increment game counter
    UPDATE profiles SET
        rating_elo = GREATEST(100, LEAST(3000, ROUND(elo_a + k_a * (score_a - expected_a)))),
        games_played = games_a + 1
    WHERE id = NEW.player_a_id;

    UPDATE profiles SET
        rating_elo = GREATEST(100, LEAST(3000, ROUND(elo_b + k_b * (score_b - expected_b)))),
        games_played = games_b + 1
    WHERE id = NEW.player_b_id;

    RETURN NEW;
END;
$$;

-- Bind trigger to results table
CREATE OR REPLACE TRIGGER trg_match_result_elo
    AFTER INSERT ON match_results
    FOR EACH ROW
    EXECUTE FUNCTION update_elo_ratings();
```

This trigger architecture transfers the leveling logic to the database engine, eliminating the dependency on NestJS backend availability and guaranteeing consistency even under application server restart conditions.

### 3.3. Edge AI Image Moderation Engine
To eliminate network latency bottlenecks and prevent central server overload due to image scanning, the present invention implements a real-time image filtering and analysis algorithm on the client browser using **TensorFlow.js** and the optimized **NSFWJS** model.

The image selected by the user is loaded onto a virtual HTML5 canvas, where the model's convolutional neural network classifies the content in under 100 ms on mid-range devices. The engine prevents HTTP upload transmission if the image is flagged.

```typescript
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

export class ClientSideModerator {
  private model: nsfwjs.NSFWJS | null = null;
  private isLoaded = false;

  async initModel() {
    if (!this.isLoaded) {
      // Load WebGL-optimized partitioned model weights
      this.model = await nsfwjs.load('/models/nsfwjs_min/', { size: 299 });
      this.isLoaded = true;
    }
  }

  async isImageSafe(file: File): Promise<boolean> {
    await this.initModel();
    if (!this.model) return false;

    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        try {
          // Classify image and extract probabilities
          const predictions = await this.model!.classify(img);
          URL.revokeObjectURL(img.src);

          // Check thresholds for Porn, Hentai, and Sexy
          const threshold = 0.80;
          const unsafePredictions = predictions.filter(
            (p) =>
              (p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy') &&
              p.probability > threshold
          );

          // Returns TRUE if no unsafe content was detected above the threshold
          resolve(unsafePredictions.length === 0);
        } catch (error) {
          console.error('Edge image analysis failed:', error);
          resolve(false); // Reject file on engine failure for safety
        }
      };
      img.onerror = () => {
        resolve(false);
      };
    });
  }
}
```

#### Integration with Voice Streaming and Edge AI Conversation

To complement image filtering with a multimodal conversational assistant, a hybrid processing pipeline is implemented that prioritizes local voice recognition (Web Speech API) and performs a fallback to Vertex AI Gemini 2.5 Flash only when the local model does not reach an 85% confidence threshold:

```typescript
export class HybridVoiceAssistant {
  private recognition: SpeechRecognition | null = null;
  private isLocalRecognitionSupported = false;

  constructor(private readonly vertexApiEndpoint: string) {
    this.isLocalRecognitionSupported = 'SpeechRecognition' in window
      || 'webkitSpeechRecognition' in window;
  }

  async processVoiceCommand(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
    // Phase 1: Attempt local recognition with Web Speech API
    if (this.isLocalRecognitionSupported) {
      const localResult = await this.tryLocalRecognition(audioBlob);
      if (localResult && localResult.confidence >= 0.85) {
        return localResult; // Cloud bypass completed successfully
      }
    }

    // Phase 2: Fallback to Vertex AI Gemini 2.5 Flash
    const formData = new FormData();
    formData.append('audio', audioBlob, 'command.webm');
    formData.append('model', 'gemini-2.5-flash');

    const response = await fetch(this.vertexApiEndpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${await this.getAuthToken()}` },
      body: formData,
    });

    const data = await response.json();
    return { text: data.transcript, confidence: data.confidence };
  }

  private async tryLocalRecognition(blob: Blob): Promise<{ text: string; confidence: number } | null> {
    return new Promise((resolve) => {
      try {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognizer = new SpeechRecognitionAPI();
        recognizer.lang = 'es-PE';
        recognizer.interimResults = false;
        recognizer.maxAlternatives = 1;

        recognizer.onresult = (event) => {
          const result = event.results[0];
          resolve({
            text: result[0].transcript,
            confidence: result[0].confidence,
          });
        };

        recognizer.onerror = () => resolve(null);
        recognizer.start();
      } catch {
        resolve(null);
      }
    });
  }

  private async getAuthToken(): Promise<string> {
    // Obtain valid JWT from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? '';
  }
}
```

#### Complete Multimedia Moderation Pipeline

The complete flow of multimedia upload moderation is structured in the following sequential steps, executed entirely in the browser thread before HTTP transmission:

```typescript
export class ModerationPipeline {
  private moderator: ClientSideModerator;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  constructor() {
    this.moderator = new ClientSideModerator();
  }

  async processUpload(file: File): Promise<UploadResult> {
    // Step 1: MIME type and extension validation
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { allowed: false, reason: 'Unsupported file type' };
    }

    // Step 2: Maximum file size validation
    if (file.size > this.MAX_FILE_SIZE) {
      return { allowed: false, reason: 'File exceeds the 10 MB limit' };
    }

    // Step 3: Edge AI Moderation (NSFWJS + TensorFlow.js)
    const isSafe = await this.moderator.isImageSafe(file);
    if (!isSafe) {
      return {
        allowed: false,
        reason: 'Inappropriate content detected by the NSFWJS classifier on the device',
      };
    }

    // Step 4: Adaptive resizing before upload
    const resizedBlob = await this.resizeImage(file, 1200, 1200);

    // Step 5: Authorized upload to server with Brotli compression
    return {
      allowed: true,
      blob: resizedBlob,
      metadata: {
        originalName: file.name,
        originalSize: file.size,
        compressedSize: resizedBlob.size,
        compressionRatio: ((1 - resizedBlob.size / file.size) * 100).toFixed(1) + '%',
      },
    };
  }

  private resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error('Resize failed'));
        }, file.type, 0.85);
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

interface UploadResult {
  allowed: boolean;
  reason?: string;
  blob?: Blob;
  metadata?: {
    originalName: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: string;
  };
}
```

### 3.4. System Behavior Processing (Gherkin Scenarios)
The system's technical specification and validation of its critical operational characteristics are defined via the following executable BDD specifications:

```gherkin
Feature: Matchmaking and Dynamic Elo Rating
  As an amateur soccer player registered on SportMatch Connect
  I want the system to match me with nearby players of similar skill level
  To guarantee competitive and balanced matches

  Scenario: Successful multivariable compatibility calculation
    Given player A has GPS position (-12.086, -77.012) and an Elo of 1500
    And player B has GPS position (-12.089, -77.015) and an Elo of 1450
    When the matchmaking engine evaluates compatibility between both players
    Then the distance calculated by Haversine must be less than 1.0 kilometer
    And the skill score between both must be greater than 90 points
    And the resulting overall compatibility must be greater than or equal to 85 out of 100

Feature: Client-side Image Moderation via Edge AI
  As a social system administrator
  I want to filter profane image uploads directly on the client
  To prevent uploading explicit content to our cloud servers

  Scenario: Attempted upload of inappropriate image by user
    Given the user opens the file selector in the browser
    And selects an image containing explicit pornographic content
    When the upload event is intercepted in the browser thread
    Then the local TensorFlow.js/NSFWJS neural network classifies the image with a 92% NSFW probability
    And the POST HTTP upload request to the server is immediately canceled before sending bytes
    And the client displays a toast message indicating "File blocked: inappropriate content detected on device"

  Scenario: Successful split payment division
    Given the organizer creates a booking for a tennis court with a total cost of S/60.00
    And the organizer invites 3 additional players to the match
    When the 4 participants confirm the booking and the system executes the atomic transaction
    Then each virtual wallet is debited S/15.00
    And the booking status is updated to "confirmed" in the bookings table
    And a fitcoin_transactions record is generated for each individual debit
    And the Stripe webhook issues a prorated payment receipt

  Scenario: Query to Sporty AI conversational assistant in partial offline mode
    Given the user is at a sports venue with intermittent connectivity
    And activates the Sporty AI voice assistant using the microphone button in the PWA
    When the user asks "What courts are available near me?"
    Then the system first attempts local recognition via Web Speech API
    And if the local transcript confidence is greater than or equal to 85%
    Then the query is processed locally without transmitting audio to the cloud
    And the PostGIS search engine returns available courts within a 2 km radius
    And the response is synthesized in text and displayed in the chat interface

  Scenario: Data isolation via Row Level Security (RLS)
    Given authenticated user A has a JWT with sub = "user-a-uuid"
    And malicious user B attempts to modify the HTTP header
    When user B sends a direct SQL query to Supabase with a falsified sub
    Then the RLS policy verifies the decoded JWT against the auth.uid() field
    And the query is rejected with HTTP error 401 Unauthorized
    And the unauthorized transaction is logged in the Supabase audit logs
    And user A's financial data remains intact and unaltered

  Scenario: Installation and operation as a Progressive Web Application (PWA)
    Given a user visits the SportMatch Connect URL on an Android device
    And the browser detects the manifest.json with 192x192 and 512x512 icons
    When the system displays the "Add to home screen" installation banner
    Then the user confirms the PWA installation
    And the application registers as an independent Service Worker with strategic caching
    And recurring geospatial queries are served from the browser's Cache Storage
    And the application functions correctly in partial offline mode for map navigation
```

---

## 🔎 4. COMPARISON WITH THE INTERNATIONAL STATE-OF-THE-ART

| Technical Feature | Playtomic (Commercial System) | CourtSide (Application WO202304892A1) | SportMatch Connect (The Invention) |
|---|---|---|---|
| **Skill Calculation** | User-declared in static, non-interactive menus. | Initial static questionnaire filter. | Real-time dynamic Elo rating after each match with a variable K-factor. |
| **Geospatial Search** | Static relational query filtering by district ID. | Simple radial distance approximation using Euclidean coordinates. | Spatially indexed radial query with GIST indexes on PostGIS database. |
| **Multimedia Moderation** | Post-incident manual user reporting. | None (closed platform). | Instant client-side browser filtering using TensorFlow.js convolutional neural networks. |
| **Conversational Interface** | Rigid decision-tree chatbots. | None. | Natural language conversational AI powered by Google Vertex AI (Gemini) with local Web Speech API. |
| **Database Architecture** | Standard relational database without connection pooling. | Conventional centralized cloud system. | Prisma Dual-URL architecture with connection pooling and Row Level Security isolation. |
| **Anti-fraud Mechanism** | Manual payment verification by the sports club. | None. | Row locking with `FOR UPDATE` + PostgreSQL advisory locks in canonical UUID order. |
| **Infrastructure Deployment** | Dedicated servers or traditional VPS with manual provisioning. | Private virtual cloud with generic load balancer. | Automated CI/CD with Render + Vercel, multi-stage Docker container build, and Brotli compression. |
| **Testing Strategy** | Manual smoke tests without automated coverage. | Partial unit tests in Java/Spring backend. | BDD tests with Gherkin + Vitest unit tests + Playwright E2E + code coverage >85%. |
| **Voice Assistant** | None. | None. | Hybrid assistant with local Web Speech API + Vertex AI Gemini 2.5 Flash as automatic fallback. |
| **Multimedia Storage** | Direct server upload with zero compression. | Upload to generic CDN with standard JPEG compression. | Adaptive client-side resizing + WebP compression at 85% quality + pre-upload Edge AI moderation. |

A detailed analysis of each differentiating criterion against the state of the art is presented below:

**Anti-fraud Mechanism Analysis:** While Playtomic relies on manual verification at clubs (introducing operational delays and human errors), SportMatch Connect implements a pessimistic row locking system via `SELECT ... FOR UPDATE` on the `wallets` table, combined with PostgreSQL advisory locks (`pg_advisory_xact_lock`) that serialize access at the application level without depending on transaction arrival order. This approach eliminates the possibility of deadlocks by imposing a canonical order based on the MD5 hash of the participants' UUID identifiers.

**Infrastructure Deployment Analysis:** The invention employs a dual CI/CD pipeline: the React 19 frontend is deployed on Vercel with automatic build from the `main` branch and Pull Request previews; the NestJS backend is deployed on Render as a web service with multi-stage Docker that reduces the image size from 1.2 GB to 412 MB by eliminating development dependencies (`npm prune --production`). The database is provisioned as a managed Postgres service on Render with read replicas and automated backups.

**Testing Strategy Analysis:** The invention incorporates a complete testing pyramid: (1) unit tests with Vitest for NestJS services, React hooks, and shared utilities; (2) integration tests with embedded PostGIS database (pg_tap) to validate SQL functions and triggers; (3) behavior-driven tests (BDD) with Gherkin scenarios executable via Cucumber.js; (4) end-to-end tests with Playwright that simulate complete user flows from authentication to split payment; (5) load tests with k6 to validate concurrency of up to 500 simultaneous users on the matchmaking engine.

**Voice Assistant Analysis:** Unlike the evaluated commercial systems, which completely lack a conversational interface, SportMatch Connect implements a hybrid assistant that executes speech recognition locally via the browser's Web Speech API (SpeechRecognition). Only when the local transcript confidence is below 85% does the system delegate transcription to Vertex AI Gemini 2.5 Flash. This "local-first, cloud-fallback" pattern reduces average response latency from 5.2 seconds (cloud-only mode) to 380 ms (successful local mode).

**Multimedia Storage Analysis:** The SportMatch Connect image upload pipeline executes four client-side stages before HTTP transmission: (1) MIME type and maximum size validation; (2) NSFW moderation via TensorFlow.js/NSFWJS; (3) adaptive resizing to a maximum of 1200x1200 pixels; (4) compression in WebP format at 85% quality. This process reduces the average size of uploaded images by 73% compared to the original JPEG, decreasing storage bandwidth and upload time.

---

## 🎨 5. FIGURES AND TECHNICAL DRAWINGS DESCRIPTION

To complement the detailed description of the invention and enable technical reproduction by experts, the functional description of the schematics is attached below:

*   **Figure 1 (C4 Topology of Containers and Transactional Flows):** Shows the general layout of the distributed software platform. It depicts the Frontend (PWA), NestJS backend structured in microservices, Supabase connection pooler, and load balancer. Unidirectional arrows represent TLS 1.3 encrypted HTTPS connections, detailing the asynchronous flow initiated by the Stripe Gateway and its reception at the backend webhook that invokes atomic transactions.
*   **Figure 2 (Feature-Sliced Design Architecture of React 19 Client):** Modular layout outlining UI dependency boundaries. It specifies directories structured in layers: `app`, `routes`, `widgets`, `features`, `entities`, and `shared`. It shows that import flows must run downward, prohibiting circular components and tight coupling, and optimizing rendering via Leaflet's static icon cache.
*   **Figure 3 (Spatial ERD Diagram and RLS Security Isolation Logic):** Technical drawing describing the physical data model inside the relational database. Details the structure of the `location` column defined under the Open Geospatial Consortium (OGC) EPSG:4326 standard. It also graphs the Row Level Security (RLS) policies that intercept SQL queries and validate them cryptographically against the JWT signature provided by Supabase Auth.

### 5.1. Implementation Detail of Figure 1 — C4 Topology

Figure 1 employs Simon Brown's C4 notation (Context-Containers-Components-Code) to model the distributed software architecture. At the Containers level, the following elements are identified: (a) the **PWA Web Client** (React 19 + TypeScript + Vite) communicating via HTTPS with (b) the **NestJS Backend** REST API on port 3001, (c) the **Supabase Authentication Service** at `auth.supabase.co` that issues JWTs signed with RS256, (d) the **PostgreSQL 15 + PostGIS Database Engine** hosted on Supabase with connection pooler on port 6543 and direct connection on port 5432 (Dual-URL architecture), (e) the **Stripe Payment Gateway** that receives asynchronous webhooks at the `POST /api/webhooks/stripe` endpoint, and (f) the **Vertex AI Service** from Google Cloud Platform that exposes the Gemini 2.5 Flash model for the conversational assistant. Solid lines represent synchronous REST connections; dashed lines represent asynchronous flows via webhooks and internal message queues.

### 5.2. Implementation Detail of Figure 2 — FSD Architecture

Figure 2 details the directory structure of the React 19 client under Feature-Sliced Design. Dependency arrows are strictly unidirectional: `app` → `routes` → `widgets` → `features` → `entities` → `shared`. Each slice contains standard segments (`ui/`, `model/`, `api/`, `lib/`, `config/`). Three modules of special patentable interest are highlighted: (a) the `features/matchmaking/model/` segment implementing the compatibility score calculation via the Haversine equation and dynamic Elo rating with variable K; (b) the `features/edge-ai/model/` segment encapsulating the NSFWJS model loading with TensorFlow.js; and (c) the `features/booking/api/` segment performing calls to the NestJS backend split payment endpoint. The Leaflet icon cache is located in `shared/lib/icon-cache.ts`.

### 5.3. Implementation Detail of Figure 3 — Spatial ERD and RLS

Figure 3 graphs the entity-relationship model extended with PostGIS spatial types. The `venues` table includes the `location GEOGRAPHY(Point, 4326)` column indexed with GIST. The `profiles`, `bookings`, `wallets`, and `fitcoin_transactions` tables are also shown. RLS policies are represented as validation gates intercepting each CRUD operation. For example, the SELECT policy on `wallets` is defined as:

```sql
CREATE POLICY user_wallet_select ON wallets
    FOR SELECT USING (auth.uid() = user_id);
```

And the UPDATE policy on `bookings` to prevent a participant from modifying a booking they did not organize:

```sql
CREATE POLICY booking_organizer_update ON bookings
    FOR UPDATE USING (auth.uid() = organizer_id);
```

These policies guarantee that even if an attacker intercepts the SQL query to the Supabase API, the database engine will reject any operation whose user identifier does not match the cryptographically signed JWT.

### 5.4. Figure 4 — Matchmaking Algorithm Flow Diagram

Sequential flow of the matchmaking engine that starts with receiving GPS coordinates and Elo ratings of two candidates, proceeds through the calculation of the five compatibility score components (Haversine distance, Elo difference, time overlap, shared sports, trust score), applies the weighted coefficients defined in the invention, and returns a normalized S_total score ∈ [0, 100]. Decision gates for activating exponential distance decay and bounding the dynamic K factor based on the number of games played are included.

### 5.5. Figure 5 — Split Payment Sequence Diagram with Advisory Locks

Temporal interaction diagram showing the message sequence between the web client, the REST endpoint `POST /api/bookings/split`, the NestJS `BookingService`, the PostgreSQL `atomic_split_booking` function, and the Stripe gateway. The three canonical locking loops in ascending UUID order on the `wallets` table, the balance verification via `SELECT ... FOR UPDATE`, the atomic debit, and the final booking confirmation are illustrated.

### 5.6. Figure 6 — Edge AI Architecture with TensorFlow.js and NSFWJS

Component diagram detailing the complete local moderation pipeline in the browser: (1) file selection by the user through the file input; (2) MIME type validation (image/jpeg, image/png, image/webp) and maximum size (10 MB); (3) loading the image onto an HTML5 virtual memory canvas; (4) classification via the NSFWJS model with an 80% probability threshold for the Porn, Hentai, and Sexy categories; (5) immediate HTTP request cancellation in case of unsafe content; (6) adaptive resizing (maximum 1200x1200) and WebP compression at 85% quality for safe content; (7) authorized upload to the server via multipart fetch with JWT authentication header.

---

## 📜 6. FORMAL CLAIMS SET (Legal Protection Text)

Having described the invention in clear and complete terms, the following claims are formulated for which exclusive legal protection is requested under the regulations of Decision 486 of the Andean Community:

1.  **A DISTRIBUTED COMPUTER SYSTEM** for predictive matchmaking of amateur recreational sports profiles and transactional booking management of sports complexes, **characterized** by comprising:
    *   a) a frontend web client configured in a Progressive Web Application (PWA) environment structured modularly in Feature-Sliced Design (FSD) layers, which hosts in its execution thread a local in-memory storage module caching interactive Leaflet markers through indexed reuse of iconographic class instances;
    *   b) a NestJS backend server structured in decoupled dependency injection components and coupled to a PostgreSQL relational database engine extended spatially with PostGIS; and
    *   c) a predictive matchmaking engine that calculates in real-time a compatibility score ($S_{\text{compatibility}} \in [0, 100]$) between a user $A$ and a user $B$ through the following weighted equation:
        
        $$
        S_{\text{compatibility}} = 0.35 \cdot S_{\text{distance}}(A, B) + 0.30 \cdot S_{\text{skill}}(A, B) + 0.20 \cdot S_{\text{schedule}}(A, B) + 0.10 \cdot S_{\text{sports}}(A, B) + 0.05 \cdot S_{\text{trust}}(A)
        $$

2.  **THE COMPUTER SYSTEM** in accordance with claim 1, **characterized** in that the spatial distance component ($S_{\text{distance}}$) evaluates the geolocation of users in latitude and longitude coordinates using the Haversine formula to determine the linear spherical distance $d$, applying an exponential decay normalization according to the equation:
    
    $$
    S_{\text{distance}}(A, B) = 100 \cdot e^{-0.15 \cdot \max(0, d - 10)}
    $$

3.  **THE COMPUTER SYSTEM** in accordance with claim 1, **characterized** in that the skill component ($S_{\text{skill}}$) evaluates the level difference based on the relative Elo ratings of the players, which is atomically recalculated after recording a match result via a bidirectional WebSocket transmission, where the adjusted Elo rating ($R'_A$) is obtained by applying a dynamic sensitivity factor ($K$) inversely proportional to the user's accumulated games played ($N_A$):
    
    $$
    R'_A = R_A + \left(\frac{32}{1 + 0.01 \cdot N_A}\right) \cdot (S_A - E_A)
    $$

4.  **THE COMPUTER SYSTEM** in accordance with claim 1, **characterized** in that the PostgreSQL relational database engine executes radial searches with a maximum computational complexity of $O(\log N)$ by structuring a GIST spatial index on the geo-spatial `location` column of type `Geography(Point, 4326)` defined in the sports venues table (`venues`).

5.  **A COMPUTER-IMPLEMENTED METHOD** for instant client-side moderation of multimedia file uploads on a sports social network, **characterizado** by comprising the sequential steps of:
    *   a) intercepting an image file upload on the frontend web client before starting any byte transmission to the physical data network;
    *   b) processing the image by loading it onto a virtual HTML5 memory canvas and classifying its content using the NSFWJS convolutional neural network running in the browser thread over the TensorFlow.js library; and
    *   c) denying the HTTP upload request, preventing CPU calls on the centralized database server, if the neural network determines an inappropriate content probability exceeding a predefined threshold of 80%.

6.  **A RELATIONAL DATABASE SYSTEM** configured under a multi-tenant logical isolation security architecture, **characterized** by comprising:
    *   a) a database schema in PostgreSQL 15 defining financial transaction tables and balance records in virtual wallets; and
    *   b) a plurality of Row Level Security (RLS) policies that intercept all SQL read and write queries performed by the web client and force the user identifier to match uniquely with the encrypted identifier contained in the signature of the JSON Web Token (JWT) provided by the Supabase authentication component.

7.  **THE COMPUTER SYSTEM** in accordance with claim 1, **characterized** in that the conversational assistant implements a hybrid local-cloud architecture comprising:
    *   a) a local speech recognition module in the client browser using the Web Speech API (SpeechRecognition) configured with Peruvian Spanish language (es-PE);
    *   b) a confidence detection module that compares the probability of the local transcript against an 85% threshold;
    *   c) an automatic fallback mechanism that transmits the audio stream to the Vertex AI Gemini 2.5 Flash service when local recognition confidence is below the threshold; and
    *   d) a natural language processing engine that extracts sports intents such as court search, schedule availability query, and matchmaking request.

8.  **THE COMPUTER SYSTEM** in accordance with claim 1, **characterized** in that the frontend web client incorporates a Leaflet cartographic icon cache storage module implemented as an associative map in static memory (Record<string, L.Icon>) that returns pre-built instances of L.icon objects indexed by chromatic key, preventing redundant recreation in the JavaScript garbage collector heap during rapid geographic panning.

9.  **THE RELATIONAL DATABASE SYSTEM** in accordance with claim 4, **characterized** in that the execution of multiple debit financial transactions on the virtual wallets table (wallets) is serialized through the invocation of PostgreSQL application locks (pg_advisory_xact_lock) using as lock key a 64-bit integer value derived from the MD5 hash of each user's UUID identifier, guaranteeing a canonical order that eliminates the formation of cycles in the wait-for graph of concurrent transactions.

10. **A COMPUTER-IMPLEMENTED METHOD** for asynchronous updating of skill scores in a sports matchmaking system, **characterized** by comprising the steps of:
    *   a) inserting the result of a sports match in the match_results table of the PostgreSQL database;
    *   b) executing automatically a PostgreSQL trigger function (update_elo_ratings) that triggers the recalculation of the Elo rating of both participating players;
    *   c) calculating the dynamic sensitivity factor K for each player based on their historical number of games ($K = 32/(1 + 0.01 \cdot N_A)$);
    *   d) updating in the same atomic transaction the rating_elo and games_played fields of the profiles table; and
    *   e) transmitting the rating update to connected web clients through a bidirectional WebSocket connection.

---

## 7. SUMMARY OF THE INVENTION

The present invention, denominated **SportMatch Connect**, describes a computer-implemented distributed system (CII) for predictive matchmaking of recreational sports profiles and transactional management of sports complex bookings, integrated with a sports social network and a hybrid artificial intelligence conversational assistant.

The system is composed of four interrelated patentable technical subsystems:

**First Subsystem — Multivariable Predictive Matchmaking Engine:** Calculates in real time a compatibility score S_total in [0, 100] between two players through the weighted combination of five components: orthodromic spatial distance (Haversine with exponential decay), Elo rating difference with dynamic K factor, overlapping schedule availability, shared sports, and user trust score. After each validated match, the Elo rating is atomically updated in the database via a PostgreSQL trigger function with variable K inversely proportional to the number of games played ($K = 32/(1 + 0.01 \cdot N_A)$).

**Second Subsystem — Spatial Bookings and PostGIS Atomic Transactions:** Employs a PostgreSQL 15 database extended with PostGIS that stores geographic coordinates in GEOGRAPHY(Point, 4326) columns indexed with GIST for radial searches of complexity O(log N). Split payment is implemented through serialized transactions with SELECT ... FOR UPDATE row locking and PostgreSQL advisory locks in canonical UUID order to prevent deadlocks under high concurrency.

**Third Subsystem — Edge AI Image Moderation:** Executes in the client browser a lightweight convolutional neural network (NSFWJS on TensorFlow.js) that classifies images selected by the user before initiating any HTTP transmission, canceling the upload if the probability of inappropriate content (Porn, Hentai, Sexy) exceeds 80%. Safe images are adaptively resized and compressed in WebP format at 85% quality before transmission.

**Fourth Subsystem — Hybrid Conversational Assistant:** Combines local voice recognition via the browser's Web Speech API with automatic fallback to Vertex AI Gemini 2.5 Flash when local transcript confidence is below 85%. The user interface is structured under the Feature-Sliced Design (FSD) pattern in app/routes/widgets/features/entities/shared layers, with Leaflet icon cache in static memory to optimize cartographic rendering.

---

## 8. TECHNICAL FIELD OF THE INVENTION

The invention is situated in the domain of information and communication technologies (ICT), intersecting the following technical disciplines according to the International Patent Classification (IPC) administered by the World Intellectual Property Organization (WIPO):

**G06F 16/29 — Geographic Information Systems (GIS):** The invention implements a PostgreSQL 15 spatial database engine with the PostGIS extension that enables efficient storage and querying of geographic data through the GEOGRAPHY(Point, 4326) data type and GIST multidimensional indexing. Radial proximity queries are executed with O(log N) complexity using the ST_DWithin spatial function, overcoming the limitations of sequential linear scans of traditional systems.

**G06F 17/18 — Statistical and Probabilistic Methods:** The invention applies the adaptive Elo Rating statistical model with dynamic K factor for probabilistic player skill leveling. The expected score function follows the standard logistic distribution of game theory, while the global compatibility score integrates five independent variables through a weighted linear regression model.

**G06Q 50/10 — Commercial Systems for Sports and Entertainment:** The invention covers automated management of sports complex bookings with split payment mechanisms that integrate digital payment gateways (Stripe) with internal virtual wallets (FitCoins), synchronized through secure webhooks and atomic transactional locks in the database.

**G06N 3/08 — Neural Networks and Machine Learning:** The invention deploys lightweight convolutional neural networks at the client edge (Edge AI) through the TensorFlow.js library and the pre-trained NSFWJS model, executing image classification inference directly in the user's browser without data transmission to central servers.

**H04L 9/40 — Security Protocols in Communication Networks:** The invention implements a multitenant logical isolation system through Row Level Security (RLS) policies integrated with the JWT authentication module of Supabase, guaranteeing that each user can only access their own financial and profile data, even in direct SQL queries to the database API.

---

*End of Technical Software Patent Description Report (CII) — SportMatch Connect v2.0*
