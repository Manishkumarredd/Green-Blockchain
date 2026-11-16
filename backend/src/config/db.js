const { Pool } = require("pg");
const config = require("./env");

let pool = null;
let isConnected = false;

// Fallback in-memory storage for seamless local development if Postgres is not active
// All pre-seeded accounts have default password: Password123!
const DEFAULT_HASH = "$2b$10$6HMrzf5y6Mt7HgvwPAvse.M0/dPmNoF1MLrvBtXFCiRNEEg1FAro6";

const inMemoryStore = {
  users: [
    { id: 1, wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", email: "admin@greenledger.io", password_hash: DEFAULT_HASH, name: "System Administrator", role: "ADMIN", meter_id: "METER-ADMIN-000", is_active: true, reputation_score: 100 },
    { id: 2, wallet_address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", email: "producer.solarfarm@greenledger.io", password_hash: DEFAULT_HASH, name: "Helios Solar Park", role: "PRODUCER", meter_id: "METER-PROD-SOL-101", is_active: true, reputation_score: 99.2 },
    { id: 3, wallet_address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", email: "producer.windridge@greenledger.io", password_hash: DEFAULT_HASH, name: "AeroFlow Wind Station", role: "PRODUCER", meter_id: "METER-PROD-WND-202", is_active: true, reputation_score: 98.5 },
    { id: 4, wallet_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", email: "producer.hydropeak@greenledger.io", password_hash: DEFAULT_HASH, name: "Cascadia Hydro Plant", role: "PRODUCER", meter_id: "METER-PROD-HYD-303", is_active: true, reputation_score: 99.8 },
    { id: 5, wallet_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", email: "consumer.datacenter@ecotech.com", password_hash: DEFAULT_HASH, name: "EcoCloud Data Center", role: "CONSUMER", meter_id: "METER-CONS-DAT-501", is_active: true, reputation_score: 100 },
    { id: 6, wallet_address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", email: "consumer.hospital@metrohealth.org", password_hash: DEFAULT_HASH, name: "Metro Green Hospital", role: "CONSUMER", meter_id: "METER-CONS-HOS-502", is_active: true, reputation_score: 99.7 },
    { id: 7, wallet_address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", email: "consumer.residential@ecovillage.org", password_hash: DEFAULT_HASH, name: "Sunburst Eco-Community", role: "CONSUMER", meter_id: "METER-CONS-RES-503", is_active: true, reputation_score: 97.4 }
  ],
  listings: [
    { id: 1, producer_id: 2, energy_source: "SOLAR", quantity_kwh: 150, available_kwh: 150, unit_price_eth: "0.000088", status: "ACTIVE" },
    { id: 2, producer_id: 3, energy_source: "WIND", quantity_kwh: 300, available_kwh: 300, unit_price_eth: "0.000082", status: "ACTIVE" },
    { id: 3, producer_id: 4, energy_source: "HYDRO", quantity_kwh: 100, available_kwh: 100, unit_price_eth: "0.000094", status: "ACTIVE" }
  ],
  requests: [
    { id: 1, consumer_id: 6, requested_kwh: 80, allocated_kwh: 0, max_acceptable_price_eth: "0.000120", priority_weight: 2.0, status: "PENDING" },
    { id: 2, consumer_id: 5, requested_kwh: 200, allocated_kwh: 0, max_acceptable_price_eth: "0.000100", priority_weight: 1.5, status: "PENDING" },
    { id: 3, consumer_id: 7, requested_kwh: 50, allocated_kwh: 0, max_acceptable_price_eth: "0.000090", priority_weight: 1.0, status: "PENDING" }
  ],
  settlements: [],
  certificates: []
};

function initDatabase() {
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
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });

      pool.on("error", (err) => {
        console.warn("[PostgreSQL] Unexpected pool client error:", err.message);
      });
    } catch (err) {
      console.warn("[PostgreSQL] Could not initialize PostgreSQL pool. Using in-memory store.");
    }
  }
}

initDatabase();

async function query(text, params) {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.warn(`[PostgreSQL Query Failed: "${text.substring(0, 50)}..."]`, err.message);
      throw err;
    }
  }
  throw new Error("Database pool is not initialized. Check your PostgreSQL connection parameters.");
}

async function testConnection() {
  if (!pool) return { connected: false, message: "Pool not configured, running in mock simulation mode" };
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW() as current_time");
    client.release();
    isConnected = true;
    return { connected: true, timestamp: res.rows[0].current_time };
  } catch (error) {
    isConnected = false;
    return { connected: false, error: error.message };
  }
}

module.exports = {
  query,
  testConnection,
  inMemoryStore,
  get isConnected() {
    return isConnected;
  },
};
