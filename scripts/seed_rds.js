const fs = require("fs");
const path = require("path");
const { Pool } = require("../backend/node_modules/pg");
const config = require("../backend/src/config/env");

async function seedRds() {
  console.log("Connecting to RDS PostgreSQL greenledger_db...");
  const pool = new Pool({
    host: config.DB.HOST,
    port: config.DB.PORT,
    database: "greenledger_db",
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  try {
    console.log("Connected successfully.");
    console.log("Cleaning and seeding demonstration data...");
    await client.query(`
      TRUNCATE TABLE 
        blockchain_transactions,
        green_certificates,
        carbon_records,
        energy_transactions,
        allocation_details,
        allocation_results,
        pricing_history,
        energy_requests,
        energy_listings,
        platform_settings,
        consumer_profiles,
        producer_profiles,
        activity_logs,
        users
      RESTART IDENTITY CASCADE;
    `);

    const seedSql = fs.readFileSync(path.resolve(__dirname, "../database/seed.sql"), "utf8");
    await client.query(seedSql);
    console.log(">>> DEMONSTRATION SEED DATA POPULATED SUCCESSFULLY ON AMAZON RDS! <<<");

    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM energy_listings) as listings,
        (SELECT COUNT(*) FROM energy_requests) as requests,
        (SELECT COUNT(*) FROM energy_transactions) as transactions,
        (SELECT COUNT(*) FROM green_certificates) as certificates
    `);
    console.log("Record Counts in RDS greenledger_db:", counts.rows[0]);
  } catch (err) {
    console.error("Error seeding RDS:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedRds();
