/**
 * GreenLedger Phase 11 - PostgreSQL Database Integrity & Schema Audit
 */

const { Pool } = require("../backend/node_modules/pg");
const config = require("../backend/src/config/env");

async function checkDatabaseIntegrity() {
  console.log("================================================================================");
  console.log("GREENLEDGER POSTGRESQL DATABASE INTEGRITY & DATA CONSISTENCY AUDIT");
  console.log("================================================================================");

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
    console.log("Connected to RDS PostgreSQL greenledger_db.");

    // 1. Foreign Key Integrity Checks (Orphaned records)
    console.log("\n[1] Checking for orphaned records across foreign key relationships...");
    const orphanChecks = [
      { name: "producer_profiles -> users", sql: "SELECT COUNT(*) FROM producer_profiles pp LEFT JOIN users u ON pp.user_id = u.id WHERE u.id IS NULL" },
      { name: "consumer_profiles -> users", sql: "SELECT COUNT(*) FROM consumer_profiles cp LEFT JOIN users u ON cp.user_id = u.id WHERE u.id IS NULL" },
      { name: "energy_listings -> users", sql: "SELECT COUNT(*) FROM energy_listings el LEFT JOIN users u ON el.producer_id = u.id WHERE u.id IS NULL" },
      { name: "energy_requests -> users", sql: "SELECT COUNT(*) FROM energy_requests er LEFT JOIN users u ON er.consumer_id = u.id WHERE u.id IS NULL" },
      { name: "energy_transactions -> users (buyer/seller)", sql: "SELECT COUNT(*) FROM energy_transactions t LEFT JOIN users p ON t.producer_id = p.id LEFT JOIN users c ON t.consumer_id = c.id WHERE p.id IS NULL OR c.id IS NULL" },
      { name: "green_certificates -> users (owner)", sql: "SELECT COUNT(*) FROM green_certificates gc LEFT JOIN users u ON gc.owner_id = u.id WHERE u.id IS NULL" },
      { name: "carbon_records -> energy_transactions", sql: "SELECT COUNT(*) FROM carbon_records cr LEFT JOIN energy_transactions t ON cr.transaction_id = t.id WHERE t.id IS NULL" },
    ];

    for (const check of orphanChecks) {
      const res = await client.query(check.sql);
      const count = parseInt(res.rows[0].count, 10);
      console.log(`  -> ${check.name}: ${count === 0 ? "PASSED (0 orphans)" : `FAILED (${count} orphans)`}`);
      if (count > 0) throw new Error(`Integrity violation in ${check.name}`);
    }

    // 2. Numerical Precision & Range Validations
    console.log("\n[2] Checking numeric constraints & ranges (No negative energy or prices)...");
    const constraintChecks = [
      { name: "energy_listings: total_energy_kwh > 0", sql: "SELECT COUNT(*) FROM energy_listings WHERE total_energy_kwh <= 0" },
      { name: "energy_listings: available_energy_kwh >= 0 AND <= total_energy_kwh", sql: "SELECT COUNT(*) FROM energy_listings WHERE available_energy_kwh < 0 OR available_energy_kwh > total_energy_kwh" },
      { name: "energy_listings: price_per_kwh > 0", sql: "SELECT COUNT(*) FROM energy_listings WHERE price_per_kwh <= 0" },
      { name: "energy_requests: requested_energy_kwh > 0", sql: "SELECT COUNT(*) FROM energy_requests WHERE requested_energy_kwh <= 0" },
      { name: "energy_transactions: energy_quantity_kwh > 0", sql: "SELECT COUNT(*) FROM energy_transactions WHERE energy_quantity_kwh <= 0" },
      { name: "carbon_records: estimated_carbon_savings >= 0", sql: "SELECT COUNT(*) FROM carbon_records WHERE estimated_carbon_savings < 0" },
    ];

    for (const check of constraintChecks) {
      const res = await client.query(check.sql);
      const count = parseInt(res.rows[0].count, 10);
      console.log(`  -> ${check.name}: ${count === 0 ? "PASSED (0 violations)" : `FAILED (${count} violations)`}`);
      if (count > 0) throw new Error(`Range violation in ${check.name}`);
    }

    // 3. Unique Constraint Audits
    console.log("\n[3] Auditing unique constraints (No duplicates)...");
    const uniqueChecks = [
      { name: "users.email uniqueness", sql: "SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1" },
      { name: "users.meter_id uniqueness", sql: "SELECT meter_id, COUNT(*) FROM users GROUP BY meter_id HAVING COUNT(*) > 1" },
      { name: "green_certificates.certificate_number uniqueness", sql: "SELECT certificate_number, COUNT(*) FROM green_certificates GROUP BY certificate_number HAVING COUNT(*) > 1" },
      { name: "blockchain_transactions.transaction_hash uniqueness", sql: "SELECT transaction_hash, COUNT(*) FROM blockchain_transactions GROUP BY transaction_hash HAVING COUNT(*) > 1" },
    ];

    for (const check of uniqueChecks) {
      const res = await client.query(check.sql);
      const count = res.rows.length;
      console.log(`  -> ${check.name}: ${count === 0 ? "PASSED (No duplicates)" : `FAILED (${count} duplicate sets)`}`);
      if (count > 0) throw new Error(`Duplicate violation in ${check.name}`);
    }

    // 4. Index Inventory
    console.log("\n[4] Querying database indexes...");
    const indexRes = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    console.log(`  -> Found ${indexRes.rows.length} active database indexes across public schema.`);

    console.log("\n" + "=".repeat(80));
    console.log(">>> DATABASE INTEGRITY & DATA CONSISTENCY AUDIT PASSED 100%! <<<");
    console.log("=".repeat(80));
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabaseIntegrity().catch(console.error);
