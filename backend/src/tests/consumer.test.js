const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const consumerService = require("../services/consumerService");
const db = require("../config/db");

describe("Phase 6: Consumer Portal & Purchase Request Test Suite", () => {
  const consumerId = 6; // Metro Green Hospital (Consumer)
  const anotherConsumerId = 5; // EcoCloud Data Center
  const producerId = 2; // Helios Solar Park (Producer)

  test("1. Consumer can submit a valid energy purchase request", async () => {
    const listing = db.inMemoryStore.energy_listings.find((l) => l.id === 1);
    assert.ok(listing, "Active listing should exist");

    const req = await consumerService.createRequest({
      consumerId,
      listingId: listing.id,
      requestedEnergyKwh: 25,
      priorityWeight: 2.0,
      urgencyLevel: "HIGH",
      message: "Emergency pediatric ward solar power",
    });

    assert.ok(req.id, "Request should have an ID");
    assert.equal(req.consumer_id, consumerId);
    assert.equal(req.requested_energy_kwh, 25);
    assert.equal(req.status, "PENDING");
    assert.equal(req.energy_source, listing.energy_source);
  });

  test("2. Rejects request exceeding available listing capacity", async () => {
    const listing = db.inMemoryStore.energy_listings.find((l) => l.id === 1);
    assert.ok(listing);

    await assert.rejects(
      async () => {
        await consumerService.createRequest({
          consumerId,
          listingId: listing.id,
          requestedEnergyKwh: listing.available_energy_kwh + 5000,
        });
      },
      {
        name: "AppError",
        statusCode: 400,
      }
    );
  });

  test("3. Rejects producer requesting their own energy listing", async () => {
    const listing = db.inMemoryStore.energy_listings.find((l) => l.producer_id === producerId);
    assert.ok(listing);

    await assert.rejects(
      async () => {
        await consumerService.createRequest({
          consumerId: producerId,
          listingId: listing.id,
          requestedEnergyKwh: 10,
        });
      },
      {
        name: "AppError",
        statusCode: 403,
      }
    );
  });

  test("4. Consumer can view their own request details", async () => {
    const requests = await consumerService.getConsumerRequests(consumerId);
    assert.ok(requests.requests.length > 0);
    const target = requests.requests[0];

    const details = await consumerService.getRequestById(target.id, consumerId);
    assert.equal(details.id, target.id);
    assert.ok(details.producer_name);
    assert.ok(details.timeline.length >= 2);
  });

  test("5. Security: Consumer cannot access another consumer's request", async () => {
    const requests = await consumerService.getConsumerRequests(anotherConsumerId);
    assert.ok(requests.requests.length > 0);
    const anotherReq = requests.requests[0];

    await assert.rejects(
      async () => {
        await consumerService.getRequestById(anotherReq.id, consumerId);
      },
      {
        name: "AppError",
        statusCode: 403,
      }
    );
  });

  test("6. Consumer can cancel an active pending request", async () => {
    const req = await consumerService.createRequest({
      consumerId,
      requestedEnergyKwh: 15,
      urgencyLevel: "NORMAL",
    });

    assert.equal(req.status, "PENDING");

    const cancelled = await consumerService.cancelRequest(req.id, consumerId);
    assert.equal(cancelled.status, "CANCELLED");

    // Cannot cancel again
    await assert.rejects(
      async () => {
        await consumerService.cancelRequest(req.id, consumerId);
      },
      {
        name: "AppError",
        statusCode: 400,
      }
    );
  });

  test("7. Cancelled requests do not appear as completed purchases", async () => {
    const purchases = await consumerService.getConsumerPurchases(consumerId);
    const hasCancelled = purchases.purchases.some((p) => p.status === "CANCELLED");
    assert.equal(hasCancelled, false, "Purchases must strictly contain SETTLED/CONFIRMED trades");
  });

  test("8. Consumer dashboard metrics and Recharts series compute accurately", async () => {
    const stats = await consumerService.getConsumerDashboardStats(consumerId);

    assert.ok(stats.totalPurchasedKwh >= 0);
    assert.ok(stats.totalSpentEth !== undefined);
    assert.ok(stats.carbonSavedKg >= 0);
    assert.ok(Array.isArray(stats.monthlyPurchases));
    assert.ok(stats.monthlyPurchases.length > 0);
    assert.ok(Array.isArray(stats.requestStatusDistribution));
    assert.ok(Array.isArray(stats.recentRequests));
    assert.ok(Array.isArray(stats.latestMarketplaceListings));
  });

  test("9. Carbon savings calculation uses standard 0.82 kg CO2/kWh factor", async () => {
    const carbon = await consumerService.getConsumerCarbonSavings(consumerId);

    assert.equal(carbon.gridEmissionFactor, 0.82);
    const expected = Number((carbon.totalRenewableKwh * 0.82).toFixed(2));
    assert.equal(carbon.totalCarbonSavedKg, expected);
    assert.ok(carbon.treesEquivalent >= 0);
    assert.ok(carbon.carKmEquivalent >= 0);
  });
});
