const db = require("../config/db");
const config = require("../config/env");

async function getHealth(req, res) {
  const dbStatus = await db.testConnection();

  res.status(200).json({
    success: true,
    platform: "GreenLedger P2P Energy Trading API",
    version: "1.0.0",
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    blockchain: {
      network: "Ethereum Sepolia (ChainId: 11155111)",
      settlementContract: config.BLOCKCHAIN.SETTLEMENT_CONTRACT,
      certificateContract: config.BLOCKCHAIN.CERTIFICATE_CONTRACT,
    },
  });
}

module.exports = {
  getHealth,
};
