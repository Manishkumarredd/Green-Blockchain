const fs = require("fs");
const path = require("path");
const db = require("./db");

async function runMigrations() {
  console.log("--- Starting GreenLedger PostgreSQL Migration ---");
  const health = await db.testConnection();
  if (!health.connected) {
    console.log(`[PostgreSQL Status] Offline or unreachable: ${health.error || health.message}`);
    console.log("[Notice] Dual-mode in-memory repository is active for development and automated testing.");
    return;
  }

  try {
    const schemaSql = fs.readFileSync(path.resolve(__dirname, "../../../database/schema.sql"), "utf8");
    console.log("[Migration] Applying database/schema.sql...");
    await db.query(schemaSql);
    console.log("[Migration] Schema applied successfully.");

    const seedSql = fs.readFileSync(path.resolve(__dirname, "../../../database/seed.sql"), "utf8");
    console.log("[Migration] Applying database/seed.sql...");
    await db.query(seedSql);
    console.log("[Migration] Demonstration seed data populated successfully.");
    console.log("--- GreenLedger Migration Complete ---");
  } catch (err) {
    console.error("[Migration Error]", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = runMigrations;
