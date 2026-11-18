const { describe, it } = require("node:test");
const assert = require("node:assert");
const db = require("../config/db");
const producerService = require("../services/producerService");
const consumerService = require("../services/consumerService");

describe("Producer Acceptance & Consumer Payment Workflow Suite", () => {
  let createdListingId;
  let createdRequestId;

  it("1. Producer creates an active energy listing", async () => {
    const listing = await producerService.createListing({
      producerId: 2, // Helios Solar Park
      energySource: "SOLAR",
      totalEnergyKwh: 300,
      pricePerKwh: 0.000085,
      minPurchaseKwh: 5.0,
      windowHours: 24,
    });

    assert.ok(listing.id);
    assert.strictEqual(listing.producer_id, 2);
    assert.strictEqual(listing.available_energy_kwh, 300);
    createdListingId = listing.id;
  });

  it("2. Consumer submits an energy purchase request", async () => {
    const request = await consumerService.createRequest({
      consumerId: 5, // EcoCloud Data Center
      listingId: createdListingId,
      requestedEnergyKwh: 75,
      priorityWeight: 1.5,
      urgencyLevel: "HIGH",
      message: "Priority solar energy for data center cluster A",
    });

    assert.ok(request.id);
    assert.strictEqual(request.request_status || request.status, "PENDING");
    assert.strictEqual(request.consumer_id, 5);
    createdRequestId = request.id;
  });

  it("3. Consumer cannot pay while request is still in PENDING status", async () => {
    await assert.rejects(
      async () => {
        await consumerService.payAndSettleRequest(5, createdRequestId);
      },
      (err) => {
        assert.ok(err.message.includes("producer must review and accept"));
        return true;
      }
    );
  });

  it("4. Producer fetches incoming requests and sees the consumer demand", async () => {
    const incoming = await producerService.getIncomingRequests(2);
    const target = incoming.find((r) => Number(r.id) === Number(createdRequestId));

    assert.ok(target, "Demand must appear in producer incoming requests");
    assert.strictEqual(target.consumer_name, "EcoCloud Data Center");
    assert.strictEqual(Number(target.requested_energy_kwh), 75);
  });

  it("5. Producer accepts the demand and generates Keccak-256 trade proposal hash", async () => {
    const accepted = await producerService.acceptRequest(2, createdRequestId, {
      acceptanceMessage: "Helios Solar Park verified capacity. Proposal signed.",
    });

    assert.strictEqual(accepted.request_status, "ACCEPTED");
    assert.ok(accepted.accepted_at);
    assert.ok(accepted.trade_proposal_hash);
    assert.ok(accepted.trade_proposal_hash.startsWith("0x"));
    assert.strictEqual(accepted.trade_proposal_hash.length, 66); // 32 bytes hex
  });

  it("6. Consumer pays with Sepolia ETH and settles the transaction", async () => {
    const settlement = await consumerService.payAndSettleRequest(5, createdRequestId);

    assert.ok(settlement.success);
    assert.strictEqual(settlement.transaction.transaction_status, "SETTLED");
    assert.strictEqual(settlement.transaction.energy_quantity_kwh, 75);
    assert.ok(settlement.certificate.certificate_number.startsWith("GL-REC-2026-"));
    assert.ok(settlement.blockchainProof.transactionHash.startsWith("0x"));
    assert.strictEqual(settlement.blockchainProof.consensus, "Proof of Stake (PoS) - Casper FFG");

    // Verify listing capacity was deducted
    const updatedListing = await producerService.getListingById(createdListingId);
    assert.strictEqual(updatedListing.available_energy_kwh, 225); // 300 - 75 = 225
  });
});
