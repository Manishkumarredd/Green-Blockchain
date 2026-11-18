# GreenLedger – User Operations & Roles Guide
**Phase 11 Platform User Manual**  
**Project:** GreenLedger – P2P Renewable Energy Trading Platform  
**Target Roles:** Producers, Consumers, and System Administrators  
**Date:** November 2026  

---

## 1. Introduction to GreenLedger

GreenLedger connects decentralized renewable energy producers (solar farms, wind stations, hydro micro-turbines) directly with local consumers (commercial data centers, hospitals, residential communities). The platform ensures **fair access to green power through the Demand-Aware Weighted Proportional Allocation (DA-WPA) algorithm** while anchoring transactions on the Ethereum Sepolia blockchain testnet.

---

## 2. Producer User Guide

### 1. Registration & Wallet Connection
1. Navigate to **[Register](https://main.d1ceb7y0rzwmpf.amplifyapp.com/register)**.
2. Select **"Producer (Energy Seller)"** as your platform role.
3. Provide your Facility Name (e.g., *Helios Solar Park*), Email, Password, and Smart Meter ID.
4. Click **"Connect Wallet"** to bind your MetaMask Ethereum Sepolia wallet address.
5. Upon registration, you are redirected to the **Producer Dashboard**.

### 2. Creating an Energy Listing
1. Go to **Producer Dashboard** $\rightarrow$ Click **"Create Energy Listing"** (`/producer/listings/new`).
2. Fill out the listing specifications:
   - **Energy Source:** Choose from `SOLAR`, `WIND`, `HYDRO`, or `BIOMASS`.
   - **Generation Capacity (kWh):** Total green energy available (e.g., $100\text{ kWh}$).
   - **Unit Price (ETH/kWh):** Your desired selling rate (e.g., $0.000085\text{ ETH/kWh}$).
   - **Minimum Purchase (kWh):** Smallest order allowable (e.g., $5\text{ kWh}$).
3. Click **"Publish Listing"**. Your listing is immediately active and searchable in the Energy Marketplace.

### 3. Monitoring Generation & Earnings
- **Dashboard Cards:** View real-time Total Energy Listed, Available Energy, Sold Energy, and Total Earnings (ETH).
- **Listing Management:** Cancel or adjust prices of active listings in `/producer/listings`.
- **Blockchain Settlement:** View on-chain transaction hashes for every settled trade.

---

## 3. Consumer User Guide

### 1. Browsing the Renewable Energy Marketplace
1. Navigate to **[Marketplace](https://main.d1ceb7y0rzwmpf.amplifyapp.com/marketplace)**.
2. Filter listings by:
   - **Energy Source:** Solar, Wind, Hydro, Biomass, or All.
   - **Price Range:** Set minimum and maximum ETH/kWh.
   - **Capacity:** Search for specific volume requirements.
3. Click on any listing card to inspect the producer's facility details, generation grid sector, and reputation score.

### 2. Submitting an Energy Request
1. On the listing details page (`/marketplace/[id]`), review the available energy.
2. Enter your **Order Quantity (kWh)**.
3. Select your **Priority Tier**:
   - `CRITICAL` ($2.0\times$ weight): Hospitals, cold storage, medical facilities.
   - `COMMERCIAL` ($1.5\times$ weight): Data centers, EV fleet hubs, continuous operations.
   - `STANDARD` ($1.0\times$ weight): Standard residential households and non-critical nodes.
4. Submit the request. The order enters the matching pool as `PENDING`.

### 3. Tracking Allocation & Carbon Offsets
1. Go to **Consumer Dashboard** (`/consumer/dashboard`).
2. Track your fulfilled energy volume, total expenditure, and **Estimated Carbon Avoidance** (calculated using regional factor $0.82\text{ kg CO}_2/\text{kWh}$).
3. View the fulfillment progress of active requests under **"My Requests"**.

### 4. Verifying Green Renewable Energy Certificates (GL-REC)
1. In your **Purchases** directory, click **"Verify Certificate"**.
2. The verification portal validates the certificate against the **ERC-721 smart contract on Ethereum Sepolia**:
   - View Token ID, Mint Timestamp, Producer Address, and Consumer Address.
   - Direct link to view the non-fungible certificate on **Sepolia Etherscan**.
   - Optional permanent retirement of the certificate for carbon compliance.

---

## 4. Administrator Guide

### 1. Platform Operations Dashboard
- Access `/admin/dashboard` using administrator credentials (`admin@greenledger.io`).
- Review overall platform KPIs: Registered Users, Total Listed kWh, Total Traded Volume, Active Listings, and Carbon Offset metrics.

### 2. User & Listing Moderation
- **User Directory (`/admin/users`):** Audit user profiles, verify smart meter IDs, and suspend or activate accounts.
- **Listing Moderation (`/admin/listings`):** Review and moderate active energy listings.
- **Activity Logs (`/admin/activity-logs`):** Inspect an immutable chronological audit trail of all platform activities.

### 3. Running Research Allocation Algorithms
1. Navigate to **"Research Algorithms"** (`/admin/algorithms`).
2. Choose from the available algorithms:
   - `DEMAND_AWARE_WEIGHTED_PROPORTIONAL` (Proposed DA-WPA)
   - `FIRST_COME_FIRST_SERVED` (FCFS Baseline)
   - `BASIC_PROPORTIONAL` (BPA Baseline)
3. Select an evaluation scenario or configure custom supply and demand parameters.
4. Click **"Execute Allocation"** to view side-by-side comparative metrics:
   - Jain's Fairness Index
   - Overall Fulfillment Ratio
   - Worst-off Consumer Fulfillment
   - Allocation Efficiency
   - Unmet Demand
5. Export empirical trial results as RFC 4180 CSV via **"Export CSV"**.
