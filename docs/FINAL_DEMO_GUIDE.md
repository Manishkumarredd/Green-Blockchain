# GreenLedger – 15-Minute Final Project Demonstration Script
**Phase 11 Demonstration & Presentation Guide**  
**Target Audience:** Academic Examiners, Project Evaluators & Industry Stakeholders  
**Time Requirement:** 10–15 Minutes  
**Live URL:** [https://main.d1ceb7y0rzwmpf.amplifyapp.com](https://main.d1ceb7y0rzwmpf.amplifyapp.com)  
**Date:** November 2026  

---

## 1. Demonstration Preparation Checklist

Before initiating the presentation, ensure the following are accessible:

- [ ] **Browser Window 1:** Open [https://main.d1ceb7y0rzwmpf.amplifyapp.com](https://main.d1ceb7y0rzwmpf.amplifyapp.com)
- [ ] **MetaMask Wallet:** Installed with the **Sepolia Testnet** selected (Chain ID: `11155111`)
- [ ] **Demonstration Credentials Ready:**
  - **Administrator:** `admin@greenledger.io` / `Password123!`
  - **Producer:** `producer.solarfarm@greenledger.io` / `Password123!`
  - **Consumer:** `consumer.datacenter@ecotech.com` / `Password123!`
- [ ] **Backend API Gateway Health Endpoint:** [https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1/health](https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1/health) (Returns `database.connected: true`)

---

## 2. Chronological 15-Minute Demonstration Sequence

### [00:00 – 02:00] Act 1: Project Introduction & Problem Motivation
- **Presenter Action:** Display the GreenLedger Landing Page.
- **Talking Points:**
  - Introduce GreenLedger as a blockchain-based peer-to-peer renewable energy trading platform designed for microgrids.
  - Highlight the core research dilemma: During periods of low solar or wind generation, naive FIFO/FCFS allocation starves late-arriving critical infrastructure (hospitals, data centers).
  - Emphasize GreenLedger's solution: **The Demand-Aware Weighted Proportional Allocation (DA-WPA) algorithm**, paired with **Ethereum Sepolia smart contracts** and **ERC-721 Green Renewable Energy Certificates (GL-REC)**.

---

### [02:00 – 04:30] Act 2: Producer Workflow & Energy Listing
- **Presenter Action:**
  1. Click **"Log In"** $\rightarrow$ Enter Producer credentials (`producer.solarfarm@greenledger.io` / `Password123!`).
  2. Review the **Producer Dashboard** showing real-time statistics retrieved from **Amazon RDS PostgreSQL** (Total Listed kWh, Sold kWh, Earnings).
  3. Click **"Create Energy Listing"** (`/producer/listings/new`).
  4. Fill out the form:
     - Source: `SOLAR`
     - Capacity: `150 kWh`
     - Price: `0.000085 ETH/kWh`
     - Minimum Purchase: `5 kWh`
  5. Click **"Publish Listing"**.
  6. Navigate to **Energy Marketplace** (`/marketplace`) to show the newly listed green generation immediately live and discoverable.

---

### [04:30 – 07:00] Act 3: Consumer Workflow & Weighted Energy Request
- **Presenter Action:**
  1. Log out $\rightarrow$ Log in as Consumer (`consumer.datacenter@ecotech.com` / `Password123!`).
  2. Show the **Consumer Dashboard**: Current consumption, expenditure, and **Carbon Savings ($18,040\text{ kg CO}_2$)**.
  3. Navigate to **Marketplace** $\rightarrow$ Click on the Solar listing created in Act 2.
  4. Submit an **Energy Purchase Request**:
     - Quantity: `75 kWh`
     - Priority Tier: `COMMERCIAL` ($1.5\times$ weight)
  5. Click **"Submit Request"** $\rightarrow$ Show the order registered as `PENDING`.

---

### [07:00 – 10:00] Act 4: Administrator Portal & Research Algorithm Comparison
- **Presenter Action:**
  1. Log out $\rightarrow$ Log in as System Administrator (`admin@greenledger.io` / `Password123!`).
  2. Show the **Admin Dashboard**: System KPIs across the entire microgrid (7 users, listings, transaction volume).
  3. Navigate to **"Research Algorithms"** (`/admin/algorithms`).
  4. Select **"Scarcity Deficit: Low Supply & High Demand"** (Supply: 250 kWh vs Demand: 729 kWh).
  5. Click **"Execute Allocation"** to display the live side-by-side comparison:
     - **FCFS:** Jain's Fairness Index = **0.3750** (3 consumers starved with 0% fulfillment).
     - **Basic Proportional (BPA):** Jain's Fairness Index = **1.0000**, but ignores critical hospital priority.
     - **Proposed DA-WPA:** Jain's Fairness Index = **0.9166**, fulfills priority loads first while guaranteeing non-zero power to all consumers ($F_{\min} = 0.2556$).
  6. Click **"Export CSV"** to demonstrate immediate research reproducibility.

---

### [10:00 – 12:30] Act 5: Blockchain Settlement & REC Verification
- **Presenter Action:**
  1. Show a settled transaction in `/admin/transactions` with its cryptographic **Ethereum Sepolia Transaction Hash** (`0x9a8f...`).
  2. Navigate to **Public Certificate Verification** (`/verify-certificate/1`).
  3. Showcase the certificate card:
     - Certificate Number: `GL-REC-2026-0001`
     - Energy Volume: `80 kWh Solar Generation`
     - Carbon Avoidance: `65.60 kg CO₂`
     - Standard: `ERC-721 URIStorage`
  4. Click **"View on Sepolia Etherscan"** to show the live contract on the public Ethereum testnet.

---

### [12:30 – 15:00] Act 6: AWS Cloud Architecture & Q&A
- **Presenter Action:**
  1. Open [AWS_DEPLOYMENT_ARCHITECTURE.md](file:///c:/Users/manis/OneDrive/Desktop/SEM-7/BC/GreenLed/docs/AWS_DEPLOYMENT_ARCHITECTURE.md).
  2. Highlight the cost-optimized **Zero-NAT serverless hybrid design**:
     - Frontend on **AWS Amplify Hosting**.
     - API on **AWS Lambda** + **API Gateway**.
     - Database on **Amazon RDS PostgreSQL** (`db.t4g.micro`).
     - Storage on **Amazon S3** (`AES256` encrypted with presigned URLs).
     - **AWS Budgets Guardrail** (\$25.00/mo cap) extending \$130 promotional credits to ~7.8 months of continuous runtime.
  3. Conclude the demonstration and invite questions.
