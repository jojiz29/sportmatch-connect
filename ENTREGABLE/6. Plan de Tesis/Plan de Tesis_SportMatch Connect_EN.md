# FINAL CAPSTONE PROJECT PLAN (THESIS PLAN)

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM AND SOCIAL NETWORK WITH EDGE AI**

**Thesis Plan for Capstone Project III Academic Certification**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering**  

---

## 📋 CHAPTER I: PROBLEM STATEMENT

### 1.1. Description of the Problem Reality
Globally, physical inactivity is considered one of the main pandemics of the 21st century. The World Health Organization (WHO, 2020) estimates that more than a quarter of the global adult population does not perform sufficient physical activity. In Peru, the National Survey of Physical Activity and Nutrition of the Ministry of Health (MINSA, 2024) reveals that **72% of adults in Lima Metropolitana perform insufficient physical activity**.

Paradoxically, the coordination of amateur sports matches (football, padel, basketball, tennis) is carried out in a chaotic and informal manner using general messaging applications such as WhatsApp or Telegram. This method generates critical logistical frictions and inefficiencies:
*   **Absence of Skill Leveling:** Matches are organized with players of mismatched sports levels, causing frustration among participants and abandonment of sports practice.
*   **Financial Risk and Debt Collection Friction:** The organizer must individually assume the cost of court renting, performing manual collection later through mobile wallets (Yape/Plin), which generates interpersonal frictions and defaults.
*   **Opacity in Venues:** Sports venues operate in isolated silos, with manual bookings by phone or notebook, preventing real-time visualization of court availability.

### 1.2. Problem Formulation
*   **General Problem:** How does the design and implementation of an information platform based on predictive matchmaking and artificial intelligence influence coordination efficiency and the continuity of amateur sports practice among young adults in Lima Metropolitana during 2026?
*   **Specific Problems:**
    1.  How to structure a multivariable predictive algorithm based on Elo and Haversine to guarantee balanced matches?
    2.  In what way does the integration of spatial PostGIS speed up response times in sports court geolocation?
    3.  How does a FitCoins wallet integrated with Stripe influence the reduction of payment default and financial frictions in split bookings?
    4.  In what way does a conversational AI assistant with native speech processing optimize platform accessibility and usability?

### 1.3. Research Objectives
*   **General Objective:** Develop and implement "SportMatch Connect", a geolocated sports matchmaking platform with a gamified economy and intelligent assistant to unify and optimize amateur sports practice in Lima.
*   **Specific Objectives:**
    1.  Design and validate a multivariable predictive algorithm combining physical distance, schedule availability, sports affinity, and Elo skill level.
    2.  Implement geolocated search and booking of sports venues using PostGIS spatial extensions in PostgreSQL.
    3.  Develop a transactional split payment system based on FitCoins, integrating Stripe for automated court rental cost division.
    4.  Build a multimodal voice assistant ("Sporty") using Google Vertex AI (Gemini 2.5 Flash) and native speech processing (STT/TTS).

### 1.4. Justification of the Research
*   **Technological Justification:** Contributes a modern decoupled architecture implementing **Feature-Sliced Design (FSD)** on the React 19 client and a modular NestJS 11 backend with modular dependency injection and atomic database security with Row Level Security (RLS) policies.
*   **Social Justification:** Promotes physical activity, reduces sedentary lifestyles, and strengthens the community through a geolocated social network that encourages healthy living habits.
*   **Academic Justification:** Provides a real case study of the application of probabilistic algorithms (Elo Rating) and edge computing (local visual moderation with TensorFlow.js) in university software development projects.

---

## 📚 CHAPTER II: THEORETICAL FRAMEWORK AND STATE-OF-THE-ART

### 2.1. Research Antecedents
*   *Playtomic (Spain):* Leader in padel booking with a transactional focus but limited in adapted predictive algorithms and financial gamification in the Andean region.
*   *CourtSide (USA):* Focused on static matchmaking, without real-time conversational support or edge moderation.

### 2.2. Theoretical Foundations
*   **Haversine Algorithm:** Measures the orthodromic distance $d$ between two geographic points $A(\phi_1, \lambda_1)$ and $B(\phi_2, \lambda_2)$ on the Earth's spherical surface:
    
    $$
    d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
    $$

*   **Elo Rating System:** Estimates the probabilistic skill of users, dynamically recalculating after each registered match using the formula:
    
    $$
    R'_A = R_A + K \cdot (S_A - E_A)
    $$

*   **Feature-Sliced Design (FSD):** A frontend architecture methodology that divides the application into structured layers (app, routes, widgets, features, entities, shared), eliminating circular dependencies.

---

## 🛠️ CHAPTER III: METHODOLOGY AND WORK PLAN

### 3.1. Type of Research
Applied and technological research, oriented to the design and implementation of a functional software artifact to solve a logistical coordination problem.

### 3.2. Development Methodology
The agile **Scrum** framework is used, planned in 8 bi-weekly sprints with user story tracking in Jira Cloud.

### 3.3. Sprint Planning (Schedule)
*   **Sprint 1-2:** Supabase database design, RLS policies configuration, initial NestJS and React 19 setup with FSD.
*   **Sprint 3-4:** Implementation of the interactive map with Leaflet and spatially indexed searches with PostGIS.
*   **Sprint 5-6:** Development of the multivariable predictive matchmaking algorithm and trust score system.
*   **Sprint 7:** Integration of the conversational voice assistant Sporty AI with Vertex AI and Stripe split billing.
*   **Sprint 8:** Mass regression testing (Vitest, Playwright), SonarQube assurance, and final production deployment.

### 3.4. Detailed Budget
| Resource | Quantity | Unit Cost (PEN) | Total Cost (PEN) |
|---|---|---|---|
| Development Hardware | 5 laptops | S/. 3,700.00 | S/. 18,500.00 |
| Hosting & Cloud Compute (Render) | 12 months | S/. 150.00 | S/. 1,800.00 |
| Supabase DB & AI APIs Services | 12 months | S/. 200.00 | S/. 2,400.00 |
| Software Licenses | 5 licenses | S/. 240.00 | S/. 1,200.00 |
| Operational Expenses | Global | S/. 5,300.00 | S/. 5,300.00 |
| **Overall Total** | | | **S/. 29,200.00** |
