# GRADUATE ATTRIBUTES MEASUREMENT DOCUMENT (AG)

## **SPORTMATCH CONNECT: INTEGRAL PLATFORM FOR SPORTS MATCHMAKING AND SOCIAL NETWORKING WITH ARTIFICIAL INTELLIGENCE**

**Formative and Summative Evaluation of Graduate Attributes ICACIT / USIL / ABET**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering and Artificial Intelligence**  
**Programs:** Information Systems Engineering / Software Engineering  
**Course:** Final Degree Project III (FC-PREISF10B01N)  
**Instructor:** Prof. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## EVALUATED TEAM MEMBERS SUMMARY & GLOBAL ICACIT MATRIX
| N° | Code | Student | Program | Measured Attributes | Global GPA | Achievement Level |
|---|---|---|---|---|:---:|:---:|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.95 / 4.00** | Outstanding |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.88 / 4.00** | Outstanding |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.85 / 4.00** | Outstanding |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.92 / 4.00** | Outstanding |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.87 / 4.00** | Outstanding |

---

## 1. GRADUATE ATTRIBUTE AG-C05: PROJECT MANAGEMENT

### A. Attribute Description and Application in Project Execution
The attribute **AG-C05 (Project Management)** evaluates the student's ability to plan, organize, direct, and control engineering projects applying management principles, agile frameworks, and risk mitigation strategies in multidisciplinary environments.

In SportMatch Connect, project execution strictly followed the **Scrum** framework across 16 continuous weeks (March to June 2026). The team utilized Jira Cloud (`edwinfloress.atlassian.net/jira`) to manage a Product Backlog consisting of 8 epics and over 80 user stories estimated in Story Points.

### B. ICACIT Quantitative Evaluation Matrix (Scale 1 to 4)
*(Legend: 1=Initial, 2=In Progress, 3=Achieved, 4=Outstanding)*

| Student | Criterion 5.1: Backlog Planning | Criterion 5.2: Risk Management | Criterion 5.3: Agile Metrics & Velocity | AG-C05 Average | Achievement Level |
|---|:---:|:---:|:---:|:---:|:---:|
| FLORES SANCHEZ, EDWIN JUNIOR | 4.0 | 4.0 | 4.0 | **4.00** | Outstanding |
| ANDRADE NOA, ALEJANDRO PAOLO | 4.0 | 3.5 | 4.0 | **3.83** | Outstanding |
| ESPINOZA MAYTA, ERICK JAIR | 3.5 | 4.0 | 3.5 | **3.67** | Outstanding |
| GASTELU PONTE, MATIAS FERNANDO | 4.0 | 4.0 | 4.0 | **4.00** | Outstanding |
| SALVATIERRA RAMIREZ, JUAN ALONSO | 3.5 | 3.5 | 4.0 | **3.67** | Outstanding |

### C. Auditable Jira Cloud Evidence & Sprint Metrics
- **Sprint Burndown & Velocity:** Average team velocity reached 72 Story Points per bi-weekly Sprint.
- **Impediment Management:** Resolution of Supabase PostGIS integration blocks through reconfigured Prisma migration scripts.

```mermaid
xychart-beta
    title "Historical Delivery Velocity in Jira Cloud (Story Points per Sprint)"
    x-axis ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5", "Sprint 6", "Sprint 7", "Sprint 8"]
    y-axis "Completed Story Points" 0 --> 100
    bar [58, 63, 72, 75, 78, 85, 78, 72]
    line [60, 65, 70, 75, 80, 85, 80, 75]
```
*Figure 01: Historical team velocity chart in Jira. Own elaboration.*

### D. Individual Reflections on AG-C05 Attribute (Vera de la Cruz Model)

#### 1. FLORES SANCHEZ, EDWIN JUNIOR (Scrum Master / Lead Architect)
> *"As Scrum Master, applying AG-C05 enabled me to lead backlog prioritization in Jira Cloud and facilitate agile ceremonies (Daily, Planning, Review, Retrospective). Managing software projects in the AI era demands flexibility to mitigate technical risks rapidly while keeping the engineering team focused on continuous user value delivery."*

#### 2. ANDRADE NOA, ALEJANDRO PAOLO (Fullstack Dev / UI Specialist)
> *"My participation under AG-C05 focused on accurate Story Point estimation for React 19 UI user stories. I understood the paramount importance of decomposing complex software epics into atomic tasks to prevent development sprint bottlenecks."*

#### 3. ESPINOZA MAYTA, ERICK JAIR (Backend & Security Dev)
> *"Project management taught me to coordinate NestJS API delivery in sync with frontend requirements. Managing implementation time for 78 Supabase RLS security policies was key to achieving project milestone target dates."*

#### 4. GASTELU PONTE, MATIAS FERNANDO (QA & DevOps Engineer / SRE)
> *"From a QA and DevOps perspective, AG-C05 allowed me to integrate Playwright and Vitest automated test suites into the team Definition of Done, ensuring every software increment satisfied quality standards before deployment."*

#### 5. SALVATIERRA RAMIREZ, JUAN ALONSO (Frontend & AI Specialist)
> *"Applying AG-C05 in Google Vertex AI integration helped me manage cloud compute resources and API consumption quotas for Gemini 2.5 Flash, ensuring voice and conversational AI features were delivered on schedule."*

---

## 2. GRADUATE ATTRIBUTE AG-C08: PROBLEM ANALYSIS & UN SDGs

### A. Alignment with UN Sustainable Development Goals
1. **SDG 3 — Good Health and Well-being:** Addresses urban sedentary lifestyles in Metropolitan Lima by increasing weekly match frequency from 1.2 to 2.8 games per active user.
2. **SDG 9 — Industry, Innovation, and Infrastructure:** Fosters technological innovation through conversational Edge AI integration and optimizes local sports complex infrastructure utilization.
3. **SDG 11 — Sustainable Cities and Communities:** Promotes healthy social interaction and community building through competitive team Squads.

---

## 3. GRADUATE ATTRIBUTE AG-C11: MODERN TOOLS & SPECIALTY

### A. Technical Stack Evaluation
The engineering team demonstrated complete mastery of modern software engineering tooling:
- **Frontend Core:** React 19 + TypeScript structured with Feature-Sliced Design (FSD) and Vite build tooling.
- **Backend Compute:** NestJS 11 modular monolith leveraging Prisma ORM.
- **Database & Spatial Engine:** Supabase PostgreSQL 15 enforcing PostGIS spatial extensions and GiST indexing.
- **Quality Assurance:** Vitest unit test runner, Playwright E2E integration test suites, and SonarQube static code analysis.
- **Infrastructure & CI/CD:** Vercel CDN, Render Cloud Compute, and GitHub Actions workflow automation (`.github/workflows/deploy.yml`).

---

## 4. COMPLEMENTARY GRADUATE ATTRIBUTES (AG-C01, AG-C02, AG-C07)

### A. AG-C01: Engineering Knowledge
Application of advanced orthodromic calculus (Haversine), game theory algorithms (Gale-Shapley), and paired Student's $t$-test hypothesis evaluation.

### B. AG-C02: Design and Development of Solutions
Formulation of a decoupled full-stack architecture structured under Feature-Sliced Design (FSD) ensuring scalability and maintainability.

### C. AG-C07: Teamwork and Communication
Coordinated performance in an agile environment with defined roles, branch management in GitHub with peer code reviews, and continuous impediment resolution.
