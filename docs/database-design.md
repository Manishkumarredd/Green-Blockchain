# GreenLedger Database Design Document

## 1. Overview

The GreenLedger relational persistence layer is designed for **PostgreSQL 15+** to manage off-chain market orders, user identities, telemetry logs, and on-chain settlement receipts. The database separates transactional market activity from blockchain settlement anchors, ensuring atomic transactions and sub-second query performance.

---

## 2. Entity Relational Design

The schema is divided into four logical domains:
1. **Identity & Roles**: `users`, `producer_profiles`, `consumer_profiles`
2. **Order Book & Market**: `energy_listings`, `energy_requests`, `system_pricing_parameters`
3. **Clearing & Settlement**: `allocation_cycles`, `settlement_transactions`
4. **Green Certificates & Telemetry**: `renewable_energy_certificates`, `simulated_generation_logs`, `audit_logs`

---

## 3. Data Dictionary

### 3.1. `users`
Stores all platform participants and maps them to their Ethereum wallet addresses and simulated smart meters.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique internal user identifier |
| `wallet_address` | `VARCHAR(42)` | `UNIQUE`, `NOT NULL` | Ethereum address (0x...) |
| `email` | `VARCHAR(255)` | `UNIQUE` | Optional contact email |
| `name` | `VARCHAR(120)` | `NOT NULL` | Display name / entity label |
| `role` | `VARCHAR(20)` | `NOT NULL`, `CHECK (role IN ('PRODUCER', 'CONSUMER', 'ADMIN'))` | System role |
| `meter_id` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | Simulated smart meter identifier |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Platform participation status |
| `reputation_score` | `NUMERIC(5,2)` | `DEFAULT 100.00` | Dynamic reliability rating |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Last modification timestamp |

### 3.2. `producer_profiles`
Extended operational metadata for energy producers (microgrids).

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Profile record ID |
| `user_id` | `INT` | `REFERENCES users(id) ON DELETE CASCADE` | Associated user ID |
| `energy_source` | `VARCHAR(30)` | `NOT NULL`, `CHECK ('SOLAR', 'WIND', 'HYDRO', 'BIOMASS', 'HYBRID')` | Generation technology |
| `capacity_kw` | `NUMERIC(10,2)` | `NOT NULL` | Peak nameplate capacity in kW |
| `base_price_per_kwh` | `NUMERIC(16,8)` | `NOT NULL` | Floor ask price in ETH |
| `location_grid` | `VARCHAR(100)` | `NOT NULL` | Substation / microgrid sector identifier |
| `total_energy_produced_kwh` | `NUMERIC(14,2)` | `DEFAULT 0.00` | Lifetime generated kWh |
| `total_earnings_eth` | `NUMERIC(18,8)` | `DEFAULT 0.00000000` | Lifetime ETH earned |

### 3.3. `consumer_profiles`
Extended operational metadata for energy consumers.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Profile record ID |
| `user_id` | `INT` | `REFERENCES users(id) ON DELETE CASCADE` | Associated user ID |
| `priority_tier` | `VARCHAR(20)` | `CHECK ('CRITICAL', 'COMMERCIAL', 'STANDARD', 'LOW_PRIORITY')` | Priority tier for weighted allocation |
| `max_budget_per_kwh` | `NUMERIC(16,8)` | `NOT NULL` | Maximum bid price in ETH |
| `total_energy_consumed_kwh` | `NUMERIC(14,2)` | `DEFAULT 0.00` | Lifetime consumed clean kWh |
| `total_carbon_saved_kg` | `NUMERIC(14,2)` | `DEFAULT 0.00` | Lifetime CO2 emissions avoided |

### 3.4. `energy_listings`
Active and historical renewable energy supply orders.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Listing ID |
| `producer_id` | `INT` | `REFERENCES users(id) ON DELETE RESTRICT` | Producer user ID |
| `energy_source` | `VARCHAR(30)` | `NOT NULL` | Clean generation source |
| `quantity_kwh` | `NUMERIC(12,2)` | `NOT NULL` | Initial energy listed in kWh |
| `available_kwh` | `NUMERIC(12,2)` | `NOT NULL` | Remaining unallocated kWh |
| `unit_price_eth` | `NUMERIC(16,8)` | `NOT NULL` | Ask price per kWh in ETH |
| `min_purchase_kwh` | `NUMERIC(10,2)` | `DEFAULT 1.00` | Minimum order increment |
| `status` | `VARCHAR(20)` | `CHECK ('ACTIVE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED')` | Lifecycle status |
| `listing_window_start` | `TIMESTAMPTZ` | `NOT NULL` | Start of delivery interval |
| `listing_window_end` | `TIMESTAMPTZ` | `NOT NULL` | End of delivery interval |

### 3.5. `energy_requests`
Consumer energy demands submitted to the double-auction matching engine.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Request ID |
| `consumer_id` | `INT` | `REFERENCES users(id) ON DELETE RESTRICT` | Consumer user ID |
| `requested_kwh` | `NUMERIC(12,2)` | `NOT NULL` | Total energy needed in kWh |
| `allocated_kwh` | `NUMERIC(12,2)` | `DEFAULT 0.00` | Energy fulfilled so far |
| `max_acceptable_price_eth` | `NUMERIC(16,8)` | `NOT NULL` | Maximum ceiling bid |
| `priority_weight` | `NUMERIC(5,2)` | `DEFAULT 1.00` | Proportional allocation multiplier |
| `urgency_level` | `VARCHAR(20)` | `CHECK ('HIGH', 'NORMAL', 'FLEXIBLE')` | Dispatch preference |
| `status` | `VARCHAR(20)` | `CHECK ('PENDING', 'MATCHED', 'PARTIALLY_MATCHED', 'FULFILLED', 'REJECTED', 'EXPIRED')` | Request status |

### 3.6. `allocation_cycles`
Audit records of discrete batch clearing runs executed by the matching and allocation engines.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Cycle ID |
| `cycle_number` | `INT` | `UNIQUE`, `NOT NULL` | Monotonically increasing cycle number |
| `algorithm_used` | `VARCHAR(50)` | `NOT NULL` | Algorithm identifier |
| `total_demand_kwh` | `NUMERIC(14,2)` | `NOT NULL` | Aggregate demand in cycle |
| `total_supply_kwh` | `NUMERIC(14,2)` | `NOT NULL` | Aggregate supply in cycle |
| `clearing_price_eth` | `NUMERIC(16,8)` | `NULLABLE` | Uniform clearing price if applicable |
| `matched_orders_count` | `INT` | `DEFAULT 0` | Total trades matched |
| `execution_status` | `VARCHAR(20)` | `DEFAULT 'COMPLETED'` | Engine execution result |

### 3.7. `settlement_transactions`
The central transaction record connecting off-chain matched trades with on-chain Ethereum Sepolia receipts.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Transaction ID |
| `trade_hash` | `VARCHAR(66)` | `UNIQUE`, `NOT NULL` | Keccak256 / SHA-256 trade commitment |
| `allocation_cycle_id` | `INT` | `REFERENCES allocation_cycles(id)` | Batch cycle reference |
| `listing_id` | `INT` | `REFERENCES energy_listings(id)` | Matched supply order |
| `request_id` | `INT` | `REFERENCES energy_requests(id)` | Matched demand order |
| `producer_id` | `INT` | `REFERENCES users(id)` | Energy seller |
| `consumer_id` | `INT` | `REFERENCES users(id)` | Energy buyer |
| `energy_amount_kwh` | `NUMERIC(12,2)` | `NOT NULL` | Settled volume in kWh |
| `unit_price_eth` | `NUMERIC(16,8)` | `NOT NULL` | Settled unit price |
| `total_amount_eth` | `NUMERIC(16,8)` | `NOT NULL` | Total cost in ETH |
| `carbon_saved_kg` | `NUMERIC(10,2)` | `NOT NULL` | Avoided CO2 emissions |
| `settlement_status` | `VARCHAR(20)` | `CHECK ('PENDING', 'ON_CHAIN_SETTLED', 'FAILED', 'DISPUTED')` | Settlement state |
| `tx_hash` | `VARCHAR(66)` | `NULLABLE` | Sepolia transaction hash (0x...) |
| `block_number` | `BIGINT` | `NULLABLE` | Sepolia block number |
| `settled_at` | `TIMESTAMPTZ` | `NULLABLE` | Block timestamp |

### 3.8. `renewable_energy_certificates`
Off-chain registry of minted on-chain ERC-721 Renewable Energy Certificates.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Record ID |
| `token_id` | `BIGINT` | `UNIQUE`, `NULLABLE` | ERC-721 token ID on Sepolia |
| `transaction_id` | `INT` | `REFERENCES settlement_transactions(id)` | Source trade settlement |
| `owner_address` | `VARCHAR(42)` | `NOT NULL` | Consumer wallet holding the REC |
| `producer_address` | `VARCHAR(42)` | `NOT NULL` | Producer wallet that generated energy |
| `energy_amount_kwh` | `NUMERIC(12,2)` | `NOT NULL` | Clean energy certified |
| `carbon_offset_kg` | `NUMERIC(10,2)` | `NOT NULL` | Carbon offset certified |
| `energy_source` | `VARCHAR(30)` | `NOT NULL` | SOLAR, WIND, HYDRO |
| `is_retired` | `BOOLEAN` | `DEFAULT FALSE` | True if claimed and retired |

---

## 4. Indexing Strategy

To maintain high throughput during order book scans and matching runs, the following indexes are defined:
1. `idx_users_wallet`: B-Tree index on `users(wallet_address)` for O(1) Web3 authentication lookup.
2. `idx_users_role`: B-Tree index on `users(role)` for fast role-based filtering.
3. `idx_listings_status`: B-Tree index on `energy_listings(status)` to rapidly extract active supply.
4. `idx_listings_price`: B-Tree index on `energy_listings(unit_price_eth)` for merit-order sorting.
5. `idx_requests_status`: B-Tree index on `energy_requests(status)` for pending demand filtering.
6. `idx_transactions_trade_hash`: Unique B-Tree index on `settlement_transactions(trade_hash)` for instant on-chain verification.
7. `idx_rec_owner`: B-Tree index on `renewable_energy_certificates(owner_address)` for consumer portfolio queries.
