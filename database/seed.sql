-- ==============================================================================
-- GreenLedger Database Seed Data (PostgreSQL)
-- Phase 4: Realistic Simulated Demonstration Data for P2P Energy Trading
-- ==============================================================================

-- 1. Insert Initial Platform Users (Default password: Password123!)
-- Hash: $2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6
INSERT INTO users (id, full_name, email, password_hash, role, wallet_address, meter_id, account_status, reputation_score) VALUES
(1, 'System Administrator', 'admin@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'ADMIN', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'METER-ADMIN-000', 'ACTIVE', 100.00),
(2, 'Helios Solar Park', 'producer.solarfarm@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'PRODUCER', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'METER-PROD-SOL-101', 'ACTIVE', 99.20),
(3, 'AeroFlow Wind Station', 'producer.windridge@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'PRODUCER', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'METER-PROD-WND-202', 'ACTIVE', 98.50),
(4, 'Cascadia Hydro Plant', 'producer.hydropeak@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'PRODUCER', '0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'METER-PROD-HYD-303', 'ACTIVE', 99.80),
(5, 'EcoCloud Data Center', 'consumer.datacenter@ecotech.com', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'CONSUMER', '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 'METER-CONS-DAT-501', 'ACTIVE', 100.00),
(6, 'Metro Green Hospital', 'consumer.hospital@metrohealth.org', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'CONSUMER', '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', 'METER-CONS-HOS-502', 'ACTIVE', 99.70),
(7, 'Sunburst Eco-Community', 'consumer.residential@ecovillage.org', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'CONSUMER', '0x976EA74026E726554dB657fA54763abd0C3a0aa9', 'METER-CONS-RES-503', 'ACTIVE', 97.40);

ALTER SEQUENCE users_id_seq RESTART WITH 10;

-- 2. Extended Profiles
INSERT INTO producer_profiles (user_id, energy_source, capacity_kw, base_price_per_kwh, location_grid, total_energy_produced_kwh, total_earnings_eth) VALUES
(2, 'SOLAR', 250.00, 0.00008500, 'Microgrid-Alpha-Sector-1', 12500.00, 1.06250000),
(3, 'WIND', 500.00, 0.00007800, 'Microgrid-Alpha-Sector-4', 38000.00, 2.96400000),
(4, 'HYDRO', 180.00, 0.00009200, 'Microgrid-Alpha-Sector-2', 8900.00, 0.81880000);

INSERT INTO consumer_profiles (user_id, priority_tier, max_budget_per_kwh, total_energy_consumed_kwh, total_carbon_saved_kg) VALUES
(5, 'COMMERCIAL', 0.00011000, 22000.00, 18040.00),
(6, 'CRITICAL', 0.00013000, 15000.00, 12300.00),
(7, 'STANDARD', 0.00009500, 4500.00, 3690.00);

-- 3. Insert Platform Settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
('base_grid_tariff_eth', '0.00012000'),
('peak_demand_multiplier', '1.25'),
('off_peak_multiplier', '0.85'),
('grid_emission_factor_kg_per_kwh', '0.8200'),
('platform_commission_rate', '0.015'),
('settlement_chain_id', '11155111'),
('auto_matching_interval_seconds', '300');

-- 4. Insert Active Energy Listings
INSERT INTO energy_listings (id, producer_id, energy_source, total_energy_kwh, available_energy_kwh, price_per_kwh, listing_status, min_purchase_kwh) VALUES
(1, 2, 'SOLAR', 250.00, 150.00, 0.00008800, 'ACTIVE', 5.00),
(2, 3, 'WIND', 500.00, 300.00, 0.00008200, 'ACTIVE', 10.00),
(3, 4, 'HYDRO', 180.00, 100.00, 0.00009400, 'ACTIVE', 5.00),
(4, 2, 'SOLAR', 100.00, 100.00, 0.00009100, 'ACTIVE', 5.00);

ALTER SEQUENCE energy_listings_id_seq RESTART WITH 10;

-- 5. Insert Active Energy Requests
INSERT INTO energy_requests (id, consumer_id, requested_energy_kwh, priority_weight, request_status, max_acceptable_price, urgency_level) VALUES
(1, 6, 80.00, 2.00, 'PENDING', 0.00012000, 'HIGH'),     -- Critical Hospital (Priority 2.0x)
(2, 5, 200.00, 1.50, 'PENDING', 0.00010000, 'NORMAL'),   -- Commercial Data Center (Priority 1.5x)
(3, 7, 50.00, 1.00, 'PENDING', 0.00009000, 'FLEXIBLE');  -- Residential Eco-village (Priority 1.0x)

ALTER SEQUENCE energy_requests_id_seq RESTART WITH 10;

-- 6. Insert Pricing History
INSERT INTO pricing_history (id, base_price, supply_quantity, demand_quantity, supply_demand_ratio, calculated_price, minimum_price, maximum_price) VALUES
(1, 0.00012000, 650.00, 330.00, 1.9697, 0.00008650, 0.00007500, 0.00015000),
(2, 0.00012000, 550.00, 420.00, 1.3095, 0.00009120, 0.00007500, 0.00015000);

ALTER SEQUENCE pricing_history_id_seq RESTART WITH 10;

-- 7. Insert Historical Allocation Results & Details
INSERT INTO allocation_results (id, total_available_energy, total_requested_energy, total_allocated_energy, algorithm_name, jain_fairness_index, execution_time_ms) VALUES
(1, 550.00, 330.00, 330.00, 'DEMAND_AWARE_WEIGHTED_PROPORTIONAL', 0.9842, 1.45);

ALTER SEQUENCE allocation_results_id_seq RESTART WITH 10;

INSERT INTO allocation_details (id, allocation_result_id, consumer_id, requested_energy_kwh, allocated_energy_kwh, unfulfilled_energy_kwh, fulfillment_ratio) VALUES
(1, 1, 6, 80.00, 80.00, 0.00, 1.0000),
(2, 1, 5, 200.00, 200.00, 0.00, 1.0000),
(3, 1, 7, 50.00, 50.00, 0.00, 1.0000);

ALTER SEQUENCE allocation_details_id_seq RESTART WITH 10;

-- 8. Insert Completed Energy Transactions
INSERT INTO energy_transactions (id, producer_id, consumer_id, listing_id, energy_quantity_kwh, price_per_kwh, total_amount, transaction_status, blockchain_transaction_hash) VALUES
(1, 2, 6, 1, 80.00, 0.00008800, 0.00704000, 'SETTLED', '0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91'),
(2, 3, 5, 2, 200.00, 0.00008200, 0.01640000, 'SETTLED', '0x7b1c3e9812a048db6c4e09f123bc89a012d984cf019348b01293cb84a9123fe4');

ALTER SEQUENCE energy_transactions_id_seq RESTART WITH 10;

-- 9. Insert Carbon Records
INSERT INTO carbon_records (id, transaction_id, renewable_energy_kwh, grid_emission_factor, estimated_carbon_savings) VALUES
(1, 1, 80.00, 0.8200, 65.60),
(2, 2, 200.00, 0.8200, 164.00);

ALTER SEQUENCE carbon_records_id_seq RESTART WITH 10;

-- 10. Insert Green Renewable Energy Certificates
INSERT INTO green_certificates (id, transaction_id, certificate_number, owner_id, energy_quantity_kwh, carbon_savings, blockchain_certificate_id, blockchain_transaction_hash, certificate_status) VALUES
(1, 1, 'GL-REC-2026-0001', 6, 80.00, 65.60, 1, '0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91', 'ISSUED'),
(2, 2, 'GL-REC-2026-0002', 5, 200.00, 164.00, 2, '0x7b1c3e9812a048db6c4e09f123bc89a012d984cf019348b01293cb84a9123fe4', 'ISSUED');

ALTER SEQUENCE green_certificates_id_seq RESTART WITH 10;

-- 11. Insert Blockchain Transactions
INSERT INTO blockchain_transactions (id, application_transaction_id, transaction_hash, contract_address, network_name, transaction_type, transaction_status, block_number) VALUES
(1, 1, '0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91', '0x5FbDB2315678afecb367f032d93F642f64180aa3', 'Sepolia', 'SETTLEMENT', 'CONFIRMED', 5839210),
(2, 2, '0x7b1c3e9812a048db6c4e09f123bc89a012d984cf019348b01293cb84a9123fe4', '0x5FbDB2315678afecb367f032d93F642f64180aa3', 'Sepolia', 'SETTLEMENT', 'CONFIRMED', 5839242);

ALTER SEQUENCE blockchain_transactions_id_seq RESTART WITH 10;

-- 12. Insert Activity Logs
INSERT INTO activity_logs (id, user_id, action, description) VALUES
(1, 1, 'SYSTEM_STARTUP', 'Platform initialized with Phase 4 Normalized Schema and Seed Parameters.'),
(2, 2, 'LISTING_CREATED', 'Helios Solar Park listed 250 kWh Solar energy at 0.00008800 ETH/kWh.'),
(3, 6, 'REQUEST_SUBMITTED', 'Metro Green Hospital submitted high-priority request for 80 kWh.'),
(4, 1, 'ALLOCATION_EXECUTED', 'Allocation cycle completed with 100% fulfillment across active demand.');

ALTER SEQUENCE activity_logs_id_seq RESTART WITH 10;
