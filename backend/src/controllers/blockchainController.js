const { getNetworkInfo } = require("../blockchain/provider");
const { getContractsMetadata } = require("../blockchain/contractService");
const {
  prepareTradeTransaction,
  recordBlockchainTransaction,
  getTransactionDetails
} = require("../blockchain/transactionService");
const { verifyCertificate, getAllCertificates } = require("../blockchain/certificateService");
const { syncBlockchainEvents } = require("../blockchain/eventListener");
const { sendSuccess, sendError } = require("../utils/responseHandler");

/**
 * GET /api/v1/blockchain/network
 */
async function getNetwork(req, res) {
  try {
    const networkInfo = await getNetworkInfo();
    return sendSuccess(res, networkInfo, "Network information retrieved successfully");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * GET /api/v1/blockchain/contracts
 */
async function getContracts(req, res) {
  try {
    const contractsData = getContractsMetadata();
    return sendSuccess(res, contractsData, "Contract manifests retrieved successfully");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * GET /api/v1/blockchain/transactions/:id
 */
async function getTransaction(req, res) {
  try {
    const { id } = req.params;
    const tx = await getTransactionDetails(id);
    if (!tx) {
      return sendError(res, `Transaction "${id}" not found`, 404);
    }
    return sendSuccess(res, tx, "Transaction details retrieved successfully");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * POST /api/v1/blockchain/trades/:id/prepare
 */
async function prepareTrade(req, res) {
  try {
    const { id } = req.params;
    const { walletAddress, action } = req.body || {};
    const prepared = await prepareTradeTransaction(id, walletAddress, action || "settle");
    return sendSuccess(res, prepared, "Transaction prepared for client submission");
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

/**
 * POST /api/v1/blockchain/trades/:id/confirm
 */
async function confirmTrade(req, res) {
  try {
    const { id } = req.params;
    const { transactionHash, contractAddress, networkName, transactionType } = req.body || {};

    if (!transactionHash) {
      return sendError(res, "transactionHash is required to confirm trade", 400);
    }

    const recorded = await recordBlockchainTransaction({
      applicationTransactionId: id,
      transactionHash,
      contractAddress: contractAddress || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      networkName: networkName || "Sepolia",
      transactionType: transactionType || "SETTLEMENT",
      status: "CONFIRMED"
    });

    return sendSuccess(res, recorded, "Trade confirmation recorded successfully");
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

/**
 * GET /api/v1/blockchain/certificates
 */
async function getCertificates(req, res) {
  try {
    const certificates = await getAllCertificates(req.query);
    return sendSuccess(res, certificates, "Certificates retrieved successfully");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

/**
 * GET /api/v1/blockchain/certificates/:id/verify
 */
async function verifyCertificateEndpoint(req, res) {
  try {
    const { id } = req.params;
    const verification = await verifyCertificate(id);
    return sendSuccess(res, verification, "Certificate verified successfully");
  } catch (err) {
    return sendError(res, err.message, 404);
  }
}

/**
 * POST /api/v1/blockchain/sync
 */
async function triggerSync(req, res) {
  try {
    const fromBlock = req.body?.fromBlock ? parseInt(req.body.fromBlock, 10) : 0;
    const result = await syncBlockchainEvents(fromBlock);
    return sendSuccess(res, result, "Blockchain event synchronization initiated");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getNetwork,
  getContracts,
  getTransaction,
  prepareTrade,
  confirmTrade,
  getCertificates,
  verifyCertificateEndpoint,
  triggerSync
};
