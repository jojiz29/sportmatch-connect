# GUIDELINES FOR COMPLETION: CAPSTONE POSTER, PITCH, AND QR

This document details the technical specifications, the proposed script, and the action plan for the team to complete the visual and multimedia deliverables corresponding to the **`8. Poster Capstone, Pitch y QR/`** folder.

---

## 🎨 1. Capstone Poster (A1 or 1080x1920 Format)

The poster must be a high-quality visual summary of the project to capture the attention of the jury and the academic community.

### Recommended Layout Sections:
1.  **Header:** USIL logo, project title (`SportMatch Connect`), team members' names, and career.
2.  **Problem Statement:** Graphic of sedentary lifestyle statistics in Lima and description of coordination fragmentation.
3.  **Solution Architecture:** Simplified C4 container diagram (Frontend, Backend, Supabase, AI APIs).
4.  **Key Modules (With UI Screenshots):**
    *   Predictive matchmaking (Candidate cards with compatibility percentages).
    *   Geolocated booking engine (Leaflet map).
    *   Asistente "Sporty" (Vertex AI Gemini).
    *   Stripe payment gateway.
5.  **Quality Metrics:**
    *   **541 automated tests passing (100% success rate).**
    *   SonarQube Quality Gate: **PASSED (0 vulnerabilities).**
    *   Performance: TTFB < 200ms on Render.
6.  **Access QR Code:** Large QR code on the bottom right pointing to the production web deployment.

---

## 📹 2. Business Pitch (2-3 Minutes Video)

The Pitch video must focus on selling the commercial and technical value of the SportMatch Connect MVP.

### Proposed Script and Structure (Duration: 2:30 minutes):

*   **0:00 - 0:30 | The Hook:**
    *   *Visual:* Presenter on camera, then transitions to sedentary statistics and messy WhatsApp group screenshots.
    *   *Voice:* *"Did you know that in Lima, 72% of adults perform insufficient physical activity? The main barrier is not a lack of will, but the inefficient and fragmented logistics of organizing an amateur match, booking a court, and split billing..."*
*   **0:30 - 1:15 | The Solution (Software Demo):**
    *   *Visual:* Real-time screen capture navigating the SportMatch Connect PWA. Show the interactive Leaflet map, Matchmaking, and Stripe payment flow.
    *   *Voice:* *"To solve this, we created SportMatch Connect. A platform that unifies the amateur sports cycle. Using an interactive geolocated map and our predictive multivariable Haversine-Elo algorithm, we connect players with venues and teammates in seconds..."*
*   **1:15 - 1:45 | The Innovation (Artificial Intelligence):**
    *   *Visual:* Interactive voice demonstration with "Sporty". The user records an audio: *"Sporty, find me a padel match for tomorrow night"* $\rightarrow$ Sporty replies by voice and shows the matches.
    *   *Voice:* *"Additionally, we integrated 'Sporty', a multimodal voice assistant powered by Google Cloud Vertex AI and Gemini 2.5 Flash, which processes local slang to schedule matches conversationally, protected by TensorFlow.js on-device moderation."*
*   **1:45 - 2:15 | Traction and Financials:**
    *   *Visual:* Financial projection charts and QA metrics (541 tests, SonarQube).
    *   *Voice:* *"Our hybrid B2C subscription and B2B commission model projects a NPV of S/. 84,250 PEN and an IRR of 38.4% at 3 years, backed by a 100% success rate in software quality control."*
*   **2:15 - 2:30 | Closing (Call to Action):**
    *   *Visual:* Production QR code, project logo, slogan: *"Join the smart sports network"*.
    *   *Voice:* *"SportMatch Connect is deployed and fully operational today. Scan the QR code and experience the future of amateur sports."*

---

## 🔗 3. Required QR Codes

Generate high-definition graphic QR code images for the following links:
1.  **Production QR Code:** Points to the official web frontend on Vercel:
    `https://sportmatch-connect.vercel.app`
2.  **Source Code QR Code:** Points to the public GitHub repository for jury review:
    `https://github.com/jojiz29/sportmatch-connect`
3.  **Video Pitch QR Code:** Link to the video uploaded to YouTube, Vimeo, or Google Drive (with public permissions).

---

## 📆 4. Sprints Action Plan
1.  **Paolo Andrade (UI Specialist):** Design the Capstone Poster in Figma and export to PDF/PNG.
2.  **Juan Alonso Salvatierra (IA Specialist):** Record the Sporty voice demo.
3.  **Erick Espinoza (Backend Specialist):** Record the Stripe transactional flow.
4.  **Matías Gastelu (QA/DevOps):** Generate the QR codes.
5.  **Edwin Flores (Scrum Master):** Edit the Pitch video and compile the final package `Equipo ##.7z`.
