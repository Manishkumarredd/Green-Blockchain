/**
 * GreenLedger Phase 11 - System Latency, Database & API Performance Benchmark
 */

const http = require("http");
const https = require("https");
const { Pool } = require("../backend/node_modules/pg");
const config = require("../backend/src/config/env");

const CLOUD_API_BASE = "https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1";

function measureHttpsLatency(url, iterations = 10) {
  return new Promise((resolve) => {
    const latencies = [];
    let completed = 0;

    function runReq() {
      const start = process.hrtime();
      https.get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          const diff = process.hrtime(start);
          const ms = diff[0] * 1000 + diff[1] / 1000000;
          latencies.push(ms);
          completed++;
          if (completed < iterations) {
            runReq();
          } else {
            latencies.sort((a, b) => a - b);
            const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            const min = latencies[0];
            const max = latencies[latencies.length - 1];
            const p95 = latencies[Math.floor(latencies.length * 0.95)];
            resolve({ url, iterations, avgMs: Number(avg.toFixed(2)), minMs: Number(min.toFixed(2)), maxMs: Number(max.toFixed(2)), p95Ms: Number(p95.toFixed(2)) });
          }
        });
      }).on("error", (err) => {
        resolve({ url, error: err.message });
      });
    }

    runReq();
  });
}

async function measureDatabasePerformance() {
  console.log("Measuring Amazon RDS PostgreSQL Query Performance...");
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
  const dbMetrics = {};

  try {
    // 1. Simple Indexed SELECT
    const selectLatencies = [];
    for (let i = 0; i < 20; i++) {
      const start = process.hrtime();
      await client.query("SELECT * FROM energy_listings WHERE listing_status = 'ACTIVE' LIMIT 10");
      const diff = process.hrtime(start);
      selectLatencies.push(diff[0] * 1000 + diff[1] / 1000000);
    }
    const avgSelect = selectLatencies.reduce((a, b) => a + b, 0) / selectLatencies.length;
    dbMetrics.selectListingsAvgMs = Number(avgSelect.toFixed(2));

    // 2. Complex Join (Transactions + Users + Carbon + Certificates)
    const joinLatencies = [];
    for (let i = 0; i < 20; i++) {
      const start = process.hrtime();
      await client.query(`
        SELECT 
          t.id, t.energy_quantity_kwh, t.price_per_kwh, t.total_amount,
          p.full_name as producer_name,
          c.full_name as consumer_name,
          cr.estimated_carbon_savings,
          gc.certificate_number
        FROM energy_transactions t
        LEFT JOIN users p ON t.producer_id = p.id
        LEFT JOIN users c ON t.consumer_id = c.id
        LEFT JOIN carbon_records cr ON cr.transaction_id = t.id
        LEFT JOIN green_certificates gc ON gc.transaction_id = t.id
        LIMIT 20
      `);
      const diff = process.hrtime(start);
      joinLatencies.push(diff[0] * 1000 + diff[1] / 1000000);
    }
    const avgJoin = joinLatencies.reduce((a, b) => a + b, 0) / joinLatencies.length;
    dbMetrics.complexJoinAvgMs = Number(avgJoin.toFixed(2));

    // 3. EXPLAIN ANALYZE on marketplace query
    const explainRes = await client.query("EXPLAIN ANALYZE SELECT * FROM energy_listings WHERE listing_status = 'ACTIVE'");
    dbMetrics.explainAnalyze = explainRes.rows.map(r => r["QUERY PLAN"]);

  } finally {
    client.release();
    await pool.end();
  }

  return dbMetrics;
}

async function main() {
  console.log("================================================================================");
  console.log("GREENLEDGER SYSTEM PERFORMANCE & LATENCY EVALUATION");
  console.log("================================================================================");

  console.log("\n1. Measuring Live Cloud API Endpoints (AWS API Gateway + Lambda)...");
  const healthPerf = await measureHttpsLatency(`${CLOUD_API_BASE}/health`, 10);
  console.log("Health API Latency:", healthPerf);

  const listingsPerf = await measureHttpsLatency(`${CLOUD_API_BASE}/marketplace/listings`, 10);
  console.log("Listings API Latency:", listingsPerf);

  const contractsPerf = await measureHttpsLatency(`${CLOUD_API_BASE}/blockchain/contracts`, 10);
  console.log("Contracts API Latency:", contractsPerf);

  const verifyPerf = await measureHttpsLatency(`${CLOUD_API_BASE}/blockchain/certificates/1/verify`, 10);
  console.log("Verify Certificate API Latency:", verifyPerf);

  console.log("\n2. Measuring RDS PostgreSQL Latency...");
  const dbPerf = await measureDatabasePerformance();
  console.log("Database Query Metrics (RDS Sydney):", dbPerf);

  const results = {
    apiLatencies: {
      health: healthPerf,
      marketplaceListings: listingsPerf,
      blockchainContracts: contractsPerf,
      certificateVerification: verifyPerf,
    },
    databasePerformance: dbPerf,
    evaluatedAt: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  fs.writeFileSync(path.resolve(__dirname, "../docs/system_performance_results.json"), JSON.stringify(results, null, 2), "utf8");
  console.log("\n>>> PERFORMANCE RESULTS SAVED TO docs/system_performance_results.json <<<");
}

main().catch(console.error);
