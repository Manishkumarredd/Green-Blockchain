const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class CertificateService {
  async issueCertificate({ transactionId, requestingUserId }) {
    // 1. Fetch transaction
    let tx = null;
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM energy_transactions WHERE id = $1", [transactionId]);
      tx = res.rows[0];
    } else {
      tx = db.inMemoryStore.energy_transactions.find((t) => t.id === Number(transactionId));
    }

    if (!tx) {
      throw new AppError("Referenced transaction not found.", 404);
    }

    // 2. Check if a certificate has already been issued for this transaction
    let existing = null;
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM green_certificates WHERE transaction_id = $1", [transactionId]);
      existing = res.rows[0];
    } else {
      existing = db.inMemoryStore.green_certificates.find((c) => c.transaction_id === Number(transactionId));
    }

    if (existing) {
      throw new AppError(`Certificate has already been issued for transaction #${transactionId} (${existing.certificate_number}).`, 409);
    }

    const year = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const certNumber = `GL-REC-${year}-${transactionId.toString().padStart(4, "0")}-${randomHex}`;
    const carbonSavings = Number((Number(tx.energy_quantity_kwh) * 0.82).toFixed(2));

    if (db.isConnected) {
      const res = await db.query(
        `INSERT INTO green_certificates (transaction_id, certificate_number, owner_id, energy_quantity_kwh, carbon_savings, certificate_status)
         VALUES ($1, $2, $3, $4, $5, 'ISSUED')
         RETURNING *`,
        [transactionId, certNumber, tx.consumer_id, tx.energy_quantity_kwh, carbonSavings]
      );
      return res.rows[0];
    } else {
      const newCert = {
        id: db.inMemoryStore.green_certificates.length + 1,
        transaction_id: Number(transactionId),
        certificate_number: certNumber,
        owner_id: tx.consumer_id,
        energy_quantity_kwh: Number(tx.energy_quantity_kwh),
        carbon_savings: carbonSavings,
        blockchain_certificate_id: null,
        blockchain_transaction_hash: null,
        certificate_status: "ISSUED",
        created_at: new Date(),
      };
      db.inMemoryStore.green_certificates.push(newCert);
      return newCert;
    }
  }

  async getCertificates(userId = null, role = "ADMIN") {
    if (db.isConnected) {
      const condition = role === "ADMIN" || !userId ? "1=1" : "gc.owner_id = $1";
      const params = role === "ADMIN" || !userId ? [] : [userId];
      const sql = `
        SELECT 
          gc.*,
          u.full_name as owner_name,
          u.wallet_address as owner_wallet,
          t.producer_id,
          p.full_name as producer_name,
          l.energy_source
        FROM green_certificates gc
        JOIN users u ON gc.owner_id = u.id
        LEFT JOIN energy_transactions t ON gc.transaction_id = t.id
        LEFT JOIN users p ON t.producer_id = p.id
        LEFT JOIN energy_listings l ON t.listing_id = l.id
        WHERE ${condition}
        ORDER BY gc.created_at DESC
      `;
      const res = await db.query(sql, params);
      return res.rows;
    } else {
      let certs = db.inMemoryStore.green_certificates;
      if (role !== "ADMIN" && userId) {
        certs = certs.filter((c) => c.owner_id === userId);
      }
      return certs.map((c) => {
        const u = db.inMemoryStore.users.find((user) => user.id === c.owner_id) || {};
        const t = db.inMemoryStore.energy_transactions.find((tx) => tx.id === c.transaction_id) || {};
        const p = db.inMemoryStore.users.find((user) => user.id === t.producer_id) || {};
        const l = db.inMemoryStore.energy_listings.find((list) => list.id === t.listing_id) || {};
        return {
          ...c,
          owner_name: u.full_name || u.name,
          owner_wallet: u.wallet_address,
          producer_id: t.producer_id,
          producer_name: p.full_name || p.name,
          energy_source: l.energy_source || "SOLAR",
        };
      });
    }
  }

  async getCertificateById(id) {
    let cert = null;
    if (db.isConnected) {
      const sql = `
        SELECT 
          gc.*,
          u.full_name as owner_name,
          u.wallet_address as owner_wallet,
          t.producer_id,
          p.full_name as producer_name,
          l.energy_source
        FROM green_certificates gc
        JOIN users u ON gc.owner_id = u.id
        LEFT JOIN energy_transactions t ON gc.transaction_id = t.id
        LEFT JOIN users p ON t.producer_id = p.id
        LEFT JOIN energy_listings l ON t.listing_id = l.id
        WHERE gc.id = $1
      `;
      const res = await db.query(sql, [id]);
      cert = res.rows[0];
    } else {
      const c = db.inMemoryStore.green_certificates.find((item) => item.id === Number(id));
      if (c) {
        const u = db.inMemoryStore.users.find((user) => user.id === c.owner_id) || {};
        const t = db.inMemoryStore.energy_transactions.find((tx) => tx.id === c.transaction_id) || {};
        const p = db.inMemoryStore.users.find((user) => user.id === t.producer_id) || {};
        const l = db.inMemoryStore.energy_listings.find((list) => list.id === t.listing_id) || {};
        cert = {
          ...c,
          owner_name: u.full_name || u.name,
          owner_wallet: u.wallet_address,
          producer_id: t.producer_id,
          producer_name: p.full_name || p.name,
          energy_source: l.energy_source || "SOLAR",
        };
      }
    }

    if (!cert) throw new AppError("Certificate not found.", 404);
    return cert;
  }

  async verifyCertificate(identifier) {
    let cert = null;
    if (db.isConnected) {
      const isNum = !isNaN(Number(identifier));
      const sql = `
        SELECT 
          gc.*,
          u.full_name as owner_name,
          u.wallet_address as owner_wallet,
          t.created_at as transaction_date
        FROM green_certificates gc
        JOIN users u ON gc.owner_id = u.id
        LEFT JOIN energy_transactions t ON gc.transaction_id = t.id
        WHERE gc.certificate_number = $1 ${isNum ? "OR gc.id = $2" : ""}
      `;
      const params = isNum ? [identifier, Number(identifier)] : [identifier];
      const res = await db.query(sql, params);
      cert = res.rows[0];
    } else {
      const c = db.inMemoryStore.green_certificates.find(
        (item) => item.certificate_number === identifier || item.id === Number(identifier)
      );
      if (c) {
        const u = db.inMemoryStore.users.find((user) => user.id === c.owner_id) || {};
        const t = db.inMemoryStore.energy_transactions.find((tx) => tx.id === c.transaction_id) || {};
        cert = {
          ...c,
          owner_name: u.full_name || u.name,
          owner_wallet: u.wallet_address,
          transaction_date: t.created_at,
        };
      }
    }

    if (!cert) {
      return {
        verified: false,
        message: "No certificate found matching the provided identifier.",
      };
    }

    return {
      verified: true,
      certificateNumber: cert.certificate_number,
      ownerName: cert.owner_name,
      ownerWallet: cert.owner_wallet,
      energyQuantityKwh: cert.energy_quantity_kwh,
      carbonSavingsKg: cert.carbon_savings,
      certificateStatus: cert.certificate_status,
      blockchainConfirmed: !!cert.blockchain_transaction_hash,
      blockchainCertificateId: cert.blockchain_certificate_id || null,
      issuedAt: cert.created_at,
    };
  }
}

module.exports = new CertificateService();
