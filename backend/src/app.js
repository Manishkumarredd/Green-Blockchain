const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config/env");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const { errorMiddleware, notFoundHandler } = require("./middleware/errorMiddleware");

// Route modules
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const producerRoutes = require("./routes/producerRoutes");
const consumerRoutes = require("./routes/consumerRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const allocationRoutes = require("./routes/allocationRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const carbonRoutes = require("./routes/carbonRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Security & Parsing
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

if (config.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting in non-test environments
if (config.NODE_ENV !== "test") {
  app.use("/api", apiLimiter);
}

// Root welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "GreenLedger P2P Renewable Energy Trading REST API",
    version: "2.0.0",
    docs: "/api/v1/health",
  });
});

// Helper to mount routes on both prefixed and unprefixed paths
function mountModularRoutes(basePath) {
  app.use(`${basePath}/health`, healthRoutes);
  app.use(`${basePath}/auth`, authRoutes);
  app.use(`${basePath}/users`, userRoutes);
  app.use(`${basePath}/producers`, producerRoutes);
  app.use(`${basePath}/consumers`, consumerRoutes);
  app.use(`${basePath}/marketplace`, marketplaceRoutes);
  app.use(`${basePath}/allocation`, allocationRoutes);
  app.use(`${basePath}/pricing`, pricingRoutes);
  app.use(`${basePath}/transactions`, transactionRoutes);
  app.use(`${basePath}/carbon`, carbonRoutes);
  app.use(`${basePath}/certificates`, certificateRoutes);
  app.use(`${basePath}/admin`, adminRoutes);

  // Backward-compatibility aliases for Phase 1/3 endpoints
  app.use(`${basePath}/market`, marketplaceRoutes);
  app.use(`${basePath}/settlement`, transactionRoutes);
}

mountModularRoutes("/api/v1");
mountModularRoutes("/api");

// Catch-all 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorMiddleware);

module.exports = app;
