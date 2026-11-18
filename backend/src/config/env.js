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
    HOST: process.env.RDS_HOST || process.env.DB_HOST || "localhost",
    PORT: parseInt(process.env.RDS_PORT || process.env.DB_PORT, 10) || 5432,
    NAME: process.env.RDS_DATABASE || process.env.DB_NAME || "postgres",
    USER: process.env.RDS_USER || process.env.DB_USER || "postgres",
    PASSWORD: process.env.RDS_PASSWORD || process.env.DB_PASSWORD || "postgres",
    SSL: process.env.DB_SSL === "true" || process.env.NODE_ENV === "production",
    DATABASE_URL: process.env.DATABASE_URL || "",
  },

  S3: {
    BUCKET_NAME: process.env.S3_DATA_BUCKET || process.env.S3_BUCKET_NAME || "greenledger-data-477579576684-syd",
    REGION: process.env.AWS_REGION || "ap-southeast-2",
  },

  JWT: {
    SECRET: process.env.JWT_SECRET || "greenledger_default_secret_key_change_in_production_32char",
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  },

  BLOCKCHAIN: {
    SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    LOCAL_RPC_URL: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
    NETWORK: process.env.BLOCKCHAIN_NETWORK || "sepolia",
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY || "",
    SETTLEMENT_CONTRACT: process.env.NEXT_PUBLIC_SETTLEMENT_CONTRACT_ADDRESS || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    CERTIFICATE_CONTRACT: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    MARKETPLACE_CONTRACT: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    USER_REGISTRY_CONTRACT: process.env.NEXT_PUBLIC_USER_REGISTRY_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
};
