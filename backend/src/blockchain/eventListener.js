const { ethers } = require("ethers");
const { query, inMemoryStore } = require("../config/db");
const { getDeploymentManifest, getEnergyTradingContract, getGreenCertificateContract } = require("./contractService");
const { getProvider } = require("./provider");

let isSyncing = false;

/**
 * Synchronize on-chain events to PostgreSQL and inMemoryStore.
 * Idempotent: checks existing transaction_hash, blockchain_certificate_id, etc.
 */
async function syncBlockchainEvents(fromBlock = 0) {
  if (isSyncing) return { status: "ALREADY_SYNCING" };
  isSyncing = true;

  const summary = {
    settlementsSynced: 0,
    certificatesSynced: 0,
    errors: []
  };

  try {
    const provider = getProvider();
    if (!provider) {
      isSyncing = false;
      return { status: "PROVIDER_UNAVAILABLE", summary };
    }

    const manifest = getDeploymentManifest();
    const tradingContract = getEnergyTradingContract(provider);
    const certContract = getGreenCertificateContract(provider);

    // 1. Sync TradeSettled events
    try {
      const tradeSettledFilter = tradingContract.filters.TradeSettled();
      const events = await tradingContract.queryFilter(tradeSettledFilter, fromBlock, "latest").catch(() => []);

      for (const ev of events) {
        const { tradeHash, producer, consumer, energyAmountKwh, totalAmountWei, certificateTokenId } = ev.args;
        const txHash = ev.transactionHash;
        const blockNumber = ev.blockNumber;

        // Idempotent upsert into blockchain_transactions
        try {
          await query(
            `INSERT INTO blockchain_transactions 
              (transaction_hash, contract_address, network_name, transaction_type, transaction_status, block_number, created_at)
             VALUES ($1, $2, $3, 'SETTLEMENT', 'CONFIRMED', $4, NOW())
             ON CONFLICT (transaction_hash) DO NOTHING`,
            [txHash, manifest.contracts.EnergyTrading.address, manifest.network || "Sepolia", blockNumber]
          );
        } catch {
          if (!inMemoryStore.blockchain_transactions.some((t) => t.transaction_hash === txHash)) {
            inMemoryStore.blockchain_transactions.push({
              id: inMemoryStore.blockchain_transactions.length + 1,
              transaction_hash: txHash,
              contract_address: manifest.contracts.EnergyTrading.address,
              network_name: manifest.network || "Sepolia",
              transaction_type: "SETTLEMENT",
              transaction_status: "CONFIRMED",
              block_number: blockNumber,
              created_at: new Date()
            });
          }
        }

        // Idempotent sync to activity_logs
        try {
          await query(
            `INSERT INTO activity_logs (user_id, action, description, created_at)
             VALUES (1, 'BLOCKCHAIN_SYNC', $1, NOW())`,
            [`Synchronized on-chain settlement for trade ${tradeHash.substring(0, 10)}... (Block: ${blockNumber})`]
          );
        } catch {
          inMemoryStore.activity_logs.push({
            id: inMemoryStore.activity_logs.length + 1,
            user_id: 1,
            action: "BLOCKCHAIN_SYNC",
            description: `Synchronized on-chain settlement for trade ${tradeHash.substring(0, 10)}... (Block: ${blockNumber})`,
            created_at: new Date()
          });
        }

        summary.settlementsSynced++;
      }
    } catch (err) {
      summary.errors.push(`TradeSettled sync: ${err.message}`);
    }

    // 2. Sync CertificateMinted events
    try {
      const certFilter = certContract.filters.CertificateMinted();
      const certEvents = await certContract.queryFilter(certFilter, fromBlock, "latest").catch(() => []);

      for (const ev of certEvents) {
        const { tokenId, producer, consumer, energyAmountKwh, carbonSavedGrams, energySource, tradeHash } = ev.args;
        const certId = Number(tokenId);
        const txHash = ev.transactionHash;

        // Check if certificate already exists in green_certificates
        let exists = false;
        try {
          const res = await query("SELECT id FROM green_certificates WHERE blockchain_certificate_id = $1 LIMIT 1", [certId]);
          exists = res.rows.length > 0;
        } catch {
          exists = inMemoryStore.green_certificates.some((c) => c.blockchain_certificate_id === certId);
        }

        if (!exists) {
          const certNumber = `GL-REC-2026-${String(certId).padStart(4, "0")}`;
          const carbonKg = (Number(carbonSavedGrams) / 1000).toFixed(2);

          try {
            await query(
              `INSERT INTO green_certificates 
                (certificate_number, owner_id, energy_quantity_kwh, carbon_savings, blockchain_certificate_id, blockchain_transaction_hash, certificate_status, created_at)
               VALUES ($1, 5, $2, $3, $4, $5, 'ISSUED', NOW())`,
              [certNumber, Number(energyAmountKwh), carbonKg, certId, txHash]
            );
          } catch {
            inMemoryStore.green_certificates.push({
              id: inMemoryStore.green_certificates.length + 1,
              certificate_number: certNumber,
              owner_id: 5,
              energy_quantity_kwh: Number(energyAmountKwh),
              carbon_savings: carbonKg,
              blockchain_certificate_id: certId,
              blockchain_transaction_hash: txHash,
              certificate_status: "ISSUED",
              created_at: new Date()
            });
          }
          summary.certificatesSynced++;
        }
      }
    } catch (err) {
      summary.errors.push(`CertificateMinted sync: ${err.message}`);
    }
  } catch (globalErr) {
    summary.errors.push(globalErr.message);
  } finally {
    isSyncing = false;
  }

  return {
    status: "COMPLETED",
    summary
  };
}

module.exports = {
  syncBlockchainEvents
};
