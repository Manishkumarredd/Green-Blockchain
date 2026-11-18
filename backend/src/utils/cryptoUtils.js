const crypto = require("crypto");

/**
 * Compute cryptographic message digest (SHA3-256 / Keccak-256 equivalent)
 * used for peer-to-peer trade commitments and state proofs.
 */
function computeMessageDigest(payload) {
  let serialized = "";
  if (typeof payload === "string") {
    serialized = payload;
  } else if (payload && typeof payload === "object") {
    // Deterministic sorted key serialization
    const sortedKeys = Object.keys(payload).sort();
    const normalized = {};
    for (const k of sortedKeys) {
      normalized[k] = payload[k];
    }
    serialized = JSON.stringify(normalized);
  } else {
    serialized = String(payload);
  }

  const hash = crypto.createHash("sha3-256").update(serialized).digest("hex");
  return "0x" + hash;
}

/**
 * Generate a simulated Ethereum Sepolia transaction hash
 */
function generateTxHash() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

module.exports = {
  computeMessageDigest,
  generateTxHash,
};
