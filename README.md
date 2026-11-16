# GreenLedger: Blockchain-Based Peer-to-Peer Renewable Energy Trading Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Ethereum Sepolia](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue?logo=ethereum)](https://sepolia.etherscan.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21.2-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests Passing](https://img.shields.io/badge/Tests-44%2F44%20Passing-brightgreen)](backend/src/tests)

---

## 1. Project Overview

**GreenLedger** is a decentralized peer-to-peer (P2P) renewable energy trading and settlement platform designed to empower prosumers, clean energy consumers, and microgrid administrators. It combines off-chain double-auction matching and demand-aware proportional allocation with on-chain Ethereum Sepolia transaction settlement and ERC-721 Renewable Energy Certificate (REC) verification.

### Core Architectural Principles:
- **Zero AI/ML Dependencies**: Strictly uses transparent, auditable mathematical and rule-based algorithms.
- **Physical Software Simulation**: Telemetry for solar PV irradiance, wind speed curves, and hydro capacity is derived purely through deterministic software models without requiring hardware IoT devices.
- **Hybrid Scalability**: Computationally heavy order matching and proportional allocation happen off-chain; cryptographic trade proofs and REC tokens are minted and verified on-chain.
- **Cost-Conscious Cloud Posture**: Tailored for lightweight serverless and free-tier infrastructure (<100 AWS credits budget).

---

## 2. Monorepo Project Structure

```
GreenLed/
├── frontend/                     # Next.js 15 Web3 Client Application
│   ├── app/                      # Next.js App Router (Landing, Login, Register, Dashboards)
│   ├── components/               # 22 Reusable UI components & layouts (Public, Auth, Dashboard)
│   ├── services/                 # api.ts (Fully-typed frontend API client)
│   ├── hooks/                    # Custom hooks (useMetaMask Web3 authentication)
│   └── tailwind.config.js        # Design tokens & color system
│
├── backend/                      # Node.js & Express.js REST API
│   ├── src/
│   │   ├── config/               # db.js (PostgreSQL pool + dual-mode in-memory repository) & migrate.js
│   │   ├── controllers/          # Controllers: Auth, User, Producer, Consumer, Marketplace, Allocation, Pricing, Transaction, Carbon, Certificate, Admin
│   │   ├── middleware/           # authMiddleware, roleMiddleware, validationMiddleware, rateLimitMiddleware, errorMiddleware
│   │   ├── routes/               # Modular Express routes: auth, user, producer, consumer, marketplace, allocation, pricing, transaction, carbon, certificate, admin
│   │   ├── services/             # Domain services layer with ACID concurrency controls
│   │   ├── algorithms/           # Core algorithmic engines (Allocation, Matching, Dynamic Pricing, Carbon)
│   │   ├── validators/           # Zod schema definitions
│   │   ├── tests/                # Automated unit & integration tests (35 passing tests)
│   │   ├── app.js                # Express app setup and route pipeline
│   │   └── server.js             # HTTP server entrypoint
│   └── package.json
│
├── blockchain/                   # Hardhat Ethereum Smart Contracts
│   ├── contracts/                # EnergyTrading.sol (Escrow & Settlement) & GreenCertificate.sol (ERC-721 REC)
│   ├── scripts/deploy.js         # Deployment scripts for Sepolia & Localhost
│   └── test/                     # Smart contract unit tests
│
├── database/                     # PostgreSQL Database
│   ├── schema.sql                # 12 Normalized PostgreSQL tables with numeric types and indexes
│   ├── seed.sql                  # Realistic simulated demonstration datasets
│   └── migrations/               # Database migration scripts
│
└── docs/                         # Technical Architecture Documentation
    ├── architecture.md           # System design & Mermaid diagrams
    ├── database-design.md        # Normalized schema, ER diagram & precision rules
    ├── api-design.md             # Complete REST API specification
    └── design-system.md          # UI/UX design tokens and component specification
```

---

## 3. Database Architecture (12 Normalized Tables)

1. **`users`**: User identities, roles (`PRODUCER`, `CONSUMER`, `ADMIN`), smart meter IDs, and Ethereum wallet addresses.
2. **`energy_listings`**: Active producer energy offers with numerical capacities and selling prices.
3. **`energy_requests`**: Consumer demand bids with priority weighting (Critical, Commercial, Standard).
4. **`allocation_results`**: Historical market clearing cycles, execution runtimes, and Jain's Fairness Index.
5. **`allocation_details`**: Itemized consumer fulfillment ratios per clearing cycle.
6. **`pricing_history`**: Audit trail of dynamic pricing formulas, supply-demand elasticity swings, and clamps.
7. **`energy_transactions`**: ACID-settled P2P energy trades with row-level locks preventing overselling.
8. **`carbon_records`**: Avoided greenhouse gas emissions calculated against 0.82 kg CO2/kWh grid baseline.
9. **`green_certificates`**: ERC-721 Green Renewable Energy Certificates (GL-REC).
10. **`blockchain_transactions`**: Cryptographic trade settlement receipts on Ethereum Sepolia.
11. **`platform_settings`**: Configurable system parameters (base tariff, platform fee, carbon intensity).
12. **`activity_logs`**: System audit trail and compliance activity logging.

---

## 4. API Endpoints Reference

All endpoints are hosted at `/api/v1` (with `/api` compatibility aliases):

- **Auth**: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/nonce`
- **Producers**: `POST /producers/listings`, `GET /producers/listings`, `GET /producers/listings/:id`, `PUT /producers/listings/:id`, `DELETE /producers/listings/:id`, `GET /producers/dashboard`
- **Consumers**: `POST /consumers/requests`, `GET /consumers/requests`, `GET /consumers/allocations`, `GET /consumers/dashboard`
- **Marketplace**: `GET /marketplace/listings` (search, filters, pagination, sort), `GET /marketplace/listings/:id`
- **Allocation**: `POST /allocation/execute`, `GET /allocation/results`, `GET /allocation/results/:id`, `GET /allocation/compare`
- **Dynamic Pricing**: `GET /pricing/current`, `POST /pricing/calculate`, `GET /pricing/history`
- **Transactions**: `POST /transactions` (ACID with row locks), `GET /transactions`, `GET /transactions/:id`, `GET /transactions/history`
- **Carbon & REC**: `GET /carbon/summary`, `GET /carbon/records`, `GET /certificates`, `GET /certificates/:id`, `GET /certificates/verify/:id`, `POST /certificates/issue`
- **Admin**: `GET /admin/dashboard`, `GET /admin/users`, `GET /admin/transactions`, `GET /admin/listings`, `PUT /admin/settings`

---

## 5. Phase 5: Producer Dashboard and Renewable Energy Marketplace

Phase 5 delivers a complete commercial-grade Producer Portal and public Energy Marketplace:

### Producer Dashboard (`/producer/dashboard`)
- **Real-Time KPI Cards**: Total Energy Listed (kWh), Available Energy (kWh), Total Energy Sold (kWh), Total Earnings (ETH).
- **Interactive Recharts Visualizations**:
  - Generation and sales volume over time (AreaChart with dual gradients).
  - Energy source distribution breakdown (Donut PieChart).
  - Available vs. sold ratio metrics and capacity utilization.
- **Active Listings Table**: Shows source badge, capacity progress bar, price/kWh, status badge, and one-click actions (View details, Quick Edit modal, Cancellation dialog).
- **Recent Transactions Table**: Shows settled peer-to-peer trades with consumer details, quantity, price, total amount, timestamp, and transaction status.

### Listing Management & Creation (`/producer/listings`, `/producer/listings/new`, `/producer/listings/[id]`)
- **New Energy Listing Form**: Allows selecting energy source (`SOLAR`, `WIND`, `HYDRO`, `BIOMASS`, `HYBRID`), capacity (kWh), selling price (ETH/kWh), min purchase (kWh), and duration window with live estimated revenue and avoided CO2 calculations.
- **Full Listing Directory (`/producer/listings`)**: Comprehensive table with live text search, source filtering, status filtering, sorting, pagination, quick edit modal, and cancellation confirmation.
- **Listing Technical Specification (`/producer/listings/[id]`)**: Deep-dive details including smart meter verification, capacity fulfillment progress, and tied settlement transactions.

### Energy Marketplace (`/marketplace`, `/marketplace/[id]`)
- **Live Orderbook**: Commercial marketplace displaying available clean energy offers across the microgrid.
- **Summary Metrics**: Active listings count, total available capacity (kWh), active source types, and min/avg price.
- **Multi-Factor Filters & Search**: Search by producer name, filter by energy source buttons (`ALL`, `SOLAR`, `WIND`, `HYDRO`, `BIOMASS`, `HYBRID`), price and capacity sliders, and sorting (cheapest first, newest first, highest capacity).
- **Commercial Listing Cards**: Display source badge, price in ETH/kWh, available capacity, min purchase requirement, and estimated costs for standard packages (50 kWh, 100 kWh).
- **Interactive Purchase Estimator (`/marketplace/[id]`)**: Purchase slider with real-time fee calculation (base energy + 1.5% platform fee) and avoided carbon emissions (kg CO2) preview, plus direct purchase settlement dialog.

---

## 6. Phase 6: Consumer Portal & Energy Purchase Requests

Phase 6 implements a comprehensive Consumer Dashboard, marketplace purchase request integration, demand order tracking, and carbon avoidance analytics:

### Consumer Dashboard (`/consumer/dashboard`)
- **Key Metrics (KPI Cards)**: Total Energy Purchased (kWh), Total Energy Allocated (kWh), Pending Demands Count, Total Expenditure (₹ and ETH), and Estimated Carbon Savings (kg $\text{CO}_2$).
- **Recharts Analytics**:
  - Clean Energy Consumption & Expenditure History (dual-gradient AreaChart: kWh vs. ETH spending).
  - Demand Request Status Distribution (Donut PieChart: Pending, Matched, Fulfilled, Cancelled).
- **Environmental Impact Panel**: Avoided carbon emissions calculated against the regional grid baseline (0.8200 kg $\text{CO}_2$/kWh), with live tree equivalents, coal combustion avoided, and passenger car travel offsets.
- **Recent Demands & Settlements**: Quick-view tables for active purchase requests and completed Sepolia settlements.
- **Available Offers Quick Preview**: Top active microgrid clean energy offers with direct 1-click order initiation.

### Marketplace Energy Request Workflow (`/marketplace/[id]`)
- **Consumer Purchase Demand Modal**:
  - Displays producer name, smart meter ID, renewable source, available capacity, and unit tariff.
  - Form inputs: requested volume (kWh), priority weight tier (1.0x Standard, 1.5x Commercial, 2.0x Critical), urgency level, max acceptable price, and optional producer note.
  - Concurrency & validation guards: rejects $\le 0$, quantities exceeding available capacity, and blocks producers from requesting energy.
  - Automatically submits to double-auction matching queue and routes to demand details page.

### Consumer Demands Management (`/consumer/requests`, `/consumer/requests/[id]`)
- **Demands Directory (`/consumer/requests`)**: Searchable, filterable (status & source), and sortable table with status badges and cancellation dialog.
- **Demand Details View (`/consumer/requests/[id]`)**:
  - Full specifications and linked producer profile.
  - **Fairness-Aware Allocation Interface (Phase 7 Ready)**: Visual fulfillment percentage bar, algorithm designation, and transparent status messaging.
  - **Lifecycle Timeline**: Tracks submission, algorithmic allocation, and on-chain settlement stages.
  - Safe cancellation for eligible `PENDING` demands.

### Settled Purchases History (`/consumer/purchases`)
- Itemized directory of confirmed peer-to-peer energy transactions.
- Detailed modal receipt displaying total ETH & INR amounts, avoided carbon, and verified Ethereum Sepolia transaction hash with 1-click Etherscan link.

---

## 7. Automated Test Suite

Run all automated unit and integration tests:

```bash
npm --prefix backend test
```

**Results: 44 passing tests in <800ms**, covering:
- PostgreSQL dual-mode connectivity and health
- User registration, login, bcrypt hashing, and JWT verification
- Role authorization guards (`PRODUCER`, `CONSUMER`, `ADMIN`)
- Producer listing creation, updates, and deletion guards
- Consumer purchase request submission and capacity validation
- Rejection of negative/zero requests and requests exceeding available capacity
- Rejection of producer self-purchasing and role restrictions
- Security isolation ensuring consumers cannot access another consumer's private requests
- Cancellation of eligible `PENDING` requests and rejection of invalid state cancellations
- Exclusion of cancelled demands from completed purchase history
- Consumer dashboard analytics and Recharts series calculations
- Standard 0.82 kg $\text{CO}_2$/kWh carbon savings and environmental indicator formulas
- Marketplace search, energy source filters, price ranges, and pagination
- Concurrency control and overselling prevention

---

## 8. How to Run Locally

### Start Backend API Server:
```bash
cd backend
npm install
npm start
# API available at http://localhost:5000/api/v1
```

### Start Next.js Frontend:
```bash
cd frontend
npm install
npm run dev
# Web application available at http://localhost:3000
```
