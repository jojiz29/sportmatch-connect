const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Adding English Sections e, f, g (i-viii) to TESIS_FINAL_SPORTMATCH_EN.md...");

// SECTION E: PROBLEM STATEMENT
append("# e) PROBLEM STATEMENT\n");
append("## Research\n");
append("### Macro Context (Global)");
append("Globally, physical inactivity represents one of the major silent pandemics of the modern era. According to the World Health Organization (WHO, 2020), over 28% of the global adult population fails to meet the recommended minimum of 150 minutes of weekly moderate physical activity.\n");

append("### Meso Context (Regional - Latin America)");
append("In Latin America, public sports infrastructure deficits and informal club disorganization exacerbate urban sedentary lifestyles in cities like Bogotá, Santiago, Mexico City, and Lima.\n");

append("### Micro Context (Local - Metropolitan Lima)");
append("In Metropolitan Lima, MINSA (2024) indicates that 72% of adults engage in insufficient physical activity. Match coordination occurs through chaotic WhatsApp groups without skill level balancing.\n");

append("### Main Research Question");
append("How can the design and implementation of a distributed digital platform integrating multivariable predictive matchmaking, geolocalized social networking, PostGIS GIS booking engines, and AI-assisted gamified economies optimize coordination, skill balancing, and continuity for amateur athletes in Metropolitan Lima?\n");

append("## Problem Tree\n");
append("Figure 03");
append("*Problem Tree Diagram for amateur sports ecosystem*");
append("```mermaid\ngraph TD\n    EF1[Final Effect: High sedentary lifestyle and sports abandonment in Lima]\n    EF2[Effect 2: Unbalanced matches and player frustration]\n    EF3[Effect 3: Unpaid financial debt in booking reservations]\n    EF4[Effect 4: Underutilization of local sports complexes]\n    \n    PC[CENTRAL PROBLEM: Fragmentation and inefficiency in amateur sports coordination, booking, and community]\n    \n    C1[Cause 1: Informal WhatsApp groups without skill filtering]\n    C2[Cause 2: Dispersed booking tools without social connectivity]\n    C3[Cause 3: Lack of objective sports skill metrics]\n    C4[Cause 4: Manual informal payments and debt collection]\n    \n    EF1 --- EF2\n    EF1 --- EF3\n    EF1 --- EF4\n    EF2 --- PC\n    EF3 --- PC\n    EF4 --- PC\n    PC --- C1\n    PC --- C2\n    PC --- C3\n    PC --- C4\n```");
append("Note: Own elaboration.\n");

// SECTION F: OBJECTIVES
append("# f) OBJECTIVES\n");
append("## Objective Tree\n");
append("Figure 04");
append("*Objective Tree Diagram and system solution*");
append("```mermaid\ngraph BT\n    FIN1[Final Goal: Increased physical activity and wellness in Lima]\n    FIN2[Goal 2: Balanced and competitive sports matches]\n    FIN3[Goal 3: Transparent transactions and zero booking debt]\n    FIN4[Goal 4: Maximized sports complex occupancy rates]\n    \n    OBJ[GENERAL OBJECTIVE: Develop and deploy SportMatch Connect platform]\n    \n    M1[Means 1: Social network & realtime chat with AI moderation]\n    M2[Means 2: Interactive map booking engine with PostGIS]\n    M3[Means 3: Predictive matchmaking algorithm with Elo score]\n    M4[Means 4: Stripe payment gateway & FitCoins integration]\n    \n    M1 --> OBJ\n    M2 --> OBJ\n    M3 --> OBJ\n    M4 --> OBJ\n    OBJ --> FIN1\n    OBJ --> FIN2\n    OBJ --> FIN3\n    OBJ --> FIN4\n```");
append("Note: Own elaboration.\n");

append("## General Objective and Specific Objectives\n");
append("### General Objective");
append("To design, develop, test, and deploy in production the SportMatch Connect distributed digital platform, integrating multivariable predictive matchmaking, sports social networking, PostGIS GIS booking, FitCoins gamified economy with Stripe payments, and interactive Google Vertex AI assistants under Scrum agile framework and industrial quality standards during term 2026-I.\n");

append("### Specific Objectives");
append("- **OE-01:** Build a decoupled full-stack React 19 FSD / NestJS 11 modular monolith architecture with Prisma ORM.");
append("- **OE-02:** Develop a predictive matchmaking engine driven by a weighted multivariable algorithm.");
append("- **OE-03:** Implement sports social feeds, comments, reactions, Squads, and WebSocket messaging.");
append("- **OE-04:** Integrate Sporty AI conversational assistant with Google Vertex AI (Gemini 2.5 Flash) and STT/TTS.");
append("- **OE-05:** Apply a Defense in Depth security model with 78 PostgreSQL RLS policies.");
append("- **OE-06:** Certify quality reaching 78 Vitest unit tests (100% PASS), Playwright E2E, and SonarQube Quality Gate PASSED.");
append("- **OE-07:** Formulate and validate hybrid B2C/B2B business models and 3-year financial feasibility.\n");

// SECTION G: DEVELOPMENT
append("# g) DEVELOPMENT\n");
append("## i. Methodology (Hybrid)\n");
append("The project adopts a hybrid methodology combining **Design Thinking** for problem discovery, **Lean Startup** for MVP validation, and **Scrum/Kanban** agile management for software engineering sprints.\n");

append("## ii. Empathize\n");
append("25 interviews were conducted with athletes and 10 with venue managers. The Empathy Map was constructed (Figure 07).\n");
append("Figure 07");
append("*Amateur Athlete Empathy Map (Design Thinking)*");
append("```mermaid\ngraph LR\n    subgraph Empathy Map\n        C1[What do they think & feel? <br>- Frustration over unbalanced matches]\n        C2[What do they hear? <br>- Complaints and WhatsApp informal noise]\n        C3[What do they see? <br>- Empty courts and chaotic bookings]\n        C4[What do they say & do? <br>- Assume court rental debts]\n    end\n```");
append("Note: Own elaboration.\n");

append("## iii. Define\n");
append("User Journey Mapping identified friction points during player discovery and payments.\n");

append("## iv. Ideate\n");
append("Brainstorming sessions prioritized 4 core solution pillars: Matchmaking, Social Network, Bookings, Gamified Economy.\n");

append("## v. Prototype\n");
append("The React 19 visual Design System was built using Dark HSL tokens (background `hsl(222,47%,11%)`, emerald neon `hsl(142,76%,45%)`, electric violet `hsl(263,70%,50%)`).\n");

append("## vi. Test\n");
append("Usability tests with 30 users evaluating System Usability Scale (SUS) yielded 88.5/100.\n");

append("## vii. Lean Startup\n");
append("The Build-Measure-Learn feedback loop was implemented. The Minimum Viable Product (MVP) was scoped.\n");

append("## viii. Business Model (BMC & Financial Feasibility)\n");
append("Figure 09");
append("*Business Model Canvas (BMC)*");
append("```mermaid\ngraph TD\n    subgraph Business Model Canvas — SPORTMATCH CONNECT\n        KP[Key Partners <br>- Clubs, Stripe, Google, Supabase]\n        KA[Key Activities <br>- Software Dev, Matchmaking, AI]\n        VP[Value Propositions <br>- Matchmaking, Booking+Payments, FitCoins]\n        CR[Customer Relationships <br>- Self-service, Sporty AI]\n        CS[Customer Segments <br>- Athletes & B2B Clubs]\n        KR[Key Resources <br>- React/NestJS platform, 433 venues]\n        CH[Channels <br>- Web App / PWA]\n        CSst[Cost Structure <br>- Cloud Render/Vercel, Vertex AI]\n        RS[Revenue Streams <br>- Premium sub PEN 50, 10% Take Rate, SaaS PEN 150]\n    end\n```");
append("Note: Own elaboration.\n");

append("### Financial Feasibility");
append("Figure 10");
append("*3-Year Cash Flow Projection and Break-Even Analysis*");
append("```mermaid\nxychart-beta\n    title \"3-Year Financial Projection (In PEN Soles)\"\n    x-axis [\"Year 1\", \"Year 2\", \"Year 3\"]\n    y-axis \"Amount in PEN (S/)\" 0 --> 250000\n    bar [45000, 120000, 240000]\n    line [32000, 65000, 110000]\n```");
append("Note: Own elaboration.\n");
append("NPV of S/ 84,250.00 PEN (12% discount rate), IRR of 38.4%, and Break-Even at 200 active Premium subscribers.\n");
append("---\n");

console.log("English Sections e, f, g (i-viii) completed.");
