const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

fs.writeFileSync(outputFile, '', 'utf8');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Generando Tesis Final en Inglés (TESIS_FINAL_SPORTMATCH_EN.md)...");

// ==========================================
// PRELIMINARIES
// ==========================================
append("# UNIVERSIDAD SAN IGNACIO DE LOYOLA");
append("## FACULTY OF ENGINEERING");
append("### DEPARTMENT OF SYSTEMS ENGINEERING\n");
append("---\n");
append("&nbsp;\n");
append("# SYSTEMS ENGINEERING THESIS");
append("## **SPORTMATCH CONNECT: AN INTEGRAL PLATFORM FOR SPORTS MATCHMAKING, SOCIAL NETWORKING, TOURNAMENT MANAGEMENT, AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE**\n");
append("&nbsp;\n");
append("**Final Project Report to obtain the Professional Title of Systems Engineer**\n");
append("**Course:** Final Degree Project III (PFC III)\n");
append("**Academic Term:** 2026-I\n");
append("&nbsp;\n");
append("**Authors:**\n");
append("| Full Name | Student Code | Project Role |");
append("|---|---|---|");
append("| Edwin Junia Flores | U202X0001 | Scrum Master / Lead Software Architect |");
append("| Erick Flores | U202X0002 | Backend / Security & Persistence Developer |");
append("| Juan Alonso Salvatierralonso | U202X0003 | Frontend / AI & UX Developer |");
append("| Matías Rodrigo | U202X0004 | Computer Vision / QA & SRE Developer |\n");
append("&nbsp;\n");
append("**Faculty Advisor:** Dr. Eng. USIL Academic Advisor\n");
append("**Lima, Peru — June 2026**\n");
append("---\n");

append("## STATEMENT OF AUTHENTICITY AND ETHICAL COMMITMENT\n");
append("We, the undersigned students of Systems Engineering at Universidad San Ignacio de Loyola (USIL), declare under oath and legal/academic responsibility that:\n");
append("1. The final project report titled **\"SPORTMATCH CONNECT: AN INTEGRAL PLATFORM FOR SPORTS MATCHMAKING, SOCIAL NETWORKING, TOURNAMENT MANAGEMENT, AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE\"** is an original and unpublished work, developed entirely by the authors under advisor supervision.");
append("2. All bibliographic sources, previous research, open-source libraries, frameworks, and cloud services have been properly cited following APA 7th edition guidelines.");
append("3. The source code, database models, architecture diagrams, automated Playwright/Vitest test suites, and financial data accurately represent the real software deployed on Vercel, Render, and Supabase during the 2026-I academic term.");
append("4. We assume full responsibility for the contents and release USIL from any third-party intellectual property claims.\n");
append("Signed in Lima, Peru, on June 27, 2026.\n");
append("| Author Signature | Student Details |");
append("|---|---|");
append("| ____________________________ | **Edwin Junia Flores** <br> Code: U202X0001 <br> DNI: 7XXXXXXX |");
append("| ____________________________ | **Erick Flores** <br> Code: U202X0002 <br> DNI: 7XXXXXXX |");
append("| ____________________________ | **Juan Alonso Salvatierralonso** <br> Code: U202X0003 <br> DNI: 7XXXXXXX |");
append("| ____________________________ | **Matías Rodrigo** <br> Code: U202X0004 <br> DNI: 7XXXXXXX |\n");
append("---\n");

append("## EXECUTIVE SUMMARY\n");
append("SportMatch Connect is a distributed, multi-tier technology platform designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports in Metropolitan Lima and Latin America. Developed across 16 weeks under the Scrum agile framework, the full-stack solution integrates a decoupled React 19 + TypeScript frontend structured with Feature-Sliced Design (FSD), a modular NestJS 11 backend with Prisma ORM, and a managed Supabase (PostgreSQL 15) data layer enforcing PostGIS spatial indexing and 78 Row Level Security (RLS) policies. The ecosystem comprises four core engines: a predictive matchmaking system driven by a weighted multivariable algorithm (Haversine distance, shared sport, Elo skill rating, and trust score), a sports social network featuring real-time feeds and team Squads, an interactive Leaflet map booking engine covering 433 venues in Lima, and a gamified economy based on FitCoins virtual currency integrated with Stripe payment processing (PEN). Furthermore, the system incorporates \"Sporty\", an AI conversational assistant powered by Google Vertex AI (Gemini 2.5 Flash), offering bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Edge AI and server Ensemble Model). Software quality was validated with 78 Vitest unit tests (100% pass rate), Playwright E2E suites, and a SonarQube Quality Gate PASSED report with zero critical vulnerabilities.\n");
append("**Keywords:** Sports matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n");
append("---\n");

append("## TABLE OF CONTENTS\n");
append("- PRELIMINARIES\n  - Title Page\n  - Statement of Authenticity\n  - Executive Summary / Abstract\n  - Table and Figure Indexes\n  - Introduction\n- CHAPTER I: GENERALITIES\n  - 1.1 Problem Statement\n  - 1.2 Justification\n  - 1.3 Problem & Objective Trees\n  - 1.4 Research Objectives\n- CHAPTER II: THEORETICAL FRAMEWORK\n  - 2.1 Background Research\n  - 2.2 Theoretical Foundations\n  - 2.3 Definition of Basic Terms\n- CHAPTER III: TECHNICAL AND BUSINESS METHODOLOGY\n  - 3.1 Design Thinking Framework\n  - 3.2 Lean Startup Methodology & MVP\n  - 3.3 Business Model Canvas (BMC)\n  - 3.4 Financial Feasibility & Monetization\n- CHAPTER IV: DEVELOPMENT, MONITORING AND CONTROL\n  - 4.1 Agile Management (Scrum/Kanban)\n  - 4.2 Architecture & C4 Model\n  - 4.3 DevOps & CI/CD Pipelines\n  - 4.4 QA & Playwright E2E Testing\n- CHAPTER V: RESULTS\n- CHAPTER VI: DISCUSSION OF RESULTS\n- CHAPTER VII & VIII: CONCLUSIONS AND RECOMMENDATIONS\n- RESEARCH ADMINISTRATION\n  - Budgets and Resources\n  - Financing\n  - Schedule (Gantt Chart)\n- REFERENCES\n- MANDATORY ANNEXES\n  - Annex A: Software Patent Draft\n  - Annex B: Scientific Paper Draft\n  - Annex C: Graduate Attributes Reflection (ICACIT/USIL)\n");
append("---\n");

append("## LIST OF TABLES\n");
append("| Table | Title |");
append("|---|---|");
append("| Table 01 | *Executive Summary of Technical Specifications* |");
append("| Table 02 | *Technical, Operational, and Economic Feasibility Assessment* |");
append("| Table 03 | *Comparative Matrix of Backend Frameworks* |");
append("| Table 04 | *Comparative Matrix of Database Engines* |");
append("| Table 05 | *Scrum Team Roles and Responsibilities* |");
append("| Table 06 | *Jira Cloud Product Backlog Epics Inventory* |");
append("| Table 07 | *Sprint 1 Backlog Planning* |");
append("| Table 08 | *Sprint 2 Backlog Planning* |");
append("| Table 09 | *Sprint 3 Backlog Planning* |");
append("| Table 10 | *Sprint 4 Backlog Planning* |");
append("| Table 11 | *Sprint 5 Backlog Planning* |");
append("| Table 12 | *Sprint 6 Backlog Planning* |");
append("| Table 13 | *Sprint 7 Backlog Planning* |");
append("| Table 14 | *Sprint 8 Backlog Planning* |");
append("| Table 15 | *Final Sprint Backlog Planning* |");
append("| Table 16 | *Evolutive Team Velocity Metrics (Story Points/week)* |");
append("| Table 17 | *Architecture Decision Records (ADRs) Log* |");
append("| Table 18 | *Data Dictionary — profiles table* |");
append("| Table 19 | *Data Dictionary — courts table* |");
append("| Table 20 | *Data Dictionary — bookings table* |");
append("| Table 21 | *Data Dictionary — wallet_transactions table* |");
append("| Table 22 | *Data Dictionary — posts table* |");
append("| Table 23 | *Data Dictionary — post_comments table* |");
append("| Table 24 | *Data Dictionary — squads table* |");
append("| Table 25 | *Data Dictionary — messages table* |");
append("| Table 26 | *Data Dictionary — connections table* |");
append("| Table 27 | *Data Dictionary — user_blocks table* |");
append("| Table 28 | *Optimized Spatial and Relational Indexes in PostgreSQL* |");
append("| Table 29 | *Prisma ORM Schema Migration History* |");
append("| Table 30 | *GitFlow Extended Branching Strategy* |");
append("| Table 31 | *OWASP Top 10 Risk Control Matrix* |");
append("| Table 32 | *Vitest Unit & Integration Testing Inventory* |");
append("| Table 33 | *Playwright E2E Validated Scenarios Matrix* |");
append("| Table 34 | *SonarQube Static Analysis Consolidated Results* |");
append("| Table 35 | *Core Web Vitals Telemetry Metrics* |");
append("| Table 36 | *Integrated 4-Month Development Retrospective* |");
append("| Table 37 | *Research Objectives Fulfillment Assessment* |");
append("| Table 38 | *Human Capital Budget* |");
append("| Table 39 | *Materials and Supplies Budget* |");
append("| Table 40 | *Equipment and Depreciation Budget* |");
append("| Table 41 | *Cloud Services & AI APIs Budget* |");
append("| Table 42 | *Consolidated Direct Costs and Contingencies* |");
append("| Table 43 | *Financing Structure* |");
append("| Table 44 | *Future Work Backlog (Phase 2)*\n");
append("---\n");

append("## LIST OF FIGURES\n");
append("| Figure | Title |");
append("|---|---|");
append("| Figure 01 | *Fragmentation of the amateur sports ecosystem in Peru* |");
append("| Figure 02 | *The four core functional pillars of SportMatch Connect* |");
append("| Figure 03 | *Problem Tree Diagram for amateur sports ecosystem* |");
append("| Figure 04 | *Objective Tree Diagram and system solution* |");
append("| Figure 05 | *Competitive positioning of sports platforms in LATAM* |");
append("| Figure 06 | *Feature-Sliced Design (FSD) architecture layers in React 19* |");
append("| Figure 07 | *Amateur Athlete Empathy Map (Design Thinking)* |");
append("| Figure 08 | *User Journey Map* |");
append("| Figure 09 | *Business Model Canvas (BMC) Canvas* |");
append("| Figure 10 | *3-Year Cash Flow Projection and Break-Even Analysis* |");
append("| Figure 11 | *Sprints Execution Schedule (Gantt Chart)* |");
append("| Figure 12 | *Historical Burndown Chart and Team Velocity* |");
append("| Figure 13 | *System UML Use Case Diagram* |");
append("| Figure 14 | *C4 Diagram — Level 1: System Context* |");
append("| Figure 15 | *C4 Diagram — Level 2: Solution Containers* |");
append("| Figure 16 | *Cloud Deployment Topology Diagram* |");
append("| Figure 17 | *Sequence Diagram — JWT Authentication Flow* |");
append("| Figure 18 | *Sequence Diagram — Predictive Matchmaking Flow* |");
append("| Figure 19 | *Sequence Diagram — Stripe Payment & Webhook Flow* |");
append("| Figure 20 | *Database Entity-Relationship Model (PostgreSQL 15)* |");
append("| Figure 21 | *GitFlow Extended Branching & Hotfix Cherry-Pick Flow* |");
append("| Figure 22 | *Continuous Integration Pipeline (GitHub Actions)* |");
append("| Figure 23 | *Defense in Depth Layered Security Model* |");
append("| Figure 24 | *Hybrid Moderation Flow (NSFWJS + Ensemble Model)* |");
append("| Figure 25 | *Testing Pyramid Applied to the Ecosystem* |");
append("| Figure 26 | *Playwright Execution Report in UI Mode* |");
append("| Figure 27 | *SonarQube Static Analysis Dashboard — Quality Gate PASSED* |");
append("| Figure 28 | *Structured Logging & Telemetry Interceptor Architecture* |");
append("| Figure 29 | *Core Web Vitals Metrics in Google Lighthouse (Mobile)* |");
append("| Figure 30 | *Phase 2 Strategic Evolution Roadmap*\n");
append("---\n");

append("## INTRODUCTION\n");
append("In modern society, physical activity and recreational sports represent vital factors for comprehensive health, non-communicable disease prevention, and community cohesion. However, in Latin American metropolises like Metropolitan Lima, the amateur sports ecosystem suffers from severe structural inefficiency caused by communication channel fragmentation, lack of venue booking transparency, and an absence of technological tools for skill-based player matching.\n");
append("To address these challenges, this engineering thesis documents the design, construction, testing, and deployment of **SportMatch Connect**, a distributed digital platform integrating multivariable predictive matchmaking, a geolocalized social network, an interactive PostGIS map booking engine across 433 sports complexes in Lima, a FitCoins virtual currency economy with Stripe payment processing, and an interactive AI assistant powered by Google Vertex AI (Gemini 2.5 Flash) with bidirectional voice capabilities...\n");
append("---\n");

// CHAPTER I
append("# CHAPTER I: GENERALITIES\n");
append("## 1.1 Problem Statement\n");
append("### 1.1.1 Macro Context (Global)");
append("Globally, physical inactivity represents one of the major silent pandemics of the modern era. According to the World Health Organization (WHO, 2020), over 28% of the global adult population fails to meet the recommended minimum of 150 minutes of weekly moderate physical activity. This leads to direct healthcare costs exceeding $54 billion annually. Paradoxically, while mobile consumer technology has digitized transport (Uber), hospitality (Airbnb), and food delivery (Rappi), recreational sports management remains unorganized in developing nations.\n");

append("### 1.1.2 Meso Context (Regional - Latin America)");
append("In Latin America, public sports infrastructure deficits and informal club disorganization exacerbate urban sedentary lifestyles. Cities like Bogotá, Santiago, Mexico City, and Lima share common friction points: recreational football, padel, basketball, and tennis matches are organized informally through isolated social circles without skill-level balancing or digital payment security.\n");

append("### 1.1.3 Micro Context (Local - Metropolitan Lima)");
append("In Metropolitan Lima, home to over 10 million residents, the Peruvian Ministry of Health (MINSA, 2024) indicates that 72% of adults engage in insufficient physical activity. Match coordination occurs through chaotic WhatsApp or Telegram groups where information is lost, skill levels are unbalanced, and individual organizers assume financial debt to reserve courts using mobile wallets (Yape or Plin). Independent venues operate with outdated phone or paper booking logs without digital real-time visibility.\n");

append("### 1.1.4 Research Questions");
append("**Main Research Question:**");
append("How can the design and implementation of a distributed digital platform integrating multivariable predictive matchmaking, geolocalized social networking, PostGIS GIS booking engines, and AI-assisted gamified economies optimize coordination, skill balancing, and continuity for amateur athletes in Metropolitan Lima?\n");

append("## 1.2 Project Justification\n");
append("### 1.2.1 Academic and Scientific Justification");
append("From a Systems Engineering perspective, this project contributes a practical reference implementation for modern architectural patterns. It demonstrates the feasibility of Feature-Sliced Design (FSD) in React 19 client applications and documents NestJS 11 modular monolith resilience with strict dependency injection. Furthermore, it sets precedents for edge AI foundation model integration (Vertex AI Gemini 2.5 Flash) and PostgreSQL 15 Row Level Security (RLS) enforcement.\n");

append("### 1.2.2 Social and Environmental Justification");
append("Socially, SportMatch Connect directly aligns with the United Nations Sustainable Development Goals (SDGs): SDG 3 (Good Health and Well-Being), SDG 9 (Industry, Innovation, and Infrastructure), and SDG 11 (Sustainable Cities and Communities).\n");

append("## 1.3 Problem and Objective Trees\n");
append("Figure 03");
append("*Problem Tree Diagram for amateur sports ecosystem*");
append("```mermaid\ngraph TD\n    EF1[Final Effect: High sedentary lifestyle and sports abandonment in Lima]\n    EF2[Effect 2: Unbalanced matches and player frustration]\n    EF3[Effect 3: Unpaid financial debt in booking reservations]\n    EF4[Effect 4: Underutilization of local sports complexes]\n    \n    PC[CENTRAL PROBLEM: Fragmentation and inefficiency in amateur sports coordination, booking, and community]\n    \n    C1[Cause 1: Informal WhatsApp groups without skill filtering]\n    C2[Cause 2: Dispersed booking tools without social connectivity]\n    C3[Cause 3: Lack of objective sports skill metrics]\n    C4[Cause 4: Manual informal payments and debt collection]\n    \n    EF1 --- EF2\n    EF1 --- EF3\n    EF1 --- EF4\n    EF2 --- PC\n    EF3 --- PC\n    EF4 --- PC\n    PC --- C1\n    PC --- C2\n    PC --- C3\n    PC --- C4\n```");
append("Note: Own elaboration.\n");

append("## 1.4 Research Objectives\n");
append("### 1.4.1 General Objective");
append("To design, develop, test, and deploy in production the SportMatch Connect distributed digital platform, integrating multivariable predictive matchmaking, sports social networking, PostGIS GIS booking, FitCoins gamified economy with Stripe payments, and interactive Google Vertex AI assistants under Scrum agile framework and industrial quality standards (CI/CD, TDD, OWASP Top 10) during term 2026-I.\n");
append("---\n");

console.log("English Preliminaries & Chapter I completed.");
