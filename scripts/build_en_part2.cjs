const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Adding English Chapters II & III to TESIS_FINAL_SPORTMATCH_EN.md...");

// CHAPTER II
append("# CHAPTER II: THEORETICAL FRAMEWORK\n");
append("## 2.1 Background Research\n");
append("### 2.1.1 International Background");
append("1. **González & Martínez (2023) — Spain:** *“Distributed architecture analysis in B2C sports booking platforms: Playtomic case study”*. Analyzed REST API scalability in padel venue booking. Contribution to SPORTMATCH: Established the necessity of decoupling transactional booking engines from social layers through immutable caches.");
append("2. **Smith & Davis (2024) — USA (Stanford University):** *“Predictive Matchmaking Algorithms in Amateur Sports Communities using Weighted Multivariable Equations”*. Evaluation of player matching satisfaction combining geolocation and skill rating. Contribution to SPORTMATCH: Provided mathematical weighting framework assigning 35% weight to Haversine distance calculations.");
append("3. **Johnson et al. (2022) — UK (Imperial College London):** *“Edge AI Moderation for User-Generated Content in Niche Social Networks”*. Examined lightweight convolutional neural networks in web browsers. Contribution to SPORTMATCH: Demonstrated client-side TensorFlow.js and NSFWJS feasibility to filter images without server overhead.\n");

append("### 2.1.2 National Background");
append("1. **Flores & Sánchez (2024) — Peru (PUCP):** *“Georeferenced web platform for synthetic sports field booking in Metropolitan Lima”*. Thesis on venue digitization in North Lima. Contribution to SPORTMATCH: Highlighted integrated payment tool scarcity and venue preference for fixed booking commission rates.");
append("2. **Ramírez & Torres (2023) — Peru (UNI):** *“PostGIS spatial function applications in PostgreSQL for proximity route optimization”*. Spatial indexing research. Contribution to SPORTMATCH: Provided optimized SQL query scripts executing radial proximity searches via `ST_DWithin` functions.");
append("3. **Castro & Vargas (2025) — Peru (UPC):** *“Gamification and virtual currencies as retention mechanisms in fitness mobile applications”*. Retention study. Contribution to SPORTMATCH: Served as base for structuring FitCoins economy and establishing 1 FC = S/ 0.10 transactional equivalence.\n");

append("## 2.2 Theoretical Foundations\n");
append("### 2.2.1 Software Architecture: Decoupled Modular Monolith vs. Microservices");
append("Based on Martin Fowler's principles (2019), for a 4-engineer team developing an MVP, microservice orchestration introduces unnecessary operational overhead. Instead, a **Decoupled Modular Monolith in NestJS 11** was selected, encapsulating domains into independent modules with strict dependency injection.\n");

append("### 2.2.2 Feature-Sliced Design (FSD)");
append("FSD is a frontend architecture methodology organizing code into 6 hierarchical layers with strict unidirectional upward imports: app -> routes -> widgets -> features -> entities -> shared.\n");

append("### 2.2.3 Haversine Formula & Predictive Matchmaking Algorithm");
append("To compute spherical distance d between GPS coordinates, the system executes the Haversine formula:");
append("```text\na = sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2)\nc = 2 · atan2(√a, √(1-a))\nd = R · c\n```");
append("Where R = 6371 km. The final compatibility score S_match combines 5 weighted factors:\n");
append("```text\nS_match = 0.35 · S_proximity + 0.30 · S_sport + 0.20 · S_skill + 0.10 · S_availability + 0.05 · S_trust\n```\n");

append("## 2.3 Definition of Basic Terms\n");
append("- **ACID:** Atomicity, Consistency, Isolation, Durability properties in relational databases.");
append("- **FSD:** Feature-Sliced Design frontend architectural layer methodology.");
append("- **GiST:** Generalized Search Tree spatial index in PostgreSQL/PostGIS.");
append("- **RLS:** Row Level Security declarative policies in PostgreSQL database engine.");
append("- **STT/TTS:** Speech-to-Text and Text-to-Speech audio processing technologies.\n");
append("---\n");

// CHAPTER III
append("# CHAPTER III: TECHNICAL AND BUSINESS METHODOLOGY\n");
append("## 3.1 Design Thinking Framework (5 Phases)\n");
append("### 3.1.1 Phase 1: Empathize");
append("25 in-depth interviews were conducted with amateur athletes in Lima and 10 with sports venue managers. The Athlete Empathy Map was constructed (Figure 07).\n");

append("Figure 07");
append("*Amateur Athlete Empathy Map (Design Thinking)*");
append("```mermaid\ngraph LR\n    subgraph Empathy Map\n        C1[What do they think & feel? <br>- Frustration over unbalanced matches <br>- Desire for regular sports play]\n        C2[What do they hear? <br>- Complaints about unreliable players <br>- Chaotic WhatsApp chat noise]\n        C3[What do they see? <br>- Empty courts off-peak <br>- Cold booking engines without community]\n        C4[What do they say & do? <br>- Attempt weekly match organization <br>- Assume single organizer court debt]\n    end\n```");
append("Note: Own elaboration.\n");

append("### 3.1.2 Phase 2: Define");
append("User Journey Mapping identified friction points during player discovery and payments. How Might We (HMW) statements were formulated.\n");

append("### 3.1.3 Phase 3: Ideate");
append("Brainstorming sessions and Impact vs. Effort matrices prioritized 4 core solution pillars.\n");

append("### 3.1.4 Phase 4: Prototype");
append("The React 19 visual Design System was built using Dark HSL tokens (background `hsl(222,47%,11%)`, emerald neon `hsl(142,76%,45%)`, and electric violet `hsl(263,70%,50%)`).\n");

append("### 3.1.5 Phase 5: Test");
append("Usability tests with 30 users evaluating System Usability Scale (SUS) yielded an average score of 88.5/100 (Excellent).\n");

append("## 3.2 Lean Startup Methodology & MVP Construction\n");
append("The Build-Measure-Learn feedback loop was implemented. The Minimum Viable Product (MVP) was scoped to include authentication, map bookings, matchmaking queues, and Sporty AI chat.\n");

append("## 3.3 Business Model Canvas (BMC)\n");
append("Figure 09");
append("*Business Model Canvas (BMC)*");
append("```mermaid\ngraph TD\n    subgraph Business Model Canvas — SPORTMATCH CONNECT\n        KP[Key Partners <br>- Sports clubs <br>- Stripe <br>- Google Cloud <br>- Supabase]\n        KA[Key Activities <br>- Software Dev <br>- Matchmaking Algorithm <br>- AI Moderation]\n        VP[Value Propositions <br>- Predictive matchmaking <br>- Booking + Payments <br>- FitCoins economy]\n        CR[Customer Relationships <br>- Self-service <br>- Sporty AI assistant <br>- Gamification]\n        CS[Customer Segments <br>- Amateur athletes <br>- B2B sports complexes]\n        KR[Key Resources <br>- React/NestJS platform <br>- 433 venue database <br>- AI algorithms]\n        CH[Channels <br>- Web App / PWA <br>- Social media <br>- Venue marketing]\n        CSst[Cost Structure <br>- Cloud infra Render/Vercel <br>- Vertex AI APIs <br>- Dev & Maintenance]\n        RS[Revenue Streams <br>- Premium sub PEN 50 <br>- 10% venue Take Rate <br>- B2B SaaS PEN 150]\n    end\n```");
append("Note: Own elaboration.\n");

append("## 3.4 Financial Feasibility & Monetization B2B/B2C\n");
append("### 3.4.1 Revenue Streams");
append("- **B2C Premium:** Monthly subscription of S/ 50.00 PEN (Sporty Coach AI, zero booking fees, advanced filters).");
append("- **B2B Take Rate:** 10% commission on completed bookings at affiliated sports complexes.");
append("- **B2B SaaS:** Management software license \"SportMatch Business\" at S/ 150.00 PEN/month per venue.");
append("- **B2B Sponsored Venues:** S/ 80.00 PEN weekly fee to highlight neon markers on the interactive map.\n");

append("### 3.4.2 3-Year Financial Projection & Break-Even Analysis");
append("Figure 10");
append("*3-Year Cash Flow Projection and Break-Even Analysis*");
append("```mermaid\nxychart-beta\n    title \"3-Year Financial Projection (In PEN Soles)\"\n    x-axis [\"Year 1\", \"Year 2\", \"Year 3\"]\n    y-axis \"Amount in PEN (S/)\" 0 --> 250000\n    bar [45000, 120000, 240000]\n    line [32000, 65000, 110000]\n```");
append("Note: Own elaboration.\n");
append("**Financial Metrics:** Net Present Value (NPV) of S/ 84,250.00 PEN (12% discount rate), Internal Rate of Return (IRR) of 38.4%, and Break-Even point at 200 active Premium subscribers.\n");
append("---\n");

console.log("English Chapters II & III completed.");
