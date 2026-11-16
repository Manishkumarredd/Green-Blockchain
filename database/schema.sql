-- ==============================================================================
-- GreenLedger Database Schema (PostgreSQL)
-- Blockchain-based Peer-to-Peer Renewable Energy Trading Platform
-- ==============================================================================

-- Drop tables if they already exist (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS simulated_generation_logs CASCADE;
DROP TABLE IF EXISTS renewable_energy_certificates CASCADE;
DROP TABLE IF EXISTS settlement_transactions CASCADE;
DROP TABLE IF EXISTS allocation_cycles CASCADE;
DROP TABLE IF EXISTS energy_requests CASCADE;
DROP TABLE IF EXISTS energy_listings CASCADE;
DROP TABLE IF EXISTS consumer_profiles CASCADE;
DROP TABLE IF EXISTS producer_profiles CASCADE;
DROP TABLE IF EXISTS system_pricing_parameters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 1. Users and Profiles
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PRODUCER', 'CONSUMER', 'ADMIN')),
    meter_id VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    reputation_score NUMERIC(5, 2) DEFAULT 100.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE producer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    energy_source VARCHAR(30) NOT NULL CHECK (energy_source IN ('SOLAR', 'WIND', 'HYDRO', 'BIOMASS', 'HYBRID')),
    capacity_kw NUMERIC(10, 2) NOT NULL,
    base_price_per_kwh NUMERIC(16, 8) NOT NULL,
    location_grid VARCHAR(100) NOT NULL,
    total_energy_produced_kwh NUMERIC(14, 2) DEFAULT 0.00,
    total_earnings_eth NUMERIC(18, 8) DEFAULT 0.00000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consumer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority_tier VARCHAR(20) DEFAULT 'STANDARD' CHECK (priority_tier IN ('CRITICAL', 'COMMERCIAL', 'STANDARD', 'LOW_PRIORITY')),
    max_budget_per_kwh NUMERIC(16, 8) NOT NULL,
    total_energy_consumed_kwh NUMERIC(14, 2) DEFAULT 0.00,
    total_carbon_saved_kg NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. System Dynamic Pricing & Global Parameters
-- ------------------------------------------------------------------------------
CREATE TABLE system_pricing_parameters (
    id SERIAL PRIMARY KEY,
    base_grid_tariff_eth NUMERIC(16, 8) NOT NULL DEFAULT 0.00012000,
    peak_demand_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.25,
    off_peak_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 0.85,
    carbon_intensity_factor_kg_per_kwh NUMERIC(6, 4) NOT NULL DEFAULT 0.8200, -- Regional grid baseline: 0.82 kg CO2 / kWh
    admin_commission_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.015, -- 1.5% platform fee
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. Energy Listings & Consumer Demands
-- ------------------------------------------------------------------------------
CREATE TABLE energy_listings (
    id SERIAL PRIMARY KEY,
    producer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    energy_source VARCHAR(30) NOT NULL,
    quantity_kwh NUMERIC(12, 2) NOT NULL,
    available_kwh NUMERIC(12, 2) NOT NULL,
    unit_price_eth NUMERIC(16, 8) NOT NULL,
    min_purchase_kwh NUMERIC(10, 2) DEFAULT 1.00,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED')),
    listing_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    listing_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_status ON energy_listings(status);
CREATE INDEX idx_listings_price ON energy_listings(unit_price_eth);

CREATE TABLE energy_requests (
    id SERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_kwh NUMERIC(12, 2) NOT NULL,
    allocated_kwh NUMERIC(12, 2) DEFAULT 0.00,
    max_acceptable_price_eth NUMERIC(16, 8) NOT NULL,
    priority_weight NUMERIC(5, 2) DEFAULT 1.00,
    urgency_level VARCHAR(20) DEFAULT 'NORMAL' CHECK (urgency_level IN ('HIGH', 'NORMAL', 'FLEXIBLE')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MATCHED', 'PARTIALLY_MATCHED', 'FULFILLED', 'REJECTED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_status ON energy_requests(status);

-- ------------------------------------------------------------------------------
-- 4. Allocation Cycles & Matching Engine Logs
-- ------------------------------------------------------------------------------
CREATE TABLE allocation_cycles (
    id SERIAL PRIMARY KEY,
    cycle_number INT UNIQUE NOT NULL,
    algorithm_used VARCHAR(50) NOT NULL DEFAULT 'WEIGHTED_PROPORTIONAL_GREEDY',
    total_demand_kwh NUMERIC(14, 2) NOT NULL,
    total_supply_kwh NUMERIC(14, 2) NOT NULL,
    clearing_price_eth NUMERIC(16, 8),
    matched_orders_count INT DEFAULT 0,
    execution_status VARCHAR(20) DEFAULT 'COMPLETED',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. Settlement Transactions & On-Chain Reference
-- ------------------------------------------------------------------------------
CREATE TABLE settlement_transactions (
    id SERIAL PRIMARY KEY,
    trade_hash VARCHAR(66) UNIQUE NOT NULL,
    allocation_cycle_id INT REFERENCES allocation_cycles(id),
    listing_id INT REFERENCES energy_listings(id),
    request_id INT REFERENCES energy_requests(id),
    producer_id INT NOT NULL REFERENCES users(id),
    consumer_id INT NOT NULL REFERENCES users(id),
    energy_amount_kwh NUMERIC(12, 2) NOT NULL,
    unit_price_eth NUMERIC(16, 8) NOT NULL,
    total_amount_eth NUMERIC(16, 8) NOT NULL,
    carbon_saved_kg NUMERIC(10, 2) NOT NULL,
    settlement_status VARCHAR(20) DEFAULT 'PENDING' CHECK (settlement_status IN ('PENDING', 'ON_CHAIN_SETTLED', 'FAILED', 'DISPUTED')),
    tx_hash VARCHAR(66),
    block_number BIGINT,
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_trade_hash ON settlement_transactions(trade_hash);
CREATE INDEX idx_transactions_parties ON settlement_transactions(producer_id, consumer_id);

-- ------------------------------------------------------------------------------
-- 6. Renewable Energy Certificates (ERC-721 Representation)
-- ------------------------------------------------------------------------------
CREATE TABLE renewable_energy_certificates (
    id SERIAL PRIMARY KEY,
    token_id BIGINT UNIQUE,
    transaction_id INT REFERENCES settlement_transactions(id),
    owner_address VARCHAR(42) NOT NULL,
    producer_address VARCHAR(42) NOT NULL,
    energy_amount_kwh NUMERIC(12, 2) NOT NULL,
    carbon_offset_kg NUMERIC(10, 2) NOT NULL,
    energy_source VARCHAR(30) NOT NULL,
    token_uri VARCHAR(255),
    is_retired BOOLEAN DEFAULT FALSE,
    retired_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rec_owner ON renewable_energy_certificates(owner_address);

-- ------------------------------------------------------------------------------
-- 7. Simulated Generation & Telemetry Data
-- ------------------------------------------------------------------------------
CREATE TABLE simulated_generation_logs (
    id SERIAL PRIMARY KEY,
    producer_id INT NOT NULL REFERENCES users(id),
    solar_irradiance_w_m2 NUMERIC(8, 2),
    wind_speed_m_s NUMERIC(6, 2),
    ambient_temp_c NUMERIC(5, 2),
    calculated_output_kwh NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. Audit Trail & Platform Monitoring
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
