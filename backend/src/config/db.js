const { Pool } = require("pg");
const config = require("./env");

let pool = null;
let isConnected = false;
let connectionTested = false;
let cachedTestResult = null;

// Default password hash: "Password123!"
const DEFAULT_HASH = "$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6";

// Dual-Mode In-Memory Store mirroring all 12 Normalized PostgreSQL Tables
const inMemoryStore = {
  users: [
    { id: 1, full_name: "System Administrator", email: "admin@greenledger.io", password_hash: DEFAULT_HASH, role: "ADMIN", wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", meter_id: "METER-ADMIN-000", account_status: "ACTIVE", reputation_score: 100.0, created_at: new Date() },
    { id: 2, full_name: "Helios Solar Park", email: "producer.solarfarm@greenledger.io", password_hash: DEFAULT_HASH, role: "PRODUCER", wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", meter_id: "METER-PROD-SOL-101", account_status: "ACTIVE", reputation_score: 99.2, created_at: new Date() },
    { id: 3, full_name: "AeroFlow Wind Station", email: "producer.windridge@greenledger.io", password_hash: DEFAULT_HASH, role: "PRODUCER", wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", meter_id: "METER-PROD-WND-202", account_status: "ACTIVE", reputation_score: 98.5, created_at: new Date() },
    { id: 4, full_name: "Cascadia Hydro Plant", email: "producer.hydropeak@greenledger.io", password_hash: DEFAULT_HASH, role: "PRODUCER", wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", meter_id: "METER-PROD-HYD-303", account_status: "ACTIVE", reputation_score: 99.8, created_at: new Date() },
    { id: 5, full_name: "EcoCloud Data Center", email: "consumer.datacenter@ecotech.com", password_hash: DEFAULT_HASH, role: "CONSUMER", wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", meter_id: "METER-CONS-DAT-501", account_status: "ACTIVE", reputation_score: 100.0, created_at: new Date() },
    { id: 6, full_name: "Metro Green Hospital", email: "consumer.hospital@metrohealth.org", password_hash: DEFAULT_HASH, role: "CONSUMER", wallet_address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", meter_id: "METER-CONS-HOS-502", account_status: "ACTIVE", reputation_score: 99.7, created_at: new Date() },
    { id: 7, full_name: "Sunburst Eco-Community", email: "consumer.residential@ecovillage.org", password_hash: DEFAULT_HASH, role: "CONSUMER", wallet_address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", meter_id: "METER-CONS-RES-503", account_status: "ACTIVE", reputation_score: 97.4, created_at: new Date() }
  ],
  energy_listings: [
    { id: 1, producer_id: 2, energy_source: "SOLAR", total_energy_kwh: 250, available_energy_kwh: 150, price_per_kwh: "0.00008800", listing_status: "ACTIVE", min_purchase_kwh: 5.0, created_at: new Date() },
    { id: 2, producer_id: 3, energy_source: "WIND", total_energy_kwh: 500, available_energy_kwh: 300, price_per_kwh: "0.00008200", listing_status: "ACTIVE", min_purchase_kwh: 10.0, created_at: new Date() },
    { id: 3, producer_id: 4, energy_source: "HYDRO", total_energy_kwh: 180, available_energy_kwh: 100, price_per_kwh: "0.00009400", listing_status: "ACTIVE", min_purchase_kwh: 5.0, created_at: new Date() },
    { id: 4, producer_id: 2, energy_source: "SOLAR", total_energy_kwh: 100, available_energy_kwh: 100, price_per_kwh: "0.00009100", listing_status: "ACTIVE", min_purchase_kwh: 5.0, created_at: new Date() }
  ],
  energy_requests: [
    { id: 1, consumer_id: 6, listing_id: 1, requested_energy_kwh: 80, priority_weight: 2.0, request_status: "PENDING", max_acceptable_price: "0.00012000", urgency_level: "HIGH", message: "Backup priority power for emergency ICU ward", created_at: new Date(Date.now() - 3600000 * 4) },
    { id: 2, consumer_id: 5, listing_id: 2, requested_energy_kwh: 200, priority_weight: 1.5, request_status: "PENDING", max_acceptable_price: "0.00010000", urgency_level: "NORMAL", message: "Clean green power for cloud server racks", created_at: new Date(Date.now() - 3600000 * 8) },
    { id: 3, consumer_id: 7, listing_id: 3, requested_energy_kwh: 50, priority_weight: 1.0, request_status: "PENDING", max_acceptable_price: "0.00009000", urgency_level: "FLEXIBLE", message: "Residential community evening charging", created_at: new Date(Date.now() - 3600000 * 12) }
  ],
  allocation_results: [
    { id: 1, total_available_energy: 550, total_requested_energy: 330, total_allocated_energy: 330, algorithm_name: "DEMAND_AWARE_WEIGHTED_PROPORTIONAL", jain_fairness_index: 0.9842, execution_time_ms: 1.45, created_at: new Date() }
  ],
  allocation_details: [
    { id: 1, allocation_result_id: 1, consumer_id: 6, requested_energy_kwh: 80, allocated_energy_kwh: 80, unfulfilled_energy_kwh: 0, fulfillment_ratio: 1.0 },
    { id: 2, allocation_result_id: 1, consumer_id: 5, requested_energy_kwh: 200, allocated_energy_kwh: 200, unfulfilled_energy_kwh: 0, fulfillment_ratio: 1.0 },
    { id: 3, allocation_result_id: 1, consumer_id: 7, requested_energy_kwh: 50, allocated_energy_kwh: 50, unfulfilled_energy_kwh: 0, fulfillment_ratio: 1.0 }
  ],
  pricing_history: [
    { id: 1, base_price: "0.00012000", supply_quantity: 650, demand_quantity: 330, supply_demand_ratio: 1.9697, calculated_price: "0.00008650", minimum_price: "0.00007500", maximum_price: "0.00015000", created_at: new Date() },
    { id: 2, base_price: "0.00012000", supply_quantity: 550, demand_quantity: 420, supply_demand_ratio: 1.3095, calculated_price: "0.00009120", minimum_price: "0.00007500", maximum_price: "0.00015000", created_at: new Date() }
  ],
  energy_transactions: [
    { id: 1, producer_id: 2, consumer_id: 6, listing_id: 1, energy_quantity_kwh: 80, price_per_kwh: "0.00008800", total_amount: "0.00704000", transaction_status: "SETTLED", blockchain_transaction_hash: "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91", created_at: new Date() },
    { id: 2, producer_id: 3, consumer_id: 5, listing_id: 2, energy_quantity_kwh: 200, price_per_kwh: "0.00008200", total_amount: "0.01640000", transaction_status: "SETTLED", blockchain_transaction_hash: "0x7b1c3e9812a048db6c4e09f123bc89a012d984cf019348b01293cb84a9123fe4", created_at: new Date() }
  ],
  carbon_records: [
    { id: 1, transaction_id: 1, renewable_energy_kwh: 80, grid_emission_factor: 0.82, estimated_carbon_savings: 65.6, created_at: new Date() },
    { id: 2, transaction_id: 2, renewable_energy_kwh: 200, grid_emission_factor: 0.82, estimated_carbon_savings: 164.0, created_at: new Date() }
  ],
  green_certificates: [
    { id: 1, transaction_id: 1, certificate_number: "GL-REC-2026-0001", owner_id: 6, energy_quantity_kwh: 80, carbon_savings: 65.6, blockchain_certificate_id: 1, blockchain_transaction_hash: "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91", certificate_status: "ISSUED", created_at: new Date() },
    { id: 2, transaction_id: 2, certificate_number: "GL-REC-2026-0002", owner_id: 5, energy_quantity_kwh: 200, carbon_savings: 164.0, blockchain_certificate_id: 2, blockchain_transaction_hash: "0x7b1c3e9812a048db6c4e09f123bc89a012d984cf019348b01293cb84a9123fe4", certificate_status: "ISSUED", created_at: new Date() }
  ],
  blockchain_transactions: [
    { id: 1, application_transaction_id: 1, transaction_hash: "0x9a8f3b1940c213498f7e2d192cb9120349a8f4c10293df1029e84b01293c8a91", contract_address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", network_name: "Sepolia", transaction_type: "SETTLEMENT", transaction_status: "CONFIRMED", block_number: 5839210, created_at: new Date() },
    { id: 2, application_transaction_id: 2, transaction_hash: "0x7b1c3e9812a048db6c4e09f123bc89a012d984cf019348b01293cb84a9123fe4", contract_address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", network_name: "Sepolia", transaction_type: "SETTLEMENT", transaction_status: "CONFIRMED", block_number: 5839242, created_at: new Date() }
  ],
  platform_settings: [
    { id: 1, setting_key: "base_grid_tariff_eth", setting_value: "0.00012000", updated_at: new Date() },
    { id: 2, setting_key: "peak_demand_multiplier", setting_value: "1.25", updated_at: new Date() },
    { id: 3, setting_key: "off_peak_multiplier", setting_value: "0.85", updated_at: new Date() },
    { id: 4, setting_key: "grid_emission_factor_kg_per_kwh", setting_value: "0.8200", updated_at: new Date() },
    { id: 5, setting_key: "platform_commission_rate", setting_value: "0.015", updated_at: new Date() }
  ],
  activity_logs: [
    { id: 1, user_id: 1, action: "SYSTEM_STARTUP", description: "Platform initialized with Phase 4 Normalized Schema", created_at: new Date() }
  ]
};

// Aliases for backward-compatibility with Phase 1/3 references
inMemoryStore.listings = inMemoryStore.energy_listings;
inMemoryStore.requests = inMemoryStore.energy_requests;
inMemoryStore.settlements = inMemoryStore.energy_transactions;
inMemoryStore.certificates = inMemoryStore.green_certificates;

function initDatabase() {
  if (process.env.USE_IN_MEMORY_DB === "true") {
    console.log("[PostgreSQL] USE_IN_MEMORY_DB=true is set. Operating in ultra-fast zero-latency in-memory store.");
    pool = null;
    isConnected = false;
    connectionTested = true;
    cachedTestResult = { connected: false, mode: "IN_MEMORY", message: "Zero-latency in-memory normalized store active." };
    return;
  }

  if (config.DB.DATABASE_URL || config.DB.HOST) {
    try {
      pool = new Pool({
        connectionString: config.DB.DATABASE_URL || undefined,
        host: config.DB.HOST,
        port: config.DB.PORT,
        database: config.DB.NAME,
        user: config.DB.USER,
        password: config.DB.PASSWORD,
        ssl: config.DB.SSL ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 1000, // Reduced from 3000 to 1000 for faster fail-fast
      });

      pool.on("error", (err) => {
        console.warn("[PostgreSQL] Pool client error:", err.message);
        isConnected = false;
      });
    } catch (err) {
      console.warn("[PostgreSQL] Could not initialize pool. Active in-memory fallback enabled.");
      pool = null;
      isConnected = false;
    }
  }
}

initDatabase();

async function query(text, params = []) {
  if (pool && isConnected) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.warn(`[PostgreSQL Query Error: "${text.substring(0, 60)}..."]`, err.message);
      // If connection broke, mark isConnected false so subsequent queries fail-fast to inMemoryStore
      isConnected = false;
      throw err;
    }
  }
  throw new Error("PostgreSQL pool is not connected. In-memory store active.");
}

async function getClient() {
  if (!pool || !isConnected) throw new Error("PostgreSQL client unavailable. Pool not connected.");
  return await pool.connect();
}

async function testConnection(forceRefresh = false) {
  if (cachedTestResult && !forceRefresh) {
    return cachedTestResult;
  }

  if (!pool) {
    cachedTestResult = { connected: false, mode: "IN_MEMORY", message: "Running in-memory dual-mode store (<1ms latency)" };
    connectionTested = true;
    isConnected = false;
    return cachedTestResult;
  }

  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW() as current_time");
    client.release();
    isConnected = true;
    cachedTestResult = { connected: true, mode: "POSTGRESQL", timestamp: res.rows[0].current_time };
    connectionTested = true;
    return cachedTestResult;
  } catch (error) {
    isConnected = false;
    // Drain and shut down unreachable pool to avoid lingering DNS threads and timeouts
    try {
      pool.end();
    } catch (_) {}
    pool = null;
    cachedTestResult = { connected: false, mode: "IN_MEMORY", message: "RDS unreachable. Running in-memory dual-mode store (<1ms latency)", error: error.message };
    connectionTested = true;
    return cachedTestResult;
  }
}

module.exports = {
  query,
  getClient,
  testConnection,
  inMemoryStore,
  get isConnected() {
    return isConnected;
  },
};
