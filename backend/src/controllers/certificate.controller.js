const db = require("../config/db");
const { calculateCarbonSavings } = require("../algorithms/carbon");

async function getCertificates(req, res, next) {
  try {
    if (db.isConnected) {
      const result = await db.query("SELECT * FROM renewable_energy_certificates ORDER BY issued_at DESC");
      return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    }

    res.status(200).json({ success: true, count: db.inMemoryStore.certificates.length, data: db.inMemoryStore.certificates });
  } catch (err) {
    next(err);
  }
}

async function verifyCertificate(req, res, next) {
  try {
    const { tokenId } = req.params;
    let cert;

    if (db.isConnected) {
      const result = await db.query("SELECT * FROM renewable_energy_certificates WHERE token_id = $1", [tokenId]);
      cert = result.rows[0];
    } else {
      cert = db.inMemoryStore.certificates.find(c => String(c.token_id) === String(tokenId));
    }

    if (!cert) {
      return res.status(404).json({ success: false, error: `Certificate with Token ID #${tokenId} was not found.` });
    }

    res.status(200).json({
      success: true,
      isValid: !cert.is_retired,
      certificate: cert,
    });
  } catch (err) {
    next(err);
  }
}

async function calculateOffsets(req, res, next) {
  try {
    const { energyKwh, energySource = "SOLAR" } = req.query;
    if (!energyKwh) {
      return res.status(400).json({ success: false, error: "energyKwh query parameter is required" });
    }

    const result = calculateCarbonSavings(parseFloat(energyKwh), energySource);
    res.status(200).json({ success: true, carbonMetrics: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCertificates,
  verifyCertificate,
  calculateOffsets,
};
