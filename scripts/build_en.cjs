const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

fs.writeFileSync(outputFile, '', 'utf8');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Generating Final Thesis in English with exact USIL 2026 rubric structure...");

// PRELIMINARIES
append("# UNIVERSIDAD SAN IGNACIO DE LOYOLA");
append("## FACULTY OF ENGINEERING AND ARTIFICIAL INTELLIGENCE");
append("### DEPARTMENT OF INFORMATION SYSTEMS ENGINEERING / SOFTWARE ENGINEERING\n");
append("---\n");
append("&nbsp;\n");
append("# FINAL DEGREE PROJECT - ENGINEERING THESIS");
append("## **SPORTMATCH CONNECT: AN INTEGRAL PLATFORM FOR SPORTS MATCHMAKING, SOCIAL NETWORKING, TOURNAMENT MANAGEMENT, AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE**\n");
append("&nbsp;\n");
append("**Course:** Final Degree Project III (PFC III)\n");
append("**Term:** 2026-I\n");
append("**Instructor:** Kenny Disney Neira Neira\n");
append("**Section:** FC-SMVISI-SP10A01T\n");
append("&nbsp;\n");
append("**Team Members (Team ##):**\n");
append("| Full Name | Student Code | % Participation | Project Role |");
append("|---|---|---|---|");
append("| Edwin Junia Flores | U202X0001 | 100% | Scrum Master / Lead Software Architect |");
append("| Erick Flores | U202X0002 | 100% | Backend / Security & Persistence Developer |");
append("| Juan Alonso Salvatierralonso | U202X0003 | 100% | Frontend / AI & UX Developer |");
append("| Matías Rodrigo | U202X0004 | 100% | Computer Vision / QA & SRE Developer |\n");
append("&nbsp;\n");
append("**Lima, Peru — 2026-01**\n");
append("---\n");

append("## STATEMENT OF AUTHENTICITY AND ETHICAL COMMITMENT\n");
append("We, the undersigned students of the Faculty of Engineering and Artificial Intelligence at Universidad San Ignacio de Loyola (USIL), declare under oath that:\n");
append("1. The final project report titled **\"SPORTMATCH CONNECT: AN INTEGRAL PLATFORM FOR SPORTS MATCHMAKING, SOCIAL NETWORKING, TOURNAMENT MANAGEMENT, AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE\"** is an original work developed under advisor supervision.");
append("2. All bibliographic sources, research, and open-source libraries have been cited following APA 7th edition standards.");
append("3. The source code, database models, architecture diagrams, and test suites accurately represent the software deployed on Vercel, Render, and Supabase.");
append("4. We assume full responsibility for the contents and release USIL from third-party claims.\n");
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
append("- a) Title Page\n- b) Table of Contents\n- c) Introduction\n- d) Executive Summary\n- e) Problem Statement\n  - Research\n  - Problem Tree\n- f) Objectives\n  - Objective Tree\n  - General Objective and Specific Objectives\n- g) Development\n  - i. Methodology (Hybrid)\n  - ii. Empathize\n  - iii. Define\n  - iv. Ideate\n  - v. Prototype\n  - vi. Test\n  - vii. Lean Startup\n  - viii. Business Model (BMC & Financial Feasibility)\n  - ix. Monitoring and Control (Scrum & Kanban)\n  - x. Hardware Architecture\n  - xi. Software Development (Phases, Implementation, Functionality)\n- h) Conclusions and Recommendations\n- i) References\n- 6. Report Annexes\n- 7. Complementary Annexes (Software Patent, Patent Report, Paper)\n- 8. Graduate Attribute Measurement Annexes (AG-C05, AG-C08, AG-C11 Tool Usage, AG-C11 Specialty)\n");
append("---\n");

append("## INTRODUCTION\n");
append("In modern society, physical activity and recreational sports represent vital factors for comprehensive health, non-communicable disease prevention, and community cohesion. However, in Latin American metropolises like Metropolitan Lima, the amateur sports ecosystem suffers from severe structural inefficiency caused by communication channel fragmentation, lack of venue booking transparency, and an absence of technological tools for skill-based player matching...\n");
append("---\n");

console.log("English Preliminaries completed.");
