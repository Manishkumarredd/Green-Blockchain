const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const config = require("./env");

async function runRdsMigration() {
  console.log("==================================================");
  console.log("GREENLEDGER RDS POSTGRESQL SAFE MIGRATION");
  console.log(`Target Host:     ${config.DB.HOST}`);
  console.log(`Target Database: ${config.DB.NAME}`);
  console.log(`User:            ${config.DB.USER}`);
  console.log("==================================================");

  const pool = new Pool({
    host: config.DB.HOST,
    port: config.DB.PORT,
    database: config.DB.NAME,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log("[1/4] Connected to Amazon RDS PostgreSQL successfully.");

    // Check existing tables
    const tableRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const existingTables = tableRes.rows.map((r) => r.table_name);
    console.log(`[2/4] Found ${existingTables.length} existing tables:`, existingTables.join(", "));

    // 1. Users table
    console.log("[3/4] Ensuring all 12 normalized Phase 4-9 tables exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
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

      CREATE TABLE IF NOT EXISTS producer_profiles (
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

      CREATE TABLE IF NOT EXISTS consumer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        priority_tier VARCHAR(20) DEFAULT 'STANDARD' CHECK (priority_tier IN ('CRITICAL', 'COMMERCIAL', 'STANDARD', 'LOW_PRIORITY')),
        max_budget_per_kwh NUMERIC(16, 8) NOT NULL,
        total_energy_consumed_kwh NUMERIC(14, 2) DEFAULT 0.00,
        total_carbon_saved_kg NUMERIC(14, 2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS energy_listings (
        id SERIAL PRIMARY KEY,
        producer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        energy_source VARCHAR(30) NOT NULL CHECK (energy_source IN ('SOLAR', 'WIND', 'HYDRO', 'BIOMASS', 'HYBRID')),
        total_energy_kwh NUMERIC(12, 2) NOT NULL CHECK (total_energy_kwh > 0),
        available_energy_kwh NUMERIC(12, 2) NOT NULL CHECK (available_energy_kwh >= 0),
        price_per_kwh NUMERIC(16, 8) NOT NULL CHECK (price_per_kwh > 0),
        listing_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (listing_status IN ('ACTIVE', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED')),
        min_purchase_kwh NUMERIC(10, 2) DEFAULT 1.00,
        listing_window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        listing_window_end TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS energy_requests (
        id SERIAL PRIMARY KEY,
        consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        listing_id INT REFERENCES energy_listings(id) ON DELETE SET NULL,
        requested_energy_kwh NUMERIC(12, 2) NOT NULL CHECK (requested_energy_kwh > 0),
        priority_weight NUMERIC(4, 2) DEFAULT 1.00,
        request_status VARCHAR(20) DEFAULT 'PENDING' CHECK (request_status IN ('PENDING', 'MATCHED', 'PARTIALLY_FILLED', 'FULFILLED', 'CANCELLED')),
        max_acceptable_price NUMERIC(16, 8),
        urgency_level VARCHAR(20) DEFAULT 'NORMAL',
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS allocation_results (
        id SERIAL PRIMARY KEY,
        total_available_energy NUMERIC(12, 2) NOT NULL,
        total_requested_energy NUMERIC(12, 2) NOT NULL,
        total_allocated_energy NUMERIC(12, 2) NOT NULL,
        algorithm_name VARCHAR(50) NOT NULL,
        jain_fairness_index NUMERIC(6, 4) NOT NULL,
        execution_time_ms NUMERIC(8, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS allocation_details (
        id SERIAL PRIMARY KEY,
        allocation_result_id INT NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
        consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        requested_energy_kwh NUMERIC(12, 2) NOT NULL,
        allocated_energy_kwh NUMERIC(12, 2) NOT NULL,
        unfulfilled_energy_kwh NUMERIC(12, 2) NOT NULL,
        fulfillment_ratio NUMERIC(5, 4) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pricing_history (
        id SERIAL PRIMARY KEY,
        base_price NUMERIC(16, 8) NOT NULL,
        supply_quantity NUMERIC(12, 2) NOT NULL,
        demand_quantity NUMERIC(12, 2) NOT NULL,
        supply_demand_ratio NUMERIC(8, 4) NOT NULL,
        calculated_price NUMERIC(16, 8) NOT NULL,
        minimum_price NUMERIC(16, 8) NOT NULL,
        maximum_price NUMERIC(16, 8) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS energy_transactions (
        id SERIAL PRIMARY KEY,
        producer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        consumer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        listing_id INT REFERENCES energy_listings(id) ON DELETE SET NULL,
        energy_quantity_kwh NUMERIC(12, 2) NOT NULL,
        price_per_kwh NUMERIC(16, 8) NOT NULL,
        total_amount NUMERIC(18, 8) NOT NULL,
        transaction_status VARCHAR(20) DEFAULT 'SETTLED',
        blockchain_transaction_hash VARCHAR(66) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS carbon_records (
        id SERIAL PRIMARY KEY,
        transaction_id INT NOT NULL REFERENCES energy_transactions(id) ON DELETE CASCADE,
        renewable_energy_kwh NUMERIC(12, 2) NOT NULL,
        grid_emission_factor NUMERIC(6, 4) DEFAULT 0.8200,
        estimated_carbon_savings NUMERIC(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS green_certificates (
        id SERIAL PRIMARY KEY,
        transaction_id INT REFERENCES energy_transactions(id) ON DELETE SET NULL,
        certificate_number VARCHAR(50) UNIQUE NOT NULL,
        owner_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        energy_quantity_kwh NUMERIC(12, 2) NOT NULL,
        carbon_savings NUMERIC(12, 2) NOT NULL,
        blockchain_certificate_id INT,
        blockchain_transaction_hash VARCHAR(66),
        certificate_status VARCHAR(20) DEFAULT 'ISSUED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS blockchain_transactions (
        id SERIAL PRIMARY KEY,
        application_transaction_id INT REFERENCES energy_transactions(id) ON DELETE SET NULL,
        transaction_hash VARCHAR(66) UNIQUE NOT NULL,
        contract_address VARCHAR(42) NOT NULL,
        network_name VARCHAR(50) DEFAULT 'Sepolia',
        transaction_type VARCHAR(50) NOT NULL,
        transaction_status VARCHAR(20) DEFAULT 'CONFIRMED',
        block_number BIGINT,
        gas_used VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value VARCHAR(255) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        ip_address VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if initial users exist
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    const count = parseInt(userCount.rows[0].count, 10);
    console.log(`[4/4] Verified table schema. Current user count: ${count}`);

    if (count === 0) {
      console.log("[Notice] Database is empty. Seeding essential platform users & initial listings...");
      const DEFAULT_HASH = "$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6"; // "Password123!"

      await client.query(`
        INSERT INTO users (full_name, email, password_hash, role, wallet_address, meter_id, account_status)
        VALUES 
          ('System Administrator', 'admin@greenledger.io', '${DEFAULT_HASH}', 'ADMIN', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'METER-ADMIN-000', 'ACTIVE'),
          ('Helios Solar Farm', 'producer.solarfarm@greenledger.io', '${DEFAULT_HASH}', 'PRODUCER', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'METER-PROD-SOL-101', 'ACTIVE'),
          ('AeroFlow Wind Station', 'producer.windridge@greenledger.io', '${DEFAULT_HASH}', 'PRODUCER', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'METER-PROD-WND-202', 'ACTIVE'),
          ('EcoCloud Data Center', 'consumer.datacenter@ecotech.com', '${DEFAULT_HASH}', 'CONSUMER', '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 'METER-CONS-DAT-501', 'ACTIVE'),
          ('Metro Green Hospital', 'consumer.hospital@metrohealth.org', '${DEFAULT_HASH}', 'CONSUMER', '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', 'METER-CONS-HOS-502', 'ACTIVE')
        ON CONFLICT (email) DO NOTHING;

        INSERT INTO platform_settings (setting_key, setting_value, description)
        VALUES
          ('base_grid_tariff_eth', '0.00012000', 'Grid baseline tariff reference'),
          ('peak_demand_multiplier', '1.25', 'Peak hours pricing factor'),
          ('off_peak_multiplier', '0.85', 'Off-peak pricing incentive'),
          ('grid_emission_factor_kg_per_kwh', '0.8200', 'Regional CEA carbon emission factor'),
          ('platform_commission_rate', '0.015', 'Platform maintenance commission rate')
        ON CONFLICT (setting_key) DO NOTHING;
      `);
      console.log("[Migration] Core seed users and settings populated successfully.");
    }

    console.log("==================================================");
    console.log("SAFE RDS POSTGRESQL MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("[RDS Migration Error]", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runRdsMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runRdsMigration;
