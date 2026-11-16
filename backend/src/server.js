const app = require("./app");
const config = require("./config/env");
const db = require("./config/db");

const PORT = config.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log("==================================================");
  console.log(`GreenLedger Backend API running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`API Base URL: http://localhost:${PORT}${config.API_PREFIX}`);
  console.log("==================================================");

  // Check database connectivity
  const dbHealth = await db.testConnection();
  if (dbHealth.connected) {
    console.log(`[PostgreSQL] Connected successfully to ${config.DB.NAME} at ${config.DB.HOST}`);
  } else {
    console.log(`[PostgreSQL Notice] ${dbHealth.message || dbHealth.error}`);
    console.log("[In-Memory Store] Development mock data active for all endpoints.");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Gracefully closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

module.exports = server;
