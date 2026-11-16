const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config/env");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const marketRoutes = require("./routes/market.routes");
const settlementRoutes = require("./routes/settlement.routes");
const certificateRoutes = require("./routes/certificate.routes");
const adminRoutes = require("./routes/admin.routes");

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// Security and utility middleware
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

// Root welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "GreenLedger P2P Renewable Energy Trading API",
    version: "1.0.0",
    docs: "/api/v1/health",
  });
});

// Mount modular API routes under /api/v1
const prefix = config.API_PREFIX || "/api/v1";
app.use(`${prefix}/health`, healthRoutes);
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/market`, marketRoutes);
app.use(`${prefix}/settlement`, settlementRoutes);
app.use(`${prefix}/certificates`, certificateRoutes);
app.use(`${prefix}/admin`, adminRoutes);

// Catch-all 404 & error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
