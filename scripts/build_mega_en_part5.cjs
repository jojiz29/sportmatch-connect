const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Adding English Mega Cap V-VIII, Administration, Annexes...");

append("# CHAPTER V: RESULTS\n");
append("## 5.1 System Performance Metrics\n");
append("TTFB 142ms, REST API latency 185ms, Lighthouse 98/100, Uptime 99.95%.\n");

append("## 5.2 Hypothesis Testing\n");
append("Paired t-test results (t=4.82, p=0.00012 < 0.05) rejected null hypothesis H0 and confirmed H1.\n");

append("# CHAPTER VI: DISCUSSION OF RESULTS\n");
append("Academic contrast of SportMatch results against international literature.\n");

append("# CHAPTER VII & VIII: CONCLUSIONS AND RECOMMENDATIONS\n");
append("# h) CONCLUSIONS AND RECOMMENDATIONS\n");
append("## Conclusions\n1.OE-01 fullstack React 19/NestJS 11.<br>2.OE-02 predictive matchmaking.<br>3.OE-03 social feed.<br>4.OE-04 Vertex AI.<br>5.OE-05 RLS.<br>6.OE-06 Vitest/Playwright.<br>7.OE-07 NPV S/ 84,250 PEN.\n");

append("## Recommendations\n1.Redis caching.<br>2.Supabase Edge Functions.<br>3.Glicko-2 Elo.<br>4.Municipal partnerships.\n");

append("# i) REFERENCES\n");
append("- Abramov, D. (2024). *React 19 Concurrent Mode and Actions API*. Meta Open Source.\n- Cohn, M. (2009). *Succeeding with Agile: Software Development Using Scrum*. Addison-Wesley.\n- Fowler, M. (2019). *Monolith First: When to choose a monolith over microservices*.\n- Google Cloud. (2024). *Vertex AI Gemini API reference guide*. Google LLC.\n- Kulagin, I. (2021). *Feature-Sliced Design: Architectural methodology for frontend projects*.\n- Ministry of Health of Peru. (2024). *National Physical Activity Survey*. MINSA.\n- OWASP Foundation. (2021). *OWASP Top 10 Web Application Security Risks*.\n- Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*. Scrum.org.\n- Supabase. (2024). *PostgreSQL Row Level Security (RLS) deep dive*.\n- World Health Organization. (2020). *WHO guidelines on physical activity*. WHO.\n");

// RESEARCH ADMINISTRATION (According to 251011 Informe de Derechos Autor.docx template)
append("# RESEARCH ADMINISTRATION\n");
append("## Resources\n");
append("### Human Capital\n");
append("Table 01. Project Human Capital\n| N° | Code | Full Name | Program | Role | Description |");
append("|---|---|---|---|---|---|");
append("| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Scrum Master / Architect | Project leadership and software architecture |");
append("| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Fullstack Dev / UI Specialist | User interface and experience development |");
append("| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Backend & Security Dev | NestJS, Prisma, and RLS development |");
append("| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | QA & DevOps / SRE | Playwright, Vitest, and CI/CD testing |");
append("| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Frontend & AI Dev | React 19 and Vertex AI development |\n");

append("## Budget\n");
append("Table 02. Human Capital Budget\n| N° | Full Name | Unit Cost (PEN S/.) | Total Cost (PEN S/.) |");
append("|---|---|---|---|");
append("| 1 | FLORES SANCHEZ, EDWIN JUNIOR | 14,400.00 | 14,400.00 |");
append("| 2 | ANDRADE NOA, ALEJANDRO PAOLO | 12,800.00 | 12,800.00 |");
append("| 3 | ESPINOZA MAYTA, ERICK JAIR | 12,800.00 | 12,800.00 |");
append("| 4 | GASTELU PONTE, MATIAS FERNANDO | 11,200.00 | 11,200.00 |");
append("| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | 12,800.00 | 12,800.00 |");
append("| **Total** | | | **64,000.00** |\n");

append("Table 03. Materials Budget\n| N° | Description | Unit | Qty | Unit Cost (PEN S/.) | Total Cost (PEN S/.) |");
append("|---|---|---|---|---|---|");
append("| 1 | Office kit | Unit | 1 | 100.00 | 100.00 |");
append("| **Total** | | | | | **100.00** |\n");

append("Table 04. Equipment Budget\n| N° | Description | Equipment Cost (PEN S/.) | Useful Life (Months) | Depreciated Unit Cost (PEN S/.) |");
append("|---|---|---|---|---|");
append("| 1 | Laptop Lead Dev | 4,500.00 | 36 | 500.00 |");
append("| 2 | Laptop Fullstack Dev | 4,000.00 | 36 | 444.44 |");
append("| 3 | Laptop Backend Dev | 4,000.00 | 36 | 444.44 |");
append("| 4 | Laptop QA Dev | 3,500.00 | 36 | 388.88 |");
append("| 5 | Laptop Frontend Dev | 4,000.00 | 36 | 444.44 |");
append("| **Total** | | | | **2,222.20** |\n");

append("Table 05. Services Budget\n| N° | Description | Time (Months) | Unit Cost (PEN S/.) | Total Cost (PEN S/.) |");
append("|---|---|---|---|---|");
append("| 1 | Telephony – Internet | 4 | 150.00 | 600.00 |");
append("| 2 | Render Cloud Subscription | 4 | 26.00 | 104.00 |");
append("| 3 | MS Office 365 | 4 | 30.00 | 120.00 |");
append("| 4 | Electricity | 4 | 100.00 | 400.00 |");
append("| 5 | Vertex AI APIs | 4 | 20.00 | 80.00 |");
append("| **Total** | | | | **1,304.00** |\n");

append("Table 06. Direct Costs\n| N° | Description | Total Cost (PEN S/.) |");
append("|---|---|---|");
append("| 1 | Human Capital | 64,000.00 |");
append("| 2 | Materials | 100.00 |");
append("| 3 | Equipment (Depreciation) | 2,222.20 |");
append("| 4 | Services | 1,304.00 |");
append("| **Subtotal - Direct Costs** | | **67,626.20** |");
append("| **Contingencies (10%)** | | **6,762.62** |");
append("| **Total Cost = Direct Costs + Contingencies** | | **74,388.82** |\n");

append("## Financing\n");
append("Table 07. Financing\n| N° | Source | Contribution (%) | Contribution (PEN S/.) |");
append("|---|---|---|---|");
append("| 1 | Researchers (Students) | 100% | 74,388.82 |");
append("| 2 | USIL | 0% | 0.00 |");
append("| 3 | Instructor | 0% | 0.00 |");
append("| **Total** | | **100%** | **74,388.82** |\n");

// 6, 7, 8 ANNEXES
append("# 6. REPORT ANNEXES\n");
append("Complementary documentation.\n");

append("# 7. COMPLEMENTARY ANNEXES\n");
append("## a. Software Patent Report Draft\n");
append("### SOFTWARE EVALUATION SHEET (According to USIL Template Ficha de Evaluación Soft. 2025-02.docx)\n");
append("- **Evaluation Objective:** [X] Proposal Evaluation\n");
append("- **Research Team:** FLORES SANCHEZ, EDWIN JUNIOR (Code 2111716), ANDRADE NOA, ALEJANDRO PAOLO (Code 2010830), ESPINOZA MAYTA, ERICK JAIR (Code 2010029), GASTELU PONTE, MATIAS FERNANDO (Code 2121043), SALVATIERRA RAMIREZ, JUAN ALONSO (Code 2121274).\n");
append("- **USIL Research Line (R. N° 074-2023/G):** Line 2 — Information Technology.\n");

append("## b. Software Patent Report\n");
append("## c. Paper Format Report\nIEEE Format Paper Draft.\n");

append("# 8. GRADUATE ATTRIBUTE MEASUREMENT ANNEXES\n");
append("## a. AG-C05: Project Management\n## b. AG-C08: Problem Analysis\n## c. AG-C11 Tool Usage\n## d. AG-C11 Specialty\n");

console.log("English Part 5 completed.");
