# GreenLedger: Blockchain-Based Peer-to-Peer Renewable Energy Trading Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Ethereum Sepolia](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue?logo=ethereum)](https://sepolia.etherscan.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21.2-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
│   ├── app/                      # App router (layout, globals.css, home page)
│   ├── components/               # UI components, layout shells, common elements
│   ├── features/                 # Domain modules: producer, consumer, admin, marketplace
│   ├── hooks/                    # Custom React and Web3 hooks
│   ├── lib/                      # Wagmi/Viem configuration and API client
│   ├── services/                 # Frontend client service abstractions
│   ├── public/                   # Static assets and icons
│   ├── styles/                   # Additional CSS styles
│   ├── package.json              # Frontend dependencies (React 19, Tailwind, Recharts, Wagmi)
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.mjs           # Next.js bundler settings
│   └── tailwind.config.js        # Tailwind CSS palette and styles
│
├── backend/                      # Node.js & Express.js REST API
│   ├── src/
│   │   ├── config/               # DB connection pool (PostgreSQL + Mock fallback) & env
│   │   ├── controllers/          # Controllers for health, auth, market, settlement, certs, admin
│   │   ├── middleware/           # JWT auth, role authorization, validation, error handler
│   │   ├── models/               # Domain data models & query mappings
│   │   ├── routes/               # Modular Express API route endpoints
│   │   ├── services/             # Physical renewable energy simulation engine
│   │   ├── algorithms/           # Core algorithmic engines:
│   │   │   ├── allocation.js     # Demand-aware weighted proportional allocation
│   │   │   ├── matching.js       # Price-aware greedy merit-order double auction
│   │   │   ├── pricing.js        # Rule-based Time-of-Use & scarcity dynamic pricing
│   │   │   └── carbon.js         # Avoided GHG emissions & baseline comparison
│   │   ├── tests/                # Unit test suites using Node.js built-in test runner
│   │   ├── app.js                # Express app setup and middleware pipeline
│   │   └── server.js             # HTTP server entrypoint
│   └── package.json              # Backend dependencies
│
├── blockchain/                   # Hardhat Ethereum Smart Contracts
│   ├── contracts/
│   │   ├── EnergyTrading.sol     # Settlement recording, dispute logging & trade verification
│   │   └── GreenCertificate.sol  # ERC-721 Renewable Energy Certificate (G-REC) NFT
│   ├── scripts/
│   │   └── deploy.js             # Automated contract deployment & issuer authorization
│   ├── test/
│   │   └── EnergyTrading.test.js # Chai / Hardhat contract test suite
│   ├── hardhat.config.js         # Hardhat configuration (Solidity 0.8.24, Sepolia, Localhost)
│   └── package.json              # Hardhat toolbox & OpenZeppelin v5 dependencies
│
├── database/                     # Relational Database Scripts
│   ├── schema.sql                # Complete PostgreSQL DDL (users, orders, cycles, RECs, audit)
│   └── seed.sql                  # Realistic simulated seed dataset
│
├── docs/                         # Technical Architecture Documentation
│   ├── architecture.md           # System design & 9 detailed Mermaid diagrams
│   ├── database-design.md        # Relational schema dictionary & indexing plan
│   └── api-design.md             # REST API specifications and endpoints
│
├── .gitignore                    # Git exclusions
├── .env.example                  # Environment variable template
├── package.json                  # Root monorepo script runner
└── README.md                     # Platform overview and getting started guide
```

---

## 3. The 3 Platform Roles

| Role | Key Capabilities | Primary Portal |
| :--- | :--- | :--- |
| **PRODUCER** | • Lists surplus renewable energy (kWh & ask price)<br>• Monitors simulated solar, wind, and hydro generation<br>• Tracks completed sales and automated ETH revenue payouts | `/producer` |
| **CONSUMER** | • Explores renewable energy order book in merit-order<br>• Submits energy requests with maximum willingness to pay<br>• Receives fair proportional allocation during high demand<br>• Claims and retires on-chain ERC-721 RECs | `/consumer` |
| **ADMINISTRATOR**| • Governs dynamic pricing rules and Time-of-Use multipliers<br>• Triggers double-auction clearing and matching cycles<br>• Audits on-chain settlement hashes and contract state<br>• Manages registered participant credentials | `/admin` |

---

## 4. Algorithmic Specifications

### 4.1. Demand-Aware Weighted Proportional Allocation
When aggregate consumer demand exceeds available renewable supply ($D_{total} > S_{total}$), the platform ensures equitable distribution rather than giving 100% to a single party:
$$\text{Effective Weight}_i = W_i \times D_i$$
$$\text{Allocation Share}_i = S_{total} \times \frac{W_i \cdot D_i}{\sum_j W_j \cdot D_j}$$
Surplus residual supply is iteratively redistributed to unsatisfied requests up to their requested cap.

### 4.2. Price-Aware Greedy Merit-Order Matching
The matching engine implements an off-chain double auction:
1. Producer listings are ordered ascending by ask price (cheapest clean energy first).
2. Consumer bids are ordered descending by max price (highest willingness to pay first).
3. Trades are executed whenever $\text{Bid Price} \ge \text{Ask Price}$.
4. A midpoint uniform clearing price is computed for the trade pair:
$$P_{clearing} = \frac{P_{ask} + P_{bid}}{2}$$

### 4.3. Rule-Based Dynamic Energy Pricing
Computes suggested prices based on explicit Time-of-Use (TOU) schedules and microgrid supply-demand elasticity:
$$P_{dynamic} = P_{base} \times M_{TOU} \times \left(1 + \alpha \cdot \frac{D - S}{D + S}\right) \times M_{source}$$
- Peak evening hours (18:00 - 22:00): $M_{TOU} = 1.30$
- Off-peak nocturnal hours (01:00 - 05:00): $M_{TOU} = 0.80$
- Safety guardrails enforce minimum floor ($0.00004\text{ ETH}$) and maximum ceiling ($0.00025\text{ ETH}$).

### 4.4. Carbon Savings Estimation
Measures avoided greenhouse gas emissions relative to regional thermal grid baseline ($0.820\text{ kg CO}_2/\text{kWh}$):
$$\text{Avoided CO}_2 = \text{Energy}_{kWh} \times (0.820 - \text{Emission}_{source})$$
- Solar PV Factor: $0.041\text{ kg CO}_2/\text{kWh}$
- Wind Turbine Factor: $0.011\text{ kg CO}_2/\text{kWh}$
- Hydro Factor: $0.024\text{ kg CO}_2/\text{kWh}$

---

## 5. Getting Started & Local Execution

### 5.1. Prerequisites
- **Node.js**: v20+ or v24+
- **npm**: v10+
- **Git**
- *(Optional)* **PostgreSQL 15+** (The backend features an automatic in-memory mock fallback mode if PostgreSQL is not yet running locally).

### 5.2. Initial Setup
1. Clone the repository and copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Run algorithm unit tests to verify mathematical logic:
   ```bash
   node --test backend/src/tests/algorithms.test.js
   ```

### 5.3. Running the Backend API
```bash
cd backend
npm install
npm run dev
```
The API starts at `http://localhost:5000/api/v1`. Test the health check endpoint:
```bash
curl http://localhost:5000/api/v1/health
```

### 5.4. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:3000`:
- **Landing Page**: `http://localhost:3000/`
- **Login Portal**: `http://localhost:3000/login`
- **Registration Portal**: `http://localhost:3000/register`
- **Forgot Password**: `http://localhost:3000/forgot-password`
- **Producer Dashboard**: `http://localhost:3000/producer/dashboard`
- **Consumer Dashboard**: `http://localhost:3000/consumer/dashboard`
- **Administrator Dashboard**: `http://localhost:3000/admin/dashboard`

### 5.5. Running Unit & Integration Tests
Run both algorithm and authentication test suites:
```bash
node --test backend/src/tests/algorithms.test.js backend/src/tests/auth.test.js
```
Or build the Next.js production bundle:
```bash
npm --prefix frontend run build
```

### 5.5. Running Blockchain Smart Contracts (Hardhat)
```bash
cd blockchain
npm install
npm run compile
npm test
```

To deploy locally to a Hardhat node:
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy contracts
npm run deploy:local
```

To deploy to Ethereum Sepolia Testnet:
Ensure `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` are populated in `.env`, then:
```bash
npm run deploy:sepolia
```

---

## 6. Database Setup (Optional for Full PostgreSQL Integration)
Create the database and apply the schema and seed scripts:
```bash
createdb greenledger_db
psql -d greenledger_db -f database/schema.sql
psql -d greenledger_db -f database/seed.sql
```

---

## 7. Phase Completion & Progress Summary

- [x] **Phase 1: Project Initialization & System Architecture**
  - Monorepo structure, 9 Mermaid architecture diagrams, PostgreSQL schema, Hardhat smart contracts (`EnergyTrading.sol`, `GreenCertificate.sol`), and algorithmic engines.
- [x] **Phase 2: Professional UI/UX Design System**
  - Brand identity, vector logo, color system, typography, 22 reusable components, public/auth/dashboard layouts, component showroom, and light/dark theme foundation.
- [x] **Phase 3: Landing Page, Authentication & User Registration**
  - High-converting commercial landing page with simulated telemetry indicators, research allocation benchmark comparison, 4-step workflow, and carbon impact metrics.
  - Dedicated authentication pages: `/login`, `/register`, `/forgot-password`.
  - Role-based separation for **Producer** and **Consumer** registration (public admin registration forbidden).
  - Backend authentication with bcryptjs password hashing, JWT token issuance, protected endpoints, and duplicate email prevention.
  - Non-custodial MetaMask Web3 wallet integration with Sepolia network detection and signature nonce flow.
  - Dedicated role dashboard routes: `/producer/dashboard`, `/consumer/dashboard`, `/admin/dashboard`.
  - 18 passing backend test suites and successful Next.js 15 production build.
