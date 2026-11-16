const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

test("Phase 9: Blockchain Network Information Endpoint", async () => {
  const res = await api("/api/v1/blockchain/network");
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.networkName);
  assert.ok(res.data.data.chainId);
  assert.ok(res.data.data.gasPriceGwei);
  assert.ok(res.data.data.explorerUrl);
});

test("Phase 9: Deployed Smart Contracts Manifest Endpoint", async () => {
  const res = await api("/api/v1/blockchain/contracts");
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);

  const contracts = res.data.data.contracts;
  assert.ok(contracts.UserRegistry);
  assert.ok(contracts.EnergyMarketplace);
  assert.ok(contracts.GreenCertificate);
  assert.ok(contracts.EnergyTrading);

  assert.ok(contracts.UserRegistry.address.startsWith("0x"));
  assert.ok(contracts.EnergyMarketplace.address.startsWith("0x"));
  assert.ok(contracts.GreenCertificate.address.startsWith("0x"));
  assert.ok(contracts.EnergyTrading.address.startsWith("0x"));

  assert.ok(contracts.GreenCertificate.explorerUrl.includes(contracts.GreenCertificate.address));
  assert.ok(contracts.EnergyTrading.explorerUrl.includes(contracts.EnergyTrading.address));
});

test("Phase 9: Public Certificate Listing Endpoint", async () => {
  const res = await api("/api/v1/blockchain/certificates");
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.data));
  assert.ok(res.data.data.length >= 1);
  assert.ok(res.data.data[0].contract_address);
  assert.ok(res.data.data[0].explorer_url);
});

test("Phase 9: Public Certificate Verification Endpoint", async () => {
  const res = await api("/api/v1/blockchain/certificates/1/verify");
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);

  const cert = res.data.data;
  assert.equal(cert.valid, true);
  assert.ok(cert.certificateNumber.startsWith("GL-REC"));
  assert.ok(cert.contractAddress.startsWith("0x"));
  assert.equal(cert.tokenStandard, "ERC-721 URIStorage");
  assert.ok(cert.metadata.energyQuantityKwh > 0);
  assert.ok(cert.metadata.carbonAvoidedKg);
  assert.ok(cert.metadata.tradeSettlementHash);
  assert.ok(cert.disclaimer.includes("non-financial environmental attribute tracking"));
  assert.ok(cert.verificationLinks.contractEtherscan);
  assert.ok(cert.verificationLinks.txEtherscan);
});

test("Phase 9: Transaction Preparation Endpoint for Client Web3 Execution", async () => {
  const res = await api("/api/v1/blockchain/trades/1/prepare", {
    method: "POST",
    body: JSON.stringify({
      walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      action: "settle"
    }),
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);

  const prep = res.data.data;
  assert.ok(prep.contractAddress.startsWith("0x"));
  assert.equal(prep.functionName, "settleTrade");
  assert.ok(Array.isArray(prep.args));
  assert.ok(prep.tradeHash.startsWith("0x"));
  assert.ok(prep.networkChainId);
});

test("Phase 9: Trade Confirmation and On-Chain Hash Recording Endpoint", async () => {
  const testHash = "0x" + "a".repeat(64);
  const res = await api("/api/v1/blockchain/trades/1/confirm", {
    method: "POST",
    body: JSON.stringify({
      transactionHash: testHash,
      contractAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      networkName: "Sepolia",
      transactionType: "SETTLEMENT"
    }),
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.data.transaction_hash, testHash);

  // Now verify lookup by hash
  const txRes = await api(`/api/v1/blockchain/transactions/${testHash}`);
  assert.equal(txRes.status, 200);
  assert.equal(txRes.data.success, true);
  assert.equal(txRes.data.data.transaction_hash, testHash);
  assert.ok(txRes.data.data.explorerUrl.includes(testHash));
});

test("Phase 9: Blockchain Event Synchronization Trigger", async () => {
  const res = await api("/api/v1/blockchain/sync", {
    method: "POST",
    body: JSON.stringify({ fromBlock: 0 }),
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.status);
});
