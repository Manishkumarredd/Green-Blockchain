-- ==============================================================================
-- GreenLedger Normalized PostgreSQL Database Schema
-- Phase 4: Production-Grade P2P Renewable Energy Trading Platform
-- ==============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS blockchain_transactions CASCADE;
DROP TABLE IF EXISTS green_certificates CASCADE;
DROP TABLE IF EXISTS carbon_records CASCADE;
DROP TABLE IF EXISTS energy_transactions CASCADE;
DROP TABLE IF EXISTS pricing_history CASCADE;
DROP TABLE IF EXISTS allocation_details CASCADE;
DROP TABLE IF EXISTS allocation_results CASCADE;
DROP TABLE IF EXISTS energy_requests CASCADE;
DROP TABLE IF EXISTS energy_listings CASCADE;
DROP TABLE IF EXISTS consumer_profiles CASCADE;
DROP TABLE IF EXISTS producer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 1. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PRODUCER', 'CONSUMER', 'ADMIN')),
    wallet_address VARCHAR(42) UNIQUE,
    meter_id VARCHAR(100) UNIQUE NOT NULL,
    account_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    nonce VARCHAR(100),
    phone VARCHAR(30),
    reputation_score NUMERIC(5, 2) DEFAULT 100.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_meter ON users(meter_id);

-- Optional extended profiles for domain-specific metrics
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
-- 2. Energy Listings Table
-- ------------------------------------------------------------------------------
CREATE TABLE energy_listings (
    id SERIAL PRIMARY KEY,
    producer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    energy_source VARCHAR(30) NOT NULL CHECK (energy_source IN ('SOLAR', 'WIND', 'HYDRO', 'BIOMASS', 'HYBRID')),
    total_energy_kwh NUMERIC(12, 2) NOT NULL CHECK (total_energy_kwh > 0),
    available_energy_kwh NUMERIC(12, 2) NOT NULL CHECK (available_energy_kwh >= 0 AND available_energy_kwh <= total_energy_kwh),
    price_per_kwh NUMERIC(16, 8) NOT NULL CHECK (price_per_kwh > 0),
    listing_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (listing_status IN ('ACTIVE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED')),
    min_purchase_kwh NUMERIC(10, 2) DEFAULT 1.00,
    listing_window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    listing_window_end TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_producer ON energy_listings(producer_id);
CREATE INDEX idx_listings_status ON energy_listings(listing_status);
CREATE INDEX idx_listings_source ON energy_listings(energy_source);
CREATE INDEX idx_listings_price ON energy_listings(price_per_kwh);
CREATE INDEX idx_listings_avail ON energy_listings(available_energy_kwh);

-- ------------------------------------------------------------------------------
-- 3. Energy Requests Table
-- ------------------------------------------------------------------------------
CREATE TABLE energy_requests (
    id SERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_energy_kwh NUMERIC(12, 2) NOT NULL CHECK (requested_energy_kwh > 0),
    priority_weight NUMERIC(5, 2) DEFAULT 1.00 CHECK (priority_weight >= 1.0),
    request_status VARCHAR(20) DEFAULT 'PENDING' CHECK (request_status IN ('PENDING', 'MATCHED', 'PARTIALLY_MATCHED', 'FULFILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')),
    max_acceptable_price NUMERIC(16, 8),
    urgency_level VARCHAR(20) DEFAULT 'NORMAL' CHECK (urgency_level IN ('HIGH', 'NORMAL', 'FLEXIBLE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_consumer ON energy_requests(consumer_id);
CREATE INDEX idx_requests_status ON energy_requests(request_status);
CREATE INDEX idx_requests_priority ON energy_requests(priority_weight);

-- ------------------------------------------------------------------------------
-- 4. Allocation Results Table
-- ------------------------------------------------------------------------------
CREATE TABLE allocation_results (
    id SERIAL PRIMARY KEY,
    total_available_energy NUMERIC(14, 2) NOT NULL,
    total_requested_energy NUMERIC(14, 2) NOT NULL,
    total_allocated_energy NUMERIC(14, 2) NOT NULL,
    algorithm_name VARCHAR(50) NOT NULL,
    jain_fairness_index NUMERIC(6, 4),
    execution_time_ms NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_allocation_results_algo ON allocation_results(algorithm_name);
CREATE INDEX idx_allocation_results_created ON allocation_results(created_at);

-- ------------------------------------------------------------------------------
-- 5. Allocation Details Table
-- ------------------------------------------------------------------------------
CREATE TABLE allocation_details (
    id SERIAL PRIMARY KEY,
    allocation_result_id INT NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_energy_kwh NUMERIC(12, 2) NOT NULL,
    allocated_energy_kwh NUMERIC(12, 2) NOT NULL,
    unfulfilled_energy_kwh NUMERIC(12, 2) NOT NULL,
    fulfillment_ratio NUMERIC(5, 4) NOT NULL
);

CREATE INDEX idx_allocation_details_result ON allocation_details(allocation_result_id);
CREATE INDEX idx_allocation_details_consumer ON allocation_details(consumer_id);

-- ------------------------------------------------------------------------------
-- 6. Pricing History Table
-- ------------------------------------------------------------------------------
CREATE TABLE pricing_history (
    id SERIAL PRIMARY KEY,
    base_price NUMERIC(16, 8) NOT NULL,
    supply_quantity NUMERIC(14, 2) NOT NULL,
    demand_quantity NUMERIC(14, 2) NOT NULL,
    supply_demand_ratio NUMERIC(8, 4) NOT NULL,
    calculated_price NUMERIC(16, 8) NOT NULL,
    minimum_price NUMERIC(16, 8) NOT NULL,
    maximum_price NUMERIC(16, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_history_created ON pricing_history(created_at);

-- ------------------------------------------------------------------------------
-- 7. Energy Transactions Table
-- ------------------------------------------------------------------------------
CREATE TABLE energy_transactions (
    id SERIAL PRIMARY KEY,
    producer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    listing_id INT REFERENCES energy_listings(id) ON DELETE SET NULL,
    energy_quantity_kwh NUMERIC(12, 2) NOT NULL CHECK (energy_quantity_kwh > 0),
    price_per_kwh NUMERIC(16, 8) NOT NULL CHECK (price_per_kwh > 0),
    total_amount NUMERIC(18, 8) NOT NULL CHECK (total_amount > 0),
    transaction_status VARCHAR(20) DEFAULT 'PENDING' CHECK (transaction_status IN ('PENDING', 'CONFIRMED', 'SETTLED', 'FAILED', 'DISPUTED')),
    blockchain_transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_energy_tx_producer ON energy_transactions(producer_id);
CREATE INDEX idx_energy_tx_consumer ON energy_transactions(consumer_id);
CREATE INDEX idx_energy_tx_status ON energy_transactions(transaction_status);
CREATE INDEX idx_energy_tx_hash ON energy_transactions(blockchain_transaction_hash);

-- ------------------------------------------------------------------------------
-- 8. Carbon Records Table
-- ------------------------------------------------------------------------------
CREATE TABLE carbon_records (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES energy_transactions(id) ON DELETE SET NULL,
    renewable_energy_kwh NUMERIC(12, 2) NOT NULL,
    grid_emission_factor NUMERIC(6, 4) NOT NULL DEFAULT 0.8200, -- 0.8200 kg CO2 / kWh
    estimated_carbon_savings NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carbon_tx ON carbon_records(transaction_id);

-- ------------------------------------------------------------------------------
-- 9. Green Certificates Table (ERC-721 Representation)
-- ------------------------------------------------------------------------------
CREATE TABLE green_certificates (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES energy_transactions(id) ON DELETE SET NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    energy_quantity_kwh NUMERIC(12, 2) NOT NULL,
    carbon_savings NUMERIC(12, 2) NOT NULL,
    blockchain_certificate_id BIGINT UNIQUE,
    blockchain_transaction_hash VARCHAR(66),
    certificate_status VARCHAR(20) DEFAULT 'ISSUED' CHECK (certificate_status IN ('PENDING', 'ISSUED', 'RETIRED', 'TRANSFERRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cert_owner ON green_certificates(owner_id);
CREATE INDEX idx_cert_status ON green_certificates(certificate_status);
CREATE INDEX idx_cert_number ON green_certificates(certificate_number);

-- ------------------------------------------------------------------------------
-- 10. Blockchain Transactions Table
-- ------------------------------------------------------------------------------
CREATE TABLE blockchain_transactions (
    id SERIAL PRIMARY KEY,
    application_transaction_id INT REFERENCES energy_transactions(id) ON DELETE SET NULL,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    network_name VARCHAR(50) DEFAULT 'Sepolia',
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('SETTLEMENT', 'REC_MINT', 'REC_TRANSFER', 'REC_RETIRE')),
    transaction_status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (transaction_status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chain_tx_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_chain_app_tx ON blockchain_transactions(application_transaction_id);

-- ------------------------------------------------------------------------------
-- 11. Platform Settings Table
-- ------------------------------------------------------------------------------
CREATE TABLE platform_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON platform_settings(setting_key);

-- ------------------------------------------------------------------------------
-- 12. Activity Logs Table
-- ------------------------------------------------------------------------------
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

-- ------------------------------------------------------------------------------
-- Backward-Compatibility Views for Legacy Phase 1/3 References
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW settlement_transactions AS
SELECT 
    id,
    blockchain_transaction_hash AS trade_hash,
    NULL::INT AS allocation_cycle_id,
    listing_id,
    NULL::INT AS request_id,
    producer_id,
    consumer_id,
    energy_quantity_kwh AS energy_amount_kwh,
    price_per_kwh AS unit_price_eth,
    total_amount AS total_amount_eth,
    0.00 AS carbon_saved_kg,
    transaction_status AS settlement_status,
    blockchain_transaction_hash AS tx_hash,
    NULL::BIGINT AS block_number,
    created_at AS settled_at,
    created_at
FROM energy_transactions;

CREATE OR REPLACE VIEW renewable_energy_certificates AS
SELECT 
    id,
    blockchain_certificate_id AS token_id,
    transaction_id,
    NULL::VARCHAR AS owner_address,
    NULL::VARCHAR AS producer_address,
    energy_quantity_kwh AS energy_amount_kwh,
    carbon_savings AS carbon_offset_kg,
    'SOLAR'::VARCHAR AS energy_source,
    NULL::VARCHAR AS token_uri,
    (certificate_status = 'RETIRED') AS is_retired,
    NULL::TIMESTAMP AS retired_at,
    created_at AS issued_at
FROM green_certificates;
