const express = require("express");
const router = express.Router();
const blockchainController = require("../controllers/blockchainController");

// Public Network & Contracts Info
router.get("/network", blockchainController.getNetwork);
router.get("/contracts", blockchainController.getContracts);

// Public Certificate Verification (No auth required)
router.get("/certificates", blockchainController.getCertificates);
router.get("/certificates/:id/verify", blockchainController.verifyCertificateEndpoint);

// Transaction Details
router.get("/transactions/:id", blockchainController.getTransaction);

// Trade Transaction Preparation & Confirmation
router.post("/trades/:id/prepare", blockchainController.prepareTrade);
router.post("/trades/:id/confirm", blockchainController.confirmTrade);

// Event Sync
router.post("/sync", blockchainController.triggerSync);

module.exports = router;
