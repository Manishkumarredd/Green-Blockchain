-- ==============================================================================
-- GreenLedger Database Seed Data (PostgreSQL)
-- Realistic Simulated Data for Producers, Consumers, and Initial Market State
-- ==============================================================================

-- 1. Insert Initial Platform Admin & Users (Default password: Password123!)
INSERT INTO users (id, wallet_address, email, password_hash, name, role, meter_id, reputation_score) VALUES
(1, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'admin@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'System Administrator', 'ADMIN', 'METER-ADMIN-000', 100.00),
(2, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'producer.solarfarm@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'Helios Solar Park', 'PRODUCER', 'METER-PROD-SOL-101', 99.20),
(3, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'producer.windridge@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'AeroFlow Wind Station', 'PRODUCER', 'METER-PROD-WND-202', 98.50),
(4, '0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'producer.hydropeak@greenledger.io', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'Cascadia Hydro Plant', 'PRODUCER', 'METER-PROD-HYD-303', 99.80),
(5, '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 'consumer.datacenter@ecotech.com', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'EcoCloud Data Center', 'CONSUMER', 'METER-CONS-DAT-501', 100.00),
(6, '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', 'consumer.hospital@metrohealth.org', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'Metro Green Hospital', 'CONSUMER', 'METER-CONS-HOS-502', 99.70),
(7, '0x976EA74026E726554dB657fA54763abd0C3a0aa9', 'consumer.residential@ecovillage.org', '$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6', 'Sunburst Eco-Community', 'CONSUMER', 'METER-CONS-RES-503', 97.40);

-- Reset user sequence to avoid collision
ALTER SEQUENCE users_id_seq RESTART WITH 10;

-- 2. Insert Producer Profiles
INSERT INTO producer_profiles (user_id, energy_source, capacity_kw, base_price_per_kwh, location_grid, total_energy_produced_kwh, total_earnings_eth) VALUES
(2, 'SOLAR', 250.00, 0.00008500, 'Microgrid-Alpha-Sector-1', 12500.00, 1.06250000),
(3, 'WIND', 500.00, 0.00007800, 'Microgrid-Alpha-Sector-4', 38000.00, 2.96400000),
(4, 'HYDRO', 180.00, 0.00009200, 'Microgrid-Alpha-Sector-2', 8900.00, 0.81880000);

-- 3. Insert Consumer Profiles
INSERT INTO consumer_profiles (user_id, priority_tier, max_budget_per_kwh, total_energy_consumed_kwh, total_carbon_saved_kg) VALUES
(5, 'COMMERCIAL', 0.00011000, 22000.00, 18040.00),
(6, 'CRITICAL', 0.00013000, 15000.00, 12300.00),
(7, 'STANDARD', 0.00009500, 4500.00, 3690.00);

-- 4. Insert Global System Dynamic Pricing Parameters
INSERT INTO system_pricing_parameters (id, base_grid_tariff_eth, peak_demand_multiplier, off_peak_multiplier, carbon_intensity_factor_kg_per_kwh, admin_commission_rate, updated_by) VALUES
(1, 0.00010000, 1.25, 0.85, 0.8200, 0.015, 1);

-- 5. Insert Active Energy Listings
INSERT INTO energy_listings (id, producer_id, energy_source, quantity_kwh, available_kwh, unit_price_eth, min_purchase_kwh, status, listing_window_start, listing_window_end) VALUES
(1, 2, 'SOLAR', 150.00, 150.00, 0.00008800, 5.00, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '8 hours'),
(2, 3, 'WIND', 300.00, 300.00, 0.00008200, 10.00, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '12 hours'),
(3, 4, 'HYDRO', 100.00, 100.00, 0.00009400, 5.00, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 hours');

ALTER SEQUENCE energy_listings_id_seq RESTART WITH 10;

-- 6. Insert Active Energy Demands / Requests
INSERT INTO energy_requests (id, consumer_id, requested_kwh, allocated_kwh, max_acceptable_price_eth, priority_weight, urgency_level, status) VALUES
(1, 6, 80.00, 0.00, 0.00012000, 2.00, 'HIGH', 'PENDING'),     -- Hospital (Critical priority)
(2, 5, 200.00, 0.00, 0.00010000, 1.50, 'NORMAL', 'PENDING'),   -- Data Center (Commercial)
(3, 7, 50.00, 0.00, 0.00009000, 1.00, 'FLEXIBLE', 'PENDING');   -- Residential Eco-village

ALTER SEQUENCE energy_requests_id_seq RESTART WITH 10;

-- 7. Insert Historical Simulated Generation Logs
INSERT INTO simulated_generation_logs (producer_id, solar_irradiance_w_m2, wind_speed_m_s, ambient_temp_c, calculated_output_kwh) VALUES
(2, 850.50, 2.10, 29.40, 142.30),
(3, 0.00, 9.40, 21.00, 285.60),
(4, 0.00, 1.50, 18.20, 98.40);

-- 8. Insert Completed Benchmark Allocation Cycle & Historical Settlement
INSERT INTO allocation_cycles (id, cycle_number, algorithm_used, total_demand_kwh, total_supply_kwh, clearing_price_eth, matched_orders_count, execution_status) VALUES
(1, 1001, 'DEMAND_AWARE_WEIGHTED_PROPORTIONAL', 330.00, 550.00, 0.00008650, 3, 'COMPLETED');

ALTER SEQUENCE allocation_cycles_id_seq RESTART WITH 10;

INSERT INTO settlement_transactions (id, trade_hash, allocation_cycle_id, listing_id, request_id, producer_id, consumer_id, energy_amount_kwh, unit_price_eth, total_amount_eth, carbon_saved_kg, settlement_status, tx_hash, block_number, settled_at) VALUES
(1, '0x4f87ab29124beaf84c01d4a0293db19c43ef21190d65b7987ca9910d938b8192', 1, 1, 1, 2, 6, 80.00, 0.00008800, 0.00704000, 65.60, 'ON_CHAIN_SETTLED', '0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91', 5839210, CURRENT_TIMESTAMP - INTERVAL '1 hour');

ALTER SEQUENCE settlement_transactions_id_seq RESTART WITH 10;

-- 9. Insert Historical Verified Renewable Energy Certificate
INSERT INTO renewable_energy_certificates (id, token_id, transaction_id, owner_address, producer_address, energy_amount_kwh, carbon_offset_kg, energy_source, token_uri, is_retired) VALUES
(1, 1, 1, '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 80.00, 65.60, 'SOLAR', 'https://greenledger.io/rec/token/1.json', FALSE);

ALTER SEQUENCE renewable_energy_certificates_id_seq RESTART WITH 10;
