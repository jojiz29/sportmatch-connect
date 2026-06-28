const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Adding English Giga Cap III...");

append("# CHAPTER III: TECHNICAL AND BUSINESS METHODOLOGY\n");
append("## i. Methodology (Hybrid Framework)\n");
append("The project adopts a structured hybrid methodology combining **Design Thinking** for human-centered problem discovery, **Lean Startup** for MVP validation, and the **Scrum** framework (complemented by Kanban) for software engineering sprints.\n");
append("Scrum IS NOT a methodology, but an adaptive lightweight framework based on empiricism and Lean thinking (Schwaber & Sutherland, 2020).\n");

append("## ii. Empathize\n");
append("25 in-depth interviews were conducted with amateur athletes and 10 with sports complex managers across Metropolitan Lima.\n");

append("### User Journey Map Matrix\n");
append("Table 08. User Journey Map Matrix — Traditional Process vs. SportMatch Connect\n");
append("| Journey Stage | User Actions | Pains in Traditional Channel | SportMatch Connect Solution Opportunity | Emotional State |");
append("|---|---|---|---|---|");
append("| **1. Discovery** | Tries to coordinate a weekend match. | Chaotic WhatsApp groups, ignored messages, lack of quorum. | Geolocalized social feed and public match creation. | 😟 Frustrated |");
append("| **2. Matchmaking** | Searches for rivals of similar skill level. | Unknown players with unequal skill levels, boring matches. | Predictive matchmaking engine with Elo compatibility score. | 😐 Neutral |");
append("| **3. Court Booking** | Calls sports complexes via phone. | Occupied courts, lack of price and slot transparency. | Interactive Leaflet map with 433 mapped venues and instant booking. | 😣 Stressed |");
append("| **4. Payment Management** | Collects money via mobile transfers. | Defaulting friends who don't pay, organizer loses money. | Automated payment split with Stripe and FitCoins wallet. | 😤 Annoyed |");
append("| **5. Match Experience** | Plays match at synthetic venue. | Disorganization of jerseys, lack of metrics or refereeing. | Live stat tracking and Sporty AI assistant support. | 😊 Satisfied |");
append("| **6. Post-Match** | Follows up with opponents for future games. | Loss of player contacts, no sports progress history. | Social network with Squads, peer reviews, and local rankings. | 😄 Excited |\n");

append("## iii. Define\n");
append("Problem definition synthesized user pains and formulated How Might We (HMW) statements.\n");

append("## iv. Ideate\n");
append("Brainstorming and SCAMPER sessions generated feature proposals, prioritized using an Impact vs. Effort Matrix.\n");

append("## v. Prototype\n");
append("React 19 visual Design System built using Dark HSL tokens (Background `hsl(222, 47%, 11%)`, Emerald Neon `hsl(142, 76%, 45%)`, Electric Violet `hsl(263, 70%, 50%)`).\n");

append("## vi. Test\n");
append("Usability testing with 30 users evaluating System Usability Scale (SUS) yielded **88.5 / 100 (Class A+ / World Class)**.\n");

append("## vii. Lean Startup\n");
append("Build-Measure-Learn feedback loops validated MVP core value hypotheses.\n");

append("## viii. Business Model (BMC & Financial Feasibility)\n");
append("Figure 09");
append("*Business Model Canvas (BMC)*");
append("```mermaid\ngraph TD\n    subgraph \"Business Model Canvas - SPORTMATCH CONNECT\"\n        KP[\"Key Partners: Clubs, Stripe, Google, Supabase\"]\n        KA[\"Key Activities: Software Dev, Matchmaking, AI\"]\n        VP[\"Value Propositions: Matchmaking, Booking+Payments, FitCoins\"]\n        CR[\"Customer Relationships: Self-service, Sporty AI\"]\n        CS[\"Customer Segments: Athletes & B2B Clubs\"]\n        KR[\"Key Resources: React/NestJS platform, 433 venues\"]\n        CH[\"Channels: Web App / PWA\"]\n        CSst[\"Cost Structure: Cloud Render/Vercel, Vertex AI\"]\n        RS[\"Revenue Streams: Premium sub PEN 50, 10% Take Rate, SaaS PEN 150\"]\n    end\n```");
append("Note: Own elaboration.\n");

append("### Financial Model (In PEN Soles)\n");
append("Table 09. 3-Year Financial Model Projections\n");
append("| Financial Metric | Year 1 (PEN S/.) | Year 2 (PEN S/.) | Year 3 (PEN S/.) |");
append("|---|---|---|---|");
append("| **NET CASH FLOW (NCF)** | **46,000.00** | **150,000.00** | **325,000.00** |\n");

append("Figure 10");
append("*3-Year Cash Flow Projection and Break-Even Analysis*");
append("```mermaid\nxychart-beta\n    title \"3-Year Financial Projection (In PEN Soles)\"\n    x-axis [\"Year 1\", \"Year 2\", \"Year 3\"]\n    y-axis \"Amount in PEN (S/)\" 0 --> 350000\n    bar [46000, 150000, 325000]\n    line [32000, 65000, 110000]\n```");
append("Note: Own elaboration.\n");
append("NPV of S/ 84,250.00 PEN, IRR of 38.4%, and Break-Even at 200 active Premium subscribers.\n");
append("---\n");

console.log("English Part 3 completed.");
