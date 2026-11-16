const path = require("path");
const dotenv = require("dotenv");

// Load .env from root if available, otherwise backend local
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    NAME: process.env.DB_NAME || "greenledger_db",
    USER: process.env.DB_USER || "postgres",
    PASSWORD: process.env.DB_PASSWORD || "postgres",
    SSL: process.env.DB_SSL === "true",
    DATABASE_URL: process.env.DATABASE_URL || "",
  },

  JWT: {
    SECRET: process.env.JWT_SECRET || "greenledger_default_secret_key_change_in_production_32char",
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  },

  BLOCKCHAIN: {
    SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    SETTLEMENT_CONTRACT: process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
    CERTIFICATE_CONTRACT: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
};
