# COST STRUCTURE AND DEFINITIVE FINANCIAL ANALYSIS — SPORTMATCH CONNECT

This report details and supports in an exhaustive manner the structure of fixed and variable costs, operating budgets, cloud infrastructure investments (AWS and Supabase), marketing and acquisition strategies, loyalty programs based on incentives, and tax accounting under the tax regulations of the Republic of Peru.

The objective of this document is to justify the real costs of **SportMatch Connect** operating as a formally constituted technology company.

---

## 1. Support and Justification of Cloud Infrastructure Costs (AWS & Supabase)

To accurately estimate the monthly cost of production infrastructure, a high-availability cloud architecture has been structured using managed services from **Amazon Web Services (AWS)** in conjunction with the backend-as-a-service of **Supabase** (Oregon region `us-west-2`).

The estimation is made for a monthly active user base average of **10,000 active users (MAU)** and a peak concurrency of 500 requests per minute.

### 1.1. Relational Database and Spatial Engine (Supabase + AWS Aurora)
*   **Supabase Pro Plan ($35.00/month):** Provides the main PostgreSQL 15 database engine in the cloud, including native support for the PostGIS extension, JWT authentication, real-time sync, and a base limit of 8GB disk storage with PITR backups.
*   **AWS Aurora Serverless v2 PostgreSQL (Multi-AZ) - Read Replica ($120.00/month):** To guarantee that analytical queries from the social feed and matchmaking engine do not block the primary transactional database, a read replica db.t4g.medium instance (2 vCPUs, 4GB RAM) is provisioned in high availability.

### 1.2. NestJS Application Servers (AWS ECS + Fargate)
*   **AWS ECS (Elastic Container Service) with Fargate ($35.00/month):** Serverless deployment of the NestJS 11 backend packed in Docker containers. Two simultaneous tasks with 0.5 vCPU and 1 GB RAM each are configured to load balance HTTP/REST requests.

### 1.3. Storage and Content Delivery (AWS S3 + CloudFront)
*   **AWS S3 Standard ($5.00/month):** Persistent storage of user profile images, photos uploaded by squads (Squads), system logs, and database backups.
*   **AWS CloudFront ($10.00/month):** Global CDN with edge presence in Lima. CloudFront optimizes asset delivery speed for the React 19 client and reduces S3 outbound transfer costs by caching static data.

### 1.4. Security, Networking, and Monitoring
*   **AWS Route 53 + AWS WAF ($20.00/month):** DNS management, low-latency routing, and API firewall protection against DDoS attacks or SQL injections.
*   **AWS CloudWatch + AWS KMS ($10.00/month):** Encrypted system log storage for auditing, performance metrics, and encryption keys for credentials (Stripe API key, database password).

---

## 2. Marketing, Customer Acquisition, and Loyalty Strategy

### 2.1. Customer Acquisition Cost (CAC) and Cost Per Click (CPC)
Digital marketing for a sports-focused social platform in Metropolitan Lima requires highly geo-targeted campaigns segmented by age (18-35 years) and target districts (Modern Lima: Surco, Miraflores, San Borja, etc.).
*   **Base Monthly Budget (Year 1):** **S/. 200.00 PEN** (distributed as S/. 120.00 for Meta Ads and S/. 80.00 for TikTok Ads).
*   **Estimated CPC (Meta/TikTok):** **S/. 0.25 PEN**. With S/. 200.00 per month, approximately 800 landing page views are achieved.
*   **Click-to-Install Conversion Rate:** **10%**. An estimated 80 new active registered users per month are gained from paid ads, resulting in a **CAC of S/. 2.50 PEN** per registered user.

### 2.2. Loyalty and Rewards Program (FitCoins)
The loyalty program rewards users for punctuality and completing matches without late cancellations. Accumulated FitCoins are redeemable for vouchers at partner complexes and shops.
*   **Financial Mechanism:** For each successfully played match, users accumulate FitCoins equivalent to **S/. 0.50 PEN** in cash value.
*   **Voucher Redemption Margin:** A B2B partnership is established where sports complexes absorb 20% of the voucher value as a promotion to attract bookings during low-demand hours. Thus, a **S/. 5.00 PEN** voucher costs the company **S/. 4.00 PEN**.
*   **Projected Monthly Loyalty Cost:** **S/. 400.00 PEN** (supporting up to 100 redeemed vouchers per month).

---

## 3. Tax Regime and Taxes in Peru (Fiscal Year 2026)

As a technology startup registered in Peru, SportMatch Connect operates under tax regulations overseen by the Superintendencia Nacional de Aduanas y de Administración Tributaria (**SUNAT**).

### 3.1. MYPE Tributario Regime (RMT)
Since the company projects annual net revenues below 1,700 UIT (with the 2026 UIT set at **S/. 5,500.00 PEN**), it qualifies for the **MYPE Tributario** regime, which offers progressive tax rates on Net Annual Profits:
*   **Bracket 1 (Up to 15 UIT = S/. 82,500.00 net profit):** Tax rate of **10%**.
*   **Bracket 2 (Excess over 15 UIT):** Tax rate of **29.5%**.

### 3.2. Monthly Advance Payments
To avoid a massive single tax payment at year-end, the RMT requires monthly advance payments of Income Tax:
*   **Up to 300 UIT in annual revenues:** **1.0%** of monthly net revenues (declared via Virtual Form 621).

### 3.3. General Sales Tax (IGV)
*   A rate of **18%** (16% IGV + 2% Municipal Promotion Tax) is applied on comisiones charged to B2B venues and subscriptions billed to B2C premium users. This tax is offset monthly by the tax credit generated from business purchases (such as office equipment or ads).

### 3.4. Financial Transaction Tax (ITF)
*   A rate of **0.005%** is applied on all bank account debits and credits (deposits, transfers, withdrawals).

---

## 4. Project Cost Structure

The recurring annual costs and projected 3-year cash flow for the business are consolidated below:

### 4.1. Initial Investment and Depreciation Summary
The total required investment amounts to **S/. 74,388.82 PEN**, with the largest portion dedicated to human capital (S/. 64,000.00 PEN). To ensure correct accounting, hardware assets are depreciated monthly over 36 months under Legislative Decree N° 822.

### 4.2. 3-Year Projected Cash Flow
The financial model assumes steady growth driven by platform adoption in Lima:
*   **Year 1:** Gross revenue of S/. 41,500.00, achieving positive cash flow starting in Month 2, accumulating **S/. 27,750.00** by year-end.
*   **Year 2:** Growth in bookings and premium subscriptions in Modern Lima, accumulating a net cash flow of **S/. 63,360.00**.
*   **Year 3:** Venue expansion into Lima Norte and Este, reaching S/. 126,000.00 in revenues and an annual net cash flow of **S/. 100,240.00**.

### 4.3. Financial Viability Indicators
*   **Net Present Value (NPV) @ 12% COK:** **S/. 84,250.00 PEN**. Since it is greater than zero, the project covers the opportunity cost of capital and generates significant value.
*   **Internal Rate of Return (IRR):** **38.4%**. The IRR far exceeds the reference discount rate (12%), confirming strong commercial viability.
*   **Payback Period:** **14 months** from launch.

*(Note: All data and equations are structured and calculated in the spreadsheet [SportMatch_Connect_Financial_Plan.xlsx](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/10.%20Estructura%20de%20Costos%20y%20Flujo%20de%20Caja/SportMatch_Connect_Financial_Plan.xlsx) located in this directory).*
