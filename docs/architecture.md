# GreenLedger System Architecture Documentation

## 1. Executive Summary

**GreenLedger** is a decentralized, software-simulated peer-to-peer (P2P) renewable energy trading platform that combines microgrid peer trading, demand-aware weighted proportional energy allocation, price-aware greedy merit-order matching, rule-based dynamic pricing, on-chain Ethereum Sepolia transaction settlement, and ERC-721 Renewable Energy Certificate (REC) verification.

To ensure deterministic reliability, platform verifiability, and regulatory auditability, GreenLedger strictly eliminates opaque machine learning, deep learning, and hardware/IoT dependencies. All telemetry is generated via physical simulation models, and clearing is handled via deterministic mathematics.

---

## 2. Overall System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer["Client Layer (Web3 Frontend)"]
        Browser["User Browser / Mobile Client"]
        NextApp["Next.js 15 Client App (React, Tailwind CSS, Lucide, Recharts)"]
        MetaMask["MetaMask / Injected Web3 Provider"]
        WagmiViem["Wagmi / Viem Web3 Bridge"]
    end

    subgraph OffChainLayer["Off-Chain Core Services (Node.js & Express)"]
        APIGateway["REST API Routing Layer (/api/v1)"]
        AuthModule["JWT & Role-Based Auth Controller"]
        MarketEngine["Market Controller & Order Books"]
        MatchingEngine["Greedy Merit-Order Matching Engine"]
        AllocEngine["Weighted Proportional Allocation Engine"]
        PricingEngine["Rule-Based Dynamic Pricing Engine"]
        CarbonEngine["Carbon Avoidance Estimation Engine"]
        SimService["Renewable Physical Simulation Service"]
    end

    subgraph DataStorageLayer["Data Storage & Persistence Layer"]
        PostgresDB[(PostgreSQL Primary Relational DB)]
        ConnectionPool["node-postgres (pg) Connection Pool"]
        InMemoryFallback["In-Memory Simulation Store (Dev Fallback)"]
    end

    subgraph BlockchainLayer["On-Chain Settlement Layer (Ethereum Sepolia)"]
        SepoliaNode["Ethereum Sepolia Testnet RPC (Alchemy / Infura)"]
        TradingContract["EnergyTrading.sol (Settlement & Role Registry)"]
        CertContract["GreenCertificate.sol (ERC-721 REC Token)"]
    end

    Browser --> NextApp
    NextApp --> MetaMask
    MetaMask --> WagmiViem
    WagmiViem --> SepoliaNode
    NextApp -- "HTTPS / REST" --> APIGateway
    APIGateway --> AuthModule
    APIGateway --> MarketEngine
    APIGateway --> MatchingEngine
    APIGateway --> AllocEngine
    APIGateway --> PricingEngine
    APIGateway --> CarbonEngine
    APIGateway --> SimService

    MarketEngine --> ConnectionPool
    MatchingEngine --> ConnectionPool
    AllocEngine --> ConnectionPool
    ConnectionPool --> PostgresDB
    ConnectionPool -.-> InMemoryFallback

    MatchingEngine -- "Settlement Hash Trigger" --> WagmiViem
    SepoliaNode --> TradingContract
    TradingContract --> CertContract
```

---

## 3. Frontend Architecture

```mermaid
flowchart TD
    subgraph FrontendApp["Next.js App Router Structure (/frontend)"]
        RootLayout["app/layout.tsx (Theme, Global CSS, Nav Shell)"]
        HomePage["app/page.tsx (Market Overview & Metrics)"]

        subgraph Features["Domain Features"]
            ProducerView["features/producer (Generation Telemetry, Listing Form, Earnings)"]
            ConsumerView["features/consumer (Energy Bids, Proportional Allocations, My RECs)"]
            AdminView["features/admin (TOU Tariff Config, Batch Settlement Trigger)"]
            MarketView["features/marketplace (Order Book, Merit-Order Depth, Price Curves)"]
        end

        subgraph SharedLib["Shared Infrastructure"]
            ApiService["lib/api.ts (REST Fetch Client with Auth Headers)"]
            WagmiConfig["lib/wagmiConfig.ts (Sepolia Chain & Injected Connectors)"]
            ContractsAbi["lib/contracts (ABI & Contract Addresses)"]
        end

        subgraph UIComponents["Reusable UI Components"]
            Cards["components/ui/Cards, Buttons, Badges"]
            Charts["components/ui/Recharts (Load Profiles, Pricing Curves)"]
            Icons["lucide-react (Clean Energy Iconography)"]
        end
    end

    RootLayout --> HomePage
    HomePage --> Features
    Features --> SharedLib
    Features --> UIComponents
```

---

## 4. Backend Architecture

```mermaid
flowchart LR
    subgraph BackendApp["Express.js Server Application (/backend)"]
        ServerEntry["src/server.js (HTTP Listener & DB Health Check)"]
        AppConfig["src/app.js (Security Middleware, CORS, Helmet, JSON Parser)"]

        subgraph Middlewares["Middleware Stack"]
            AuthMid["middleware/auth.js (JWT Verification & RBAC Guards)"]
            ErrorMid["middleware/errorHandler.js (Global Error & 404 Handlers)"]
            ValMid["middleware/validate.js (Schema & Payload Validation)"]
        end

        subgraph Controllers["Modular Controllers"]
            AuthController["controllers/auth.controller.js"]
            MarketController["controllers/market.controller.js"]
            SettlementController["controllers/settlement.controller.js"]
            CertController["controllers/certificate.controller.js"]
            AdminController["controllers/admin.controller.js"]
        end

        subgraph MathematicalEngines["Rule-Based Algorithms (Deterministic)"]
            AllocAlgo["algorithms/allocation.js (Weighted Proportional)"]
            MatchAlgo["algorithms/matching.js (Greedy Double Auction)"]
            PriceAlgo["algorithms/pricing.js (TOU & Scarcity Tariff)"]
            CarbonAlgo["algorithms/carbon.js (Grid Offset Baseline)"]
            SimService["services/energySimulator.js (Solar/Wind Physical Curves)"]
        end
    end

    ServerEntry --> AppConfig
    AppConfig --> Middlewares
    Middlewares --> Controllers
    Controllers --> MathematicalEngines
```

---

## 5. Database Architecture

```mermaid
erDiagram
    USERS ||--o{ PRODUCER_PROFILES : "has"
    USERS ||--o{ CONSUMER_PROFILES : "has"
    USERS ||--o{ ENERGY_LISTINGS : "creates"
    USERS ||--o{ ENERGY_REQUESTS : "submits"
    USERS ||--o{ SETTLEMENT_TRANSACTIONS : "participates_as_producer"
    USERS ||--o{ SETTLEMENT_TRANSACTIONS : "participates_as_consumer"
    USERS ||--o{ RENEWABLE_ENERGY_CERTIFICATES : "owns"
    
    ALLOCATION_CYCLES ||--o{ SETTLEMENT_TRANSACTIONS : "settles_into"
    ENERGY_LISTINGS ||--o{ SETTLEMENT_TRANSACTIONS : "matched_from"
    ENERGY_REQUESTS ||--o{ SETTLEMENT_TRANSACTIONS : "allocated_to"
    SETTLEMENT_TRANSACTIONS ||--o| RENEWABLE_ENERGY_CERTIFICATES : "mints"

    USERS {
        int id PK
        string wallet_address UK
        string email UK
        string name
        string role
        string meter_id UK
        boolean is_active
        decimal reputation_score
    }

    ENERGY_LISTINGS {
        int id PK
        int producer_id FK
        string energy_source
        decimal quantity_kwh
        decimal available_kwh
        decimal unit_price_eth
        string status
    }

    ENERGY_REQUESTS {
        int id PK
        int consumer_id FK
        decimal requested_kwh
        decimal allocated_kwh
        decimal max_acceptable_price_eth
        decimal priority_weight
        string urgency_level
        string status
    }

    ALLOCATION_CYCLES {
        int id PK
        int cycle_number UK
        string algorithm_used
        decimal total_demand_kwh
        decimal total_supply_kwh
        decimal clearing_price_eth
        int matched_orders_count
    }

    SETTLEMENT_TRANSACTIONS {
        int id PK
        string trade_hash UK
        int allocation_cycle_id FK
        int listing_id FK
        int request_id FK
        decimal energy_amount_kwh
        decimal unit_price_eth
        decimal total_amount_eth
        decimal carbon_saved_kg
        string settlement_status
        string tx_hash
        bigint block_number
    }

    RENEWABLE_ENERGY_CERTIFICATES {
        int id PK
        bigint token_id UK
        int transaction_id FK
        string owner_address
        string producer_address
        decimal energy_amount_kwh
        decimal carbon_offset_kg
        string energy_source
        boolean is_retired
    }
```

---

## 6. Blockchain Architecture

```mermaid
classDiagram
    class Ownable {
        +address owner()
        +transferOwnership(address newOwner)
    }

    class ERC721URIStorage {
        +tokenURI(uint256 tokenId) string
        +_safeMint(address to, uint256 tokenId)
        +_setTokenURI(uint256 tokenId, string uri)
    }

    class GreenCertificate {
        -uint256 _nextTokenId
        -mapping _certificates
        +mapping authorizedIssuers
        +issueCertificate(address to, address from, uint256 kwh, uint256 co2, string source, bytes32 tradeHash, string uri) uint256
        +retireCertificate(uint256 tokenId)
        +getCertificate(uint256 tokenId) CertificateData
        +isCertificateValid(uint256 tokenId) bool
        +setAuthorizedIssuer(address issuer, bool status)
    }

    class EnergyTrading {
        +GreenCertificate certificateContract
        +mapping users
        +mapping settlements
        +bytes32[] settlementHashes
        +registerUser(address account, Role role, string meterIdHash)
        +recordSettlement(bytes32 tradeHash, address producer, address consumer, uint256 kwh, uint256 priceWei, uint256 totalWei, string source, uint256 co2, string uri) uint256
        +settleTradeDirect(bytes32 tradeHash, address payable producer, uint256 kwh, uint256 priceWei, string source, uint256 co2, string uri) uint256
        +disputeSettlement(bytes32 tradeHash, string reason)
        +getSettlement(bytes32 tradeHash) TradeSettlement
    }

    Ownable <|-- GreenCertificate
    ERC721URIStorage <|-- GreenCertificate
    Ownable <|-- EnergyTrading
    EnergyTrading o-- GreenCertificate : "Authorizes & Mints RECs via"
```

---

## 7. On-Chain versus Off-Chain Responsibility Matrix

```mermaid
flowchart TD
    subgraph OffChain["Off-Chain Operations (Fast, Free, Computationally Intensive)"]
        direction TB
        OC1["User Profile & Credential Management"]
        OC2["Simulated Generation Feeds (Solar bell curves, Wind aerodynamic curves)"]
        OC3["High-frequency Order Book Management (Listings & Requests)"]
        OC4["Price-Aware Greedy Merit-Order Matching"]
        OC5["Demand-Aware Weighted Proportional Allocation"]
        OC6["Rule-Based Dynamic Pricing (TOU & Scarcity Schedules)"]
        OC7["Carbon Savings Computations (vs 0.82 kg/kWh Baseline)"]
        OC8["PostgreSQL Relational Storage & Analytical Aggregations"]
    end

    subgraph Bridge["Off-Chain to On-Chain Cryptographic Bridge"]
        TradeHashGen["Deterministic keccak256 / SHA-256 Trade Hash Generation"]
        EIP712OrSig["Transaction Envelope Verification & Wallet Signing"]
    end

    subgraph OnChain["On-Chain Operations (Immutable, Verifiable, Trustless)"]
        direction TB
        ON1["Role Authorization & Meter Registry (EnergyTrading.sol)"]
        ON2["Trade Settlement Anchoring & Event Audit Logging"]
        ON3["Direct ETH Payment Settlement between Consumer & Producer"]
        ON4["Renewable Energy Certificate (REC) NFT Issuance (ERC-721)"]
        ON5["Public REC Lifecycle Verification & Offset Retirement"]
        ON6["Multi-party Dispute Logging"]
    end

    OffChain --> Bridge
    Bridge --> OnChain
```

---

## 8. User Roles & Permission Matrix

```mermaid
flowchart TD
    subgraph Roles["GreenLedger User Personas"]
        Producer["1. PRODUCER (Microgrid Owners: Solar, Wind, Hydro)"]
        Consumer["2. CONSUMER (Commercial & Residential Loads)"]
        Admin["3. ADMINISTRATOR (Grid Operator & Market Auditor)"]
    end

    subgraph Permissions["Role Permissions & Accessible Endpoints"]
        subgraph ProducerPerms["Producer Capabilities"]
            P1["Create Energy Listing (kWh, ask price, energy source)"]
            P2["View Generation Simulation Telemetry"]
            P3["Track Earnings (ETH) & Volume Traded"]
        end

        subgraph ConsumerPerms["Consumer Capabilities"]
            C1["Submit Energy Request (kWh, max bid price, urgency tier)"]
            C2["Inspect Proportional Allocation Results"]
            C3["Claim and Retire Verified REC ERC-721 Tokens"]
        end

        subgraph AdminPerms["Administrator Capabilities"]
            A1["Trigger Batch Matching & Allocation Cycles"]
            A2["Update Time-of-Use & Dynamic Pricing Schedules"]
            A3["Register Verified Users & Audit On-Chain Settlements"]
        end
    end

    Producer --> ProducerPerms
    Consumer --> ConsumerPerms
    Admin --> AdminPerms
```

---

## 9. End-to-End Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Producer as Producer (Helios Solar)
    actor Consumer as Consumer (Metro Hospital)
    participant Frontend as Next.js Web App
    participant Backend as Express API Engine
    participant DB as PostgreSQL Database
    participant Blockchain as Sepolia (EnergyTrading & GreenCertificate)

    Producer->>Frontend: List 150 kWh Solar @ 0.000088 ETH/kWh
    Frontend->>Backend: POST /api/v1/market/listings
    Backend->>DB: Store active listing in energy_listings

    Consumer->>Frontend: Request 80 kWh Clean Power (High Priority Tier)
    Frontend->>Backend: POST /api/v1/market/requests
    Backend->>DB: Store pending request in energy_requests

    Note over Backend: Settlement Window Closes / Admin Triggers Matching Cycle
    Backend->>Backend: Execute Greedy Merit-Order Matching
    Backend->>Backend: Execute Demand-Aware Weighted Proportional Allocation
    Backend->>Backend: Calculate Carbon Offset (80 kWh * 0.779 = 62.3 kg CO2)
    Backend->>DB: Record cycle in allocation_cycles & create tradeHash

    Backend-->>Frontend: Matching Result & Trade Hash Created
    Consumer->>Frontend: Approve On-Chain Settlement with MetaMask
    Frontend->>Blockchain: recordSettlement(tradeHash, producer, consumer, 80 kWh, ...)
    Blockchain->>Blockchain: Anchor Trade Record on Sepolia
    Blockchain->>Blockchain: Mint ERC-721 GreenCertificate (G-REC) to Consumer
    Blockchain-->>Frontend: Transaction Confirmed (Block # & Token ID)
    Frontend->>Backend: Confirm On-Chain Tx Hash
    Backend->>DB: Update settlement_transactions (status = 'ON_CHAIN_SETTLED')
```

---

## 10. Proposed API Module Structure

```mermaid
classDiagram
    class API_V1 {
        +Base: /api/v1
    }

    class HealthRoutes {
        +GET /health : Returns uptime, DB connectivity, and Sepolia contracts
    }

    class AuthRoutes {
        +POST /auth/wallet : Web3 Wallet address nonce / JWT authentication
        +GET /auth/me : Returns authenticated user profile and roles
    }

    class MarketRoutes {
        +GET /market/listings : Query active energy listings (filter by source, price)
        +POST /market/listings : Producer creates new energy listing
        +GET /market/requests : Query active consumer energy requests
        +POST /market/requests : Consumer submits new energy request
        +GET /market/pricing/quote : Rule-based dynamic price quotation
        +GET /market/simulation/feed : Real-time mathematical simulation feed
    }

    class SettlementRoutes {
        +POST /settlement/match : Triggers greedy merit-order double auction
        +GET /settlement/history : Retrieve historical settlement records
    }

    class CertificateRoutes {
        +GET /certificates : List verified REC tokens
        +GET /certificates/verify/:tokenId : Check on-chain REC validity & metadata
        +GET /certificates/calculate-offsets : Estimate carbon savings for volume
    }

    class AdminRoutes {
        +GET /admin/users : Manage registered users
        +GET /admin/pricing-parameters : Retrieve global tariff parameters
        +GET /admin/stats : Platform aggregate KPIs and microgrid telemetry
    }

    API_V1 --> HealthRoutes
    API_V1 --> AuthRoutes
    API_V1 --> MarketRoutes
    API_V1 --> SettlementRoutes
    API_V1 --> CertificateRoutes
    API_V1 --> AdminRoutes
```

---

## 11. Cloud Architecture & AWS Budget Management (<100 Credits)

To adhere strictly to the budget constraint (~100 AWS credits), GreenLedger avoids expensive always-on resources like Hyperledger Fabric, AWS Managed Blockchain, multi-AZ enterprise RDS, or provisioned EKS clusters.

### Cost-Optimized AWS Strategy:
1. **Frontend**: Deployed via **AWS Amplify** (Free Tier eligible; pennies per build and GB transferred).
2. **Backend**: Containerized in a lightweight single **AWS Lambda** instance behind **API Gateway** (Pay-per-request, with millions of free tier invocations) or a modest **t4g.nano/micro** EC2 instance.
3. **Database**: **Amazon RDS PostgreSQL (db.t4g.micro single-AZ)** covered under the AWS 12-Month Free Tier (750 hours/month free).
4. **Static Storage / REC IPFS Metadata Mirror**: **Amazon S3 Standard** (Pennies for megabytes of REC metadata JSON and frontend assets).
5. **Observability**: **Amazon CloudWatch** set to basic 5-minute metrics with strict billing alarm triggers set at **$25, $50, and $75**.
