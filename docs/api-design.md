# GreenLedger REST API Specification (Phase 4 Edition)

## 1. Protocol Architecture & Conventions

- **Base URL**: `/api/v1` (with `/api` compatibility alias)
- **Data Exchange**: JSON (`Content-Type: application/json`)
- **Authentication**: JWT Bearer Token passed via HTTP Header: `Authorization: Bearer <TOKEN>`
- **Security**: Helmet HTTP Headers, Strict CORS whitelist, Rate Limiting (200 req/15min on general APIs, 30 req/15min on Auth).
- **Validation**: Strict schema enforcement using Zod.

### 1.1. Standard Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### 1.2. Standard Error Envelope
```json
{
  "success": false,
  "error": "Validation failed: Total energy must be greater than 0",
  "details": [
    {
      "field": "totalEnergyKwh",
      "message": "Total energy must be greater than 0"
    }
  ]
}
```

---

## 2. API Endpoints Directory

### 2.1. Authentication & Identity (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public (Rate Limited) | Register a new Producer or Consumer account with bcrypt hashing |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Authenticate credentials and receive signed JWT token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Terminate session and confirm token invalidation |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile and verified role |
| `POST` | `/api/v1/auth/nonce` | Public | Generate cryptographic challenge for MetaMask Web3 signature |
| `POST` | `/api/v1/auth/forgot-password`| Public | Neutral password reset dispatch without user enumeration |

### 2.2. Producer Energy Management (`/api/v1/producers`)
*Restricted strictly to authenticated users with role `PRODUCER`.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/producers/listings` | Create a new renewable energy listing (Solar, Wind, Hydro, Biomass, Hybrid) |
| `GET` | `/api/v1/producers/listings` | List all energy listings owned by the calling producer |
| `GET` | `/api/v1/producers/listings/:id`| Retrieve details of a specific owned energy listing |
| `PUT` | `/api/v1/producers/listings/:id`| Update pricing, status, or available kWh of an owned listing |
| `DELETE` | `/api/v1/producers/listings/:id`| Safely delete or cancel a listing (guarded against active transactions) |
| `GET` | `/api/v1/producers/dashboard` | Aggregated metrics: offered kWh, sold kWh, active listings, earnings in ETH |

### 2.3. Consumer Demands & Allocations (`/api/v1/consumers`)
*Restricted strictly to authenticated users with role `CONSUMER`.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/consumers/requests` | Submit an energy demand request with priority weighting (Critical, Standard) |
| `GET` | `/api/v1/consumers/requests` | Retrieve all energy requests submitted by the calling consumer |
| `GET` | `/api/v1/consumers/allocations` | Query historical energy allocations received across market clearing cycles |
| `GET` | `/api/v1/consumers/dashboard` | Aggregated metrics: total requested, fulfilled kWh, spent ETH, carbon avoided |

### 2.4. Public Marketplace (`/api/v1/marketplace`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/marketplace/listings` | Query active listings with search, source filtering, price range, and pagination |
| `GET` | `/api/v1/marketplace/listings/:id` | View detailed listing specifications, producer meter ID, and reputation score |

**Query Parameters for `GET /listings`:**
- `search`: Filter by producer name or energy source keyword.
- `energySource`: `SOLAR`, `WIND`, `HYDRO`, `BIOMASS`, `HYBRID`.
- `minPrice` / `maxPrice`: Numerical price boundaries in ETH/kWh.
- `minEnergy`: Minimum available capacity in kWh.
- `sortBy`: `price_asc`, `price_desc`, `quantity_asc`, `quantity_desc`, `created_desc`.
- `page`: Page index (default: 1).
- `limit`: Items per page (default: 10, max: 100).

### 2.5. Allocation Algorithm Module (`/api/v1/allocation`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/allocation/execute` | Admin | Execute allocation cycle across pending consumer demands and active supply |
| `GET` | `/api/v1/allocation/results` | Authenticated | Retrieve historical allocation cycle execution runs |
| `GET` | `/api/v1/allocation/results/:id`| Authenticated | Inspect itemized consumer fulfillment ratios and unfulfilled demand |
| `GET` | `/api/v1/allocation/compare` | Authenticated | Benchmark comparison: FCFS vs. Basic Proportional vs. Proposed Weighted |

### 2.6. Rule-Based Dynamic Pricing (`/api/v1/pricing`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/pricing/current` | Real-time pricing snapshot based on current grid time-of-use and supply/demand |
| `POST` | `/api/v1/pricing/calculate` | Compute dynamic price formula recommendation based on supply/demand inputs |
| `GET` | `/api/v1/pricing/history` | Retrieve historical dynamic price audit log and clearing records |

### 2.7. Settlement & Energy Transactions (`/api/v1/transactions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/transactions` | Consumer | Settle energy purchase: ACID transaction with row-level locking & overselling guard |
| `GET` | `/api/v1/transactions` | Authenticated | Query transactions filtered by role (Producers see sales, Consumers see purchases) |
| `GET` | `/api/v1/transactions/:id` | Authenticated | View transaction details, carbon record, and blockchain transaction hash |
| `GET` | `/api/v1/transactions/history`| Authenticated | Retrieve transaction history log with status breakdown |

### 2.8. Carbon Savings & Green Certificates (`/api/v1/carbon`, `/api/v1/certificates`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/carbon/summary` | Public | Cumulative clean energy traded, carbon avoided (kg CO2), and tree equivalent |
| `GET` | `/api/v1/carbon/records` | Authenticated | Itemized user carbon offset records linked to completed settlements |
| `GET` | `/api/v1/certificates` | Authenticated | Query Green Renewable Energy Certificates (GL-REC) |
| `GET` | `/api/v1/certificates/:id` | Authenticated | Inspect certificate ownership, energy volume, and cryptographic proofs |
| `GET` | `/api/v1/certificates/verify/:id`| Public | Public verification of certificate validity, authenticity, and status |
| `POST` | `/api/v1/certificates/issue` | Authenticated | Issue ERC-721 certificate representation for confirmed settlement |

### 2.9. Administrator Management (`/api/v1/admin`)
*Strictly restricted to authenticated users with role `ADMIN`.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Platform KPI stats: volume, carbon avoided, active listings, user counts |
| `GET` | `/api/v1/admin/users` | Platform user directory with role, smart meter ID, and account status |
| `GET` | `/api/v1/admin/transactions` | Global ledger of all platform energy trades |
| `GET` | `/api/v1/admin/listings` | Comprehensive directory of all producer energy listings |
| `PUT` | `/api/v1/admin/settings` | Update global parameters (base grid tariff, commission rate, emission factor) |
