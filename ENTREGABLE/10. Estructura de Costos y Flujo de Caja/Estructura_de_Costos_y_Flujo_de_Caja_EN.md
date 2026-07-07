# COST STRUCTURE AND DEFINITIVE FINANCIAL ANALYSIS — SPORTMATCH CONNECT

This report details and supports in an exhaustive manner the structure of fixed and variable costs, operating budgets, cloud infrastructure investments (AWS and Supabase), pricing models, customer loyalty rewards, and tax accounting under the tax regulations of the Republic of Peru (SUNAT).

The objective of this document is to justify the real costs and pricing of **SportMatch Connect** operating as a formally constituted technology company.

---

## 1. Support and Justification of Cloud Infrastructure Costs (AWS & Supabase)

To accurately estimate the monthly cost of production infrastructure, a high-availability cloud architecture has been structured using managed services from **Amazon Web Services (AWS)** in conjunction with the backend-as-a-service of **Supabase** (Oregon region `us-west-2`).

The estimation is made for a monthly active user base average of **10,000 active users (MAU)** and a peak concurrency of 500 requests per minute.

### 1.1. Relational Database and Spatial Engine (Supabase + AWS Aurora)
*   **Supabase Pro Plan ($35.00/month = S/. 133.00 PEN):** Provides the main PostgreSQL 15 database engine in the cloud, including native support for the PostGIS extension, JWT authentication, real-time sync, and a base limit of 8GB disk storage with PITR backups.
*   **AWS Aurora Serverless v2 PostgreSQL (Multi-AZ) - Read Replica ($120.00/month = S/. 456.00 PEN):** To guarantee that analytical queries from the social feed and matchmaking engine do not block the primary database, a read replica db.t4g.medium instance (2 vCPUs, 4GB RAM) is provisioned in high availability.

### 1.2. NestJS Application Servers (AWS ECS + Fargate)
*   **AWS ECS (Elastic Container Service) with Fargate ($35.00/month = S/. 133.00 PEN):** Serverless deployment of the NestJS 11 backend packed in Docker containers. Two simultaneous tasks with 0.5 vCPU and 1 GB RAM each are configured to load balance HTTP/REST requests.

### 1.3. Storage and Content Delivery (AWS S3 + CloudFront)
*   **AWS S3 Standard ($5.00/month = S/. 19.00 PEN):** Persistent storage of user profile images, photos uploaded by squads (Squads), system logs, and database backups.
*   **AWS CloudFront ($10.00/month = S/. 38.00 PEN):** Global CDN with edge presence in Lima. CloudFront optimizes asset delivery speed for the React 19 client and reduces S3 outbound transfer costs by caching static data.

### 1.4. Security, Networking, and Monitoring
*   **AWS Route 53 + AWS WAF ($20.00/month = S/. 76.00 PEN):** DNS management, low-latency routing, and API firewall protection against DDoS attacks or SQL injections.
*   **AWS CloudWatch + AWS KMS ($10.00/month = S/. 38.00 PEN):** Encrypted system log storage for auditing, performance metrics, and encryption keys for credentials (Stripe API key, database password).

---

## 2. Commercial Support for Pricing and Sales Tariffs

Commercial viability rests on a hybrid B2B and B2C model, designed to compete with international solutions (e.g., EasyCancha, Playtomic) while adapting to the economy of Metropolitan Lima.

### 2.1. 5% B2B Commission on Court Rentals
*   **Average Value:** Private courts in Modern Lima (soccer, padel, basketball) charge S/. 90.00 PEN per booking hour on average. A 5% commission equals **S/. 4.50 PEN** per match.
*   **Commercial Justification:** The booking facility absorbs this commission. In return, they receive native exposure to thousands of local players, raising occupancy rates from **35% to 65%** during off-peak weekdays. The software also provides a free cloud scheduling panel.

### 2.2. S/. 19.90 B2C Monthly Premium Subscription
*   **Average Value:** The monthly fee is less than half a pack of cigarettes or a Starbucks coffee, posing a negligible entry barrier for regular players of NSE A, B, and C demographics.
*   **Premium Benefits:**
    *   *Priority Booking:* Secure court bookings 48 hours before regular users.
    *   *Matchmaking Weight:* Adds a +15% compatibility boost in the matching engine.
    *   *Ad-Free Experience:* Banner-free UI.
    *   *Tournament Discounts:* Direct fee reductions in platform-sponsored leagues.

---

## 3. Tax Regime and Taxes in Peru (SUNAT 2026)

As a registered Peruvian tech business, SportMatch Connect complies with **SUNAT** regulations. The cash flow explicitly integrates tax calculations:

### 3.1. General Sales Tax (IGV - 18%)
IGV (18%) applies to sales (gross revenues) and national purchases:
*   **Output IGV (Sales):** Calculated by extracting 18% from the Net Tax Base of comisiones and subscriptions.
    
    $$
    \text{Net Tax Base} = \frac{\text{Gross Revenue}}{1.18}
    $$
    
    $$
    \text{Output IGV} = \text{Net Tax Base} \times 0.18
    $$
    
*   **Input IGV (Purchases/Tax Credit):** Calculated on eligible local expenses (support, software licenses, materials). Foreign bills (SaaS ads, AWS cloud without local representation) do not generate local tax credit.
*   **Net IGV Payable to SUNAT:** Declarable monthly on Form 621:
    
    $$
    \text{Net IGV Payable} = \text{Output IGV} - \text{Input IGV}
    $$

### 3.2. MYPE Tributario Income Tax Regime (RMT)
As projected annual revenues are under 1,700 UIT (2026 UIT = S/. 5,500.00), progressive RMT rates apply to Net Annual Profits (Net Sales - Net Expenses):
*   **Bracket 1 (Up to 15 UIT = S/. 82,500.00):** **10%** tax rate.
*   **Bracket 2 (Excess over 15 UIT):** **29.5%** tax rate.
*   **Monthly Advance Payments:** Mandatory monthly payments of **1.0%** of net sales base, acting as credit for year-end regularización.
*   **Annual Tax Regularization:** Settled every March. Monthly advances are deducted from calculated annual taxes:
    
    $$
    \text{Net Annual Tax Payable} = \text{Calculated Annual Tax} - \text{Accumulated Monthly Advances}
    $$

### 3.3. Financial Transaction Tax (ITF - 0.005%)
*   A **0.005%** automatic deduction is applied on all bank debits and credits.

---

## 4. Cash Flow and Multi-Year Financial Performance

The monthly cash flow for the first year of operations, after deducting local taxes:

### 4.1. Monthly Accounting Summary - Year 1 (S/.)
*   **Gross Revenues:** Scaled from S/. 800.00 (M1) to S/. 6,000.00 (M12) totaling S/. 41,500.00.
*   **Net Revenues (Tax Base):** S/. 35,169.49 PEN.
*   **Output IGV:** S/. 6,330.51 PEN.
*   **Input IGV (Tax Credit):** S/. 1,037.29 PEN.
*   **Net IGV Paid to SUNAT:** S/. 5,293.22 PEN.
*   **Monthly Income Tax Advances (1%):** S/. 351.69 PEN.
*   **Total Operating Egress:** S/. 13,750.00 PEN.
*   **Net Cash Flow Year 1 (Pre-Annual Regularization):** **S/. 22,332.99 PEN**.

### 4.2. Annual Income Tax Regularization (S/.)
*   **Year 1:** Profit before tax = S/. 27,182.20. 10% RMT tax = S/. 2,718.22. Deducting S/. 351.69 in monthly advances, the annual payment to SUNAT is **S/. 2,366.53**.
*   **Year 2:** Profit before tax = S/. 59,021.02. 10% RMT tax = S/. 5,902.10. Deducting S/. 711.86 in monthly advances, the annual payment is **S/. 5,190.24**.
*   **Year 3:** Profit before tax = S/. 94,949.15. This exceeds the 15 UIT bracket (S/. 82,500.00). 10% is applied to S/. 82,500 (S/. 8,250.00) and 29.5% to the excess of S/. 12,449.15 (S/. 3,672.50) totaling S/. 11,922.50 in taxes. Deducting S/. 1,067.80 in monthly advances, the annual payment is **S/. 10,854.70**.

### 4.3. Net Cash Flow and Multi-Year Real Evaluation
Accounting for annual income tax regularization payments, the net cash flow is:
*   **Year 0 (Investment):** -S/. 74,388.82 PEN.
*   **Year 1:** S/. 19,966.46 PEN.
*   **Year 2:** S/. 46,165.56 PEN.
*   **Year 3:** S/. 70,921.33 PEN.

#### Economic Viability Indicators:
*   **Real NPV @ 12% COK:** **S/. 26,850.50 PEN**. Real positive value confirms feasibility.
*   **Real IRR:** **26.85%**. Returns comfortably exceed the discount barrier (12%).
*   **Real Payback Period:** **22 months** from launch.

*(Note: All calculations are detailed in the spreadsheet [SportMatch_Connect_Financial_Plan.xlsx](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/10.%20Estructura%20de%20Costos%20y%20Flujo%20de%20Caja/SportMatch_Connect_Financial_Plan.xlsx)).*
