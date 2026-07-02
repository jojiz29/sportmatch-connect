# COMPREHENSIVE MANUAL FOR INTELLECTUAL PROPERTY AND SOFTWARE INVENTION REGISTRATION (INDECOPI - PERU)

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM AND SOCIAL NETWORK WITH EDGE AI**

**Manual of Technical, Administrative, and Legal Guidelines under the Jurisprudence of INDECOPI and Decision 486 of the Andean Community**  
**Designed for Capstone Project III Academic Certification**  

---

## ⚖️ 1. INTRODUCTION AND DUAL CONCEPTUAL FRAMEWORK

In the Republic of Peru, software protection is regulated in a **dual** manner. This means that the **expression of the code** is protected through Copyright, and the **functional technical effect** of the algorithms is protected exceptionally through the Industrial Property Regime (Invention Patents).

```
                                  SOFTWARE SYSTEM
                                [SportMatch Connect]
                                         |
                  +----------------------+----------------------+
                  |                                             |
        Route 1: Copyright                            Route 2: Industrial Property
       (Code Expression)                              (System Technical Effect)
                  |                                             |
       [Copyright Directorate]                  [Inventions & New Tech. Directorate]
                  |                                             |
      Logical Support Registration                     Invention Patent (CII)
   (Source Code, Binaries & Manuals)             (Matchmaking & Edge Moderation)
```

This manual provides detailed guidelines of global professor level to guide researchers in the preparation of registration files before the **National Institute for the Defense of Competition and Intellectual Property Protection (INDECOPI)**.

---

## 📂 2. COPYRIGHT REGISTRATION GUIDE (LOGICAL SUPPORT)

Registration before the **Copyright Directorate (DDA)** protects the source code (human-readable), the object code (machine-executable), the physical software architecture, database schemas, and user manuals. It prevents direct code plagiarism and ensures the moral and intellectual authorship of the developers.

### 📝 2.1. Registration Form F-DDA-02
The file must be initiated with the submission of form **F-DDA-02 (Logical Support / Computer Program Registration)**. The critical fields and filling instructions are detailed below:
1.  **Applicant Data:** If the financial rights are transferred to the university, the information of **Universidad San Ignacio de Loyola (RUC: 20143545678)** is entered. If the students retain them, the names and contact details of the team (Edwin Flores, Paolo Andrade, Erick Espinoza, Matías Gastelu, Juan Salvatierra) are entered.
2.  **Authors Data:** It is mandatory to declare 100% of the physical co-authors of the code with their respective DNI and fiscal address details.
3.  **Software Data:**
    *   *Title:* SportMatch Connect.
    *   *Year of Completion of the Work:* 2026.
    *   *Country of Origin:* Peru.
    *   *Is it an unpublished or published work?:* Unpublished (if it has not been formally commercialized before registration).
    *   *Nature of the Software:* Progressive Web Application (PWA) of decoupled architecture for sports matchmaking with NestJS backend and Supabase PostgreSQL relational database.

### 💰 2.2. Fees and Payment Codes
The process before INDECOPI requires prior payment of the corresponding administrative fee. The enabled payment channels are the Banco de la Nación or the virtual platform **Pagalo.pe**:
*   **Fee Code:** `02047` (Registration of works and software before the Copyright Directorate).
*   **Fee Amount:** **S/. 390.50 PEN** (Three hundred ninety and 50/100 Soles).
*   **Payment Method:** Credit/debit card or bank transfer, attaching the PDF payment voucher to the virtual application file (Virtual Filing Office of INDECOPI).

### 📄 2.3. Structure of the Technical Descriptive Memory
The Descriptive Memory is the heart of the registration and must detail the system's inner functionality without revealing critical industrial secrets. It must be organized as follows:
1.  **Title of the Work:** Formal identification of the platform.
2.  **Objective of the Software:** Logistical and sports problem it solves.
3.  **File and Directory Structure:** A map of the main project files respecting the Feature-Sliced Design (FSD) convention.
4.  **System Flowcharts:** Data flow and sequence diagrams describing in detail authentication, PostGIS geolocated searches, Stripe booking creation, and Sporty AI conversational query.
5.  **Required Hardware and Software Environment:** Minimum stack for development and execution (Node.js v20+, PostgreSQL 15+, modern browsers with PWA support).

### 💾 2.4. Rules of the Representative Source Code Deposit
To grant the registration, INDECOPI requires a physical or digital deposit of the source code for custody in the national archive of works.
*   **Extraction Rule:** It is required to deliver the **first 10 pages and the last 10 pages** printed or in immutable PDF format within a digital medium (CD-ROM or non-rewritable USB flash drive).
*   **Selected Content:** For SportMatch Connect, the first 10 pages correspond to the persistence definition (`server/prisma/schema.prisma`) and the last 10 pages correspond to the mathematical logic of matchmaking (`server/src/matches/matches.service.ts`), ensuring that the data architecture and algorithmic innovation are formally recorded in the deposit.
*   **User Manual:** A user manual PDF must be attached, containing screenshots of the user interface in Sleek Dark Mode, guiding the evaluator on how to register, geolocate courts on the Leaflet map, pay with Stripe, and chat by voice with Sporty.

---

## 🔬 3. PATENT REGISTRATION GUIDE (COMPUTER-IMPLEMENTED INVENTIONS - CII)

Registration before the **Directorate of Inventions and New Technologies (DIN)** is a highly demanding process focused on patenting a system or method that produces a **novel technical effect in the physical world**.

### ⚙️ 3.1. Global Patentability Requirements
To obtain an invention patent, SportMatch Connect must pass a substantive examination of three requirements:
1.  **Global Novelty:** That no identical system exists globally published in patents, scientific articles, or commercial platforms before the filing date.
2.  **Inventive Step:** That the solution is not obvious to an average systems engineer or a person with ordinary technical skills in the field.
3.  **Industrial Applicability:** That the system can be manufactured, reproduced, or used constantly in any type of industry or economic sector (fulfilled with its commercial B2B/B2C deployment).

### 💡 3.2. What is a Computer-Implemented Invention (CII)?
According to the DIN guidelines of INDECOPI, a computer program by itself is not patentable. However, when the software is part of a **method or system that integrates with hardware to perform technical transformations or interact with physical variables**, it qualifies as a CII.
*   *Technical Effect in SportMatch Connect:* The invention claims the physical interaction of the user's device (GPS coordinates of latitude and longitude processed by Haversine and Elo algorithms) integrated with a secure transaction system from Stripe and edge image pre-moderation with TensorFlow.js. This optimizes compute resource usage and reduces latency in physical telecommunication networks.

### 📝 3.3. Structure of the Patent File
The patent file must be written with extreme scientific and legal rigor, structured into:
1.  **Descriptive Memory (Technical Description):** Detailed description of the state of the art, deficiencies of current systems, detailed description of the invention, and reference to figures.
2.  **Claims Set:** The legal clauses defining the boundary of what the inventor claims. They must be drafted as "system", "method", or "computer storage medium" (not as "code").
3.  **Invention Abstract:** Technical synthesis of maximum 150 words.
4.  **Figures/Drawings:** C4 Container layouts, sequence flowcharts, and database schemas indexed spatially.
