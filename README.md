# GreenLedger: Blockchain-Based Peer-to-Peer Renewable Energy Trading Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Ethereum Sepolia](https://img.shields.io/badge/Network-Sepolia%20Testnet%20(11155111)-blue?logo=ethereum)](https://sepolia.etherscan.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21.2-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.3%20(RDS)-336791?logo=postgresql)](https://www.postgresql.org/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify%20Live-FF9900?logo=amazonaws)](https://main.d1ceb7y0rzwmpf.amplifyapp.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests Passing](https://img.shields.io/badge/Tests-101%2F101%20Passing-brightgreen)](backend/src/tests)

---

## 1. Project Overview & Live Deployment

**GreenLedger** is a decentralized peer-to-peer (P2P) renewable energy trading platform designed for local microgrids and prosumers. It unifies **algorithmic fairness, dynamic pricing, off-chain order settlement, and on-chain Ethereum Sepolia transaction immutability with ERC-721 Green Renewable Energy Certificates (GL-REC)**.

### Live Cloud Endpoints (AWS ap-southeast-2 Sydney):
- 🌐 **Production Web Application:** [https://main.d1ceb7y0rzwmpf.amplifyapp.com](https://main.d1ceb7y0rzwmpf.amplifyapp.com)
- ⚡ **REST API Gateway Base:** [https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1](https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1)
- 🩺 **Cloud Health Check:** [https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1/health](https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1/health)
- 📜 **Sepolia REC Verification:** [https://main.d1ceb7y0rzwmpf.amplifyapp.com/verify-certificate/1](https://main.d1ceb7y0rzwmpf.amplifyapp.com/verify-certificate/1)

### Core Architectural Features:
- **Transparent Mathematical Optimization**: Free of black-box AI dependencies; strictly uses deterministic, auditable mathematical formulations.
- **Fairness-Aware Allocation (DA-WPA)**: Protects life-safety critical infrastructure (Hospitals, cold storage) while strictly preventing starvation of standard consumers.
- **Physical Generation Modeling**: Photovoltaic solar irradiance and wind power generation curves are computed via deterministic physical models.
- **Ethereum Sepolia Immutability**: All settled trades and environmental attribute certificates are minted as ERC-721 tokens on Sepolia.
- **Cost-Optimized Zero-NAT Architecture**: Runs on serverless AWS Lambda, API Gateway, Amazon RDS, and Amplify with a strict \$25/mo budget cap.

---

## 2. Monorepo Structure

```
GreenLed/
├── frontend/                     # Next.js 15 Web3 Client Application
│   ├── app/                      # App Router (Landing, Marketplace, Dashboards, REC Verify)
│   ├── components/               # UI design system components (Cards, Tables, Modals, Charts)
│   ├── services/                 # api.ts (Typed API Client communicating with AWS API Gateway)
│   └── tailwind.config.js        # Design tokens & color system
│
├── backend/                      # Node.js & Express.js REST API Engine
│   ├── src/
│   │   ├── algorithms/           # Core Research Algorithms (DA-WPA, FCFS, BPA, Greedy, Pricing)
│   │   ├── blockchain/           # Sepolia bridge, Ethers.js provider, REC verification
│   │   ├── config/               # RDS PostgreSQL connection pool, environment configuration
│   │   ├── controllers/          # Modular controllers (Auth, Producer, Consumer, Admin, Market)
│   │   ├── middleware/           # authMiddleware, roleMiddleware, rateLimit, errorMiddleware
│   │   ├── services/             # TransactionService, MarketplaceService, S3Service
│   │   ├── tests/                # Automated test suite (81 passing tests)
│   │   └── lambda.js             # AWS Lambda serverless-http entrypoint
│   └── package.json
│
├── blockchain/                   # Hardhat Ethereum Smart Contracts
│   ├── contracts/                # EnergyTrading.sol, GreenCertificate.sol, UserRegistry.sol
│   ├── scripts/                  # Sepolia deployment scripts
│   └── test/                     # Hardhat unit tests (20 passing tests)
│
├── database/                     # PostgreSQL schema definitions & demonstration seed data
│   ├── schema.sql                # 12 normalized relational tables + indexes
│   └── seed.sql                  # Initial microgrid producers, consumers, and listings
│
├── docs/                         # Comprehensive Academic & Operational Documentation
│   ├── SYSTEM_ARCHITECTURE.md    # Detailed full-stack architecture specification
│   ├── EXPERIMENTAL_EVALUATION.md# Empirical research benchmark report across 8 scenarios
│   ├── SECURITY_REPORT.md        # Comprehensive security audit & vulnerability report
│   ├── AWS_DEPLOYMENT_ARCHITECTURE.md # AWS hybrid cloud deployment specification
│   ├── DEPLOYMENT_GUIDE.md       # Step-by-step local & AWS deployment operations guide
│   ├── USER_GUIDE.md             # End-user manual for Producers, Consumers, and Admins
│   └── FINAL_DEMO_GUIDE.md       # 15-minute chronological demonstration walkthrough script
│
└── scripts/                      # Automated benchmark, migration, and verification utilities
    ├── run_research_experiments.js  # 8-scenario empirical research benchmark runner
    ├── measure_system_performance.js # AWS API & RDS PostgreSQL latency benchmark
    ├── test_complete_e2e_workflow.js # 15-step end-to-end trading workflow test
    ├── database_integrity_check.js  # Foreign key, constraint, and index consistency audit
    └── verify_cloud_e2e.py       # Cloud test suite verifying live AWS resources
```

---

## 3. Automated Test Suite Summary

GreenLedger maintains **101 automated passing tests with 100% pass rate**:

| Test Suite | Framework | Total Tests | Passed | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Backend API & Services** | Node.js Test Runner (`node:test`) | 44 | 44 | **PASS** |
| **Research Algorithms (Invariants)** | Node.js Test Runner (`node:test`) | 12 | 12 | **PASS** |
| **Admin & Governance** | Node.js Test Runner (`node:test`) | 12 | 12 | **PASS** |
| **Blockchain Sync & RECs** | Node.js Test Runner (`node:test`) | 7 | 7 | **PASS** |
| **Security & Vulnerability Audit** | Node.js Test Runner (`node:test`) | 6 | 6 | **PASS** |
| **Smart Contracts (Sepolia Suite)** | Hardhat + Mocha / Chai | 20 | 20 | **PASS** |
| **Total Automated Tests** | | **101** | **101** | **100% Passing** |

Execute tests locally:
```bash
# Run backend test suite (81 tests)
npm --prefix backend test

# Run smart contract test suite (20 tests)
npm --prefix blockchain test
```

---

## 4. Quick Start (Local Development)

### 1. Database Initialization
```bash
node scripts/seed_rds.js
```

### 2. Start Backend API Server:
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000/api/v1
```

### 3. Start Next.js Frontend:
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 5. Demonstration Accounts

All demonstration accounts are seeded in the Amazon RDS database:

| Role | Email Address | Password | Focus |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@greenledger.io` | `Password123!` | System KPIs, Research Algorithms, Moderation |
| **Producer** | `producer.solarfarm@greenledger.io` | `Password123!` | Energy Listings, Solar Capacity, Revenue Tracking |
| **Consumer** | `consumer.datacenter@ecotech.com` | `Password123!` | Marketplace Orders, Weighted Demands, REC Verification |

---

## 6. Academic Documentation References

- **System Architecture:** [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
- **Experimental Evaluation:** [docs/EXPERIMENTAL_EVALUATION.md](docs/EXPERIMENTAL_EVALUATION.md)
- **Security Audit Report:** [docs/SECURITY_REPORT.md](docs/SECURITY_REPORT.md)
- **AWS Cloud Architecture:** [docs/AWS_DEPLOYMENT_ARCHITECTURE.md](docs/AWS_DEPLOYMENT_ARCHITECTURE.md)
- **Deployment & Operations Guide:** [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **User Guide:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
- **15-Minute Demonstration Script:** [docs/FINAL_DEMO_GUIDE.md](docs/FINAL_DEMO_GUIDE.md)
