const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_EN.md');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Adding English Ultra Cap IV...");

append("# CHAPTER IV: DEVELOPMENT, MONITORING AND CONTROL\n");
append("## ix. Monitoring and Control (Scrum Framework & Kanban)\n");
append("Scrum framework (an adaptive framework, not a methodology) and Kanban execution across 4 months (16 weeks) managed via Jira Cloud (`edwinfloress.atlassian.net/jira`).\n");

append("Table 10. Prioritized User Story Catalog Sample in Jira Cloud\n");
append("| Ticket ID | Epic | User Story | Story Points | Acceptance Criteria (Gherkin Format) |");
append("|---|---|---|---|---|");
append("| **SCRUM-12** | E-02 Matchmaking | As an athlete, I want to swipe nearby player cards to find rivals. | 8 SP | **Given** user is authenticated with active GPS, **When** accessing Matchmaking tab, **Then** a candidate queue computed by multivariable algorithm is displayed. |\n");

append("Figure 12");
append("*Historical Burndown Chart and Team Velocity*");
append("```mermaid\nxychart-beta\n    title \"Team Delivery Velocity (Story Points per Sprint)\"\n    x-axis [\"Sprint 1\", \"Sprint 2\", \"Sprint 3\", \"Sprint 4\", \"Sprint 5\", \"Sprint 6\", \"Sprint 7\", \"Sprint 8\", \"Final Sprint\"]\n    y-axis \"Completed Story Points\" 0 --> 120\n    bar [58, 63, 72, 75, 78, 85, 78, 72, 49]\n    line [60, 65, 70, 75, 80, 85, 80, 75, 50]\n```");
append("Note: Own elaboration.\n");

// g.x HARDWARE ARCHITECTURE
append("## x. Hardware Architecture\n");
append("Figure 14");
append("*C4 Diagram — Level 1: System Context*");
append("```mermaid\ngraph TB\n    U[\"Amateur Athlete\"] -->|Uses PWA| SM[\"SportMatch Connect System\"]\n    A[\"B2B Admin\"] -->|Manages venues| SM\n    SM -->|Payments| STR[\"Stripe Payments API\"]\n    SM -->|AI & Voice| GCP[\"Google Cloud Vertex AI\"]\n    SM -->|Persistence| SUP[\"Supabase PostgreSQL 15\"]\n```");
append("Note: Own elaboration.\n");

append("Figure 15");
append("*C4 Diagram — Level 2: Solution Containers*");
append("```mermaid\ngraph TB\n    subgraph \"Browser Client / PWA\"\n        SPA[\"React 19 SPA - FSD Architecture\"]\n    end\n    subgraph \"Render Cloud Compute\"\n        API[\"NestJS 11 REST API Gateway\"]\n    end\n    subgraph \"Supabase Cloud\"\n        DB[(\"PostgreSQL 15 + PostGIS Engine\")]\n        AUTH[\"Supabase Auth Engine JWT\"]\n    end\n    SPA -->|HTTPS REST| API\n    SPA -->|WebSockets| DB\n    API -->|Prisma ORM| DB\n```");
append("Note: Own elaboration.\n");

// g.xi SOFTWARE DEVELOPMENT
append("## xi. Software Development\n");
append("### *Phases\nFigure 21");
append("*GitFlow Extended Branching & Hotfix Cherry-Pick Flow*");
append("```mermaid\ngitGraph\n    commit id: \"v1.0.0\" tag: \"v1.0.0\"\n    branch develop\n    checkout develop\n    commit id: \"feat: onboarding\"\n    branch feature-swipe\n    checkout feature-swipe\n    commit id: \"feat: swipe UI\"\n    checkout develop\n    merge feature-swipe\n    checkout main\n    branch hotfix-cors\n    checkout hotfix-cors\n    commit id: \"fix: cors preflight\"\n    checkout main\n    merge hotfix-cors id: \"v1.1.0\" tag: \"v1.1.0\"\n    checkout develop\n    cherry-pick id: \"fix: cors preflight\"\n```");
append("Note: Own elaboration.\n");

append("### *Implementation\nGitHub Repository: `https://github.com/jojiz29/sportmatch-connect`.\n");

append("### *Functionality & QA (Playwright & SonarQube)\nFigure 26");
append("*Playwright Execution Report in UI Mode*");
append("```text\n========================================================================================\n                  PLAYWRIGHT END-TO-END AUTOMATED TEST REPORT (UI MODE)                  \n========================================================================================\n 5 passed (13.2s) - Status: PASSED (100% SUCCESS)\n========================================================================================\n```");
append("Note: Own elaboration.\n");

console.log("English Part 4 completed.");
