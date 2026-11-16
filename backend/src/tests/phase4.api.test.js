const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const db = require("../config/db");

// Services
const userService = require("../services/userService");
const producerService = require("../services/producerService");
const consumerService = require("../services/consumerService");
const marketplaceService = require("../services/marketplaceService");
const allocationService = require("../services/allocationService");
const pricingService = require("../services/pricingService");
const transactionService = require("../services/transactionService");
const carbonService = require("../services/carbonService");
const certificateService = require("../services/certificateService");
const adminService = require("../services/adminService");

// Middleware
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { createListingSchema } = require("../validators/schemas");

function createMockReqRes(body = {}, headers = {}, params = {}, query = {}) {
  const req = { body, headers, params, query, user: null };
  const res = {
    statusCode: 200,
    bodyData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.bodyData = data;
      return this;
    },
  };
  let nextCalled = false;
  let nextError = null;
  const next = (err) => {
    if (err) nextError = err;
    nextCalled = true;
  };
  return { req, res, next, getNextCalled: () => nextCalled, getNextError: () => nextError };
}

// 1. Database Connectivity & Schema Health
test("1. PostgreSQL / Dual-Mode Store: Database Health Check", async () => {
  const health = await db.testConnection();
  assert.strictEqual(typeof health, "object");
  assert.ok(health.connected !== undefined);
  assert.ok(db.inMemoryStore.users.length >= 7, "Seed users must be loaded");
  assert.ok(db.inMemoryStore.energy_listings.length >= 4, "Seed listings must be loaded");
  assert.ok(db.inMemoryStore.energy_requests.length >= 3, "Seed demands must be loaded");
});

// 2. User Registration
test("2. User Service: Register New Producer and Consumer Accounts", async () => {
  const uniqueStamp = Date.now().toString().slice(-5);
  const regProd = await userService.register({
    email: `producer.test.${uniqueStamp}@greenledger.io`,
    password: "Password123!",
    fullName: "Sierra Solar Array",
    role: "PRODUCER",
    meterId: `METER-PROD-TEST-${uniqueStamp}`,
    walletAddress: "0x1111111111111111111111111111111111111111",
  });
  assert.ok(regProd.user.id);
  assert.strictEqual(regProd.user.role, "PRODUCER");
  assert.ok(regProd.token);

  const regCons = await userService.register({
    email: `consumer.test.${uniqueStamp}@greenledger.io`,
    password: "Password123!",
    fullName: "Cascade BioTech Labs",
    role: "CONSUMER",
    meterId: `METER-CONS-TEST-${uniqueStamp}`,
    walletAddress: "0x2222222222222222222222222222222222222222",
  });
  assert.ok(regCons.user.id);
  assert.strictEqual(regCons.user.role, "CONSUMER");
  assert.ok(regCons.token);
});

// 3. User Login
test("3. User Service: Authenticates Valid Credentials & Rejects Invalid", async () => {
  const loginSuccess = await userService.login({
    email: "producer.solarfarm@greenledger.io",
    password: "Password123!",
  });
  assert.strictEqual(loginSuccess.user.email, "producer.solarfarm@greenledger.io");
  assert.ok(loginSuccess.token);

  await assert.rejects(
    async () => {
      await userService.login({
        email: "producer.solarfarm@greenledger.io",
        password: "IncorrectPassword!",
      });
    },
    { statusCode: 401 }
  );
});

// 4. JWT Validation Middleware
test("4. Auth Middleware: Verifies Valid Bearer JWT and Rejects Tampered Token", async () => {
  const validToken = jwt.sign({ id: 2, email: "producer.solarfarm@greenledger.io", role: "PRODUCER" }, config.JWT.SECRET, { expiresIn: "1h" });
  const mockValid = createMockReqRes({}, { authorization: `Bearer ${validToken}` });
  await authenticateToken(mockValid.req, mockValid.res, mockValid.next);
  assert.ok(mockValid.getNextCalled());
  assert.strictEqual(mockValid.req.user.id, 2);
  assert.strictEqual(mockValid.req.user.role, "PRODUCER");

  // Tampered token test
  const mockTampered = createMockReqRes({}, { authorization: "Bearer invalid.fake.token" });
  await authenticateToken(mockTampered.req, mockTampered.res, mockTampered.next);
  assert.strictEqual(mockTampered.res.statusCode, 403);
  assert.strictEqual(mockTampered.res.bodyData.success, false);
});

// 5. Role-Based Authorization Middleware
test("5. Role Middleware: Restricts Access strictly to Authorized Roles", () => {
  const producerUser = { id: 2, role: "PRODUCER" };
  const consumerUser = { id: 6, role: "CONSUMER" };

  // Producer allowed
  const mockProd = createMockReqRes();
  mockProd.req.user = producerUser;
  requireRoles("PRODUCER")(mockProd.req, mockProd.res, mockProd.next);
  assert.ok(mockProd.getNextCalled());

  // Consumer forbidden from producer endpoint
  const mockCons = createMockReqRes();
  mockCons.req.user = consumerUser;
  requireRoles("PRODUCER")(mockCons.req, mockCons.res, mockCons.next);
  assert.strictEqual(mockCons.res.statusCode, 403);
  assert.strictEqual(mockCons.res.bodyData.success, false);
});

// 6. Producer Listing Creation
test("6. Producer Service: Create Energy Listing with Valid Energy and Price", async () => {
  const listing = await producerService.createListing({
    producerId: 2,
    energySource: "SOLAR",
    totalEnergyKwh: 350.0,
    pricePerKwh: 0.000085,
    minPurchaseKwh: 5.0,
    windowHours: 12,
  });

  assert.ok(listing.id);
  assert.strictEqual(listing.producer_id, 2);
  assert.strictEqual(listing.energy_source, "SOLAR");
  assert.strictEqual(listing.total_energy_kwh, 350.0);
  assert.strictEqual(listing.available_energy_kwh, 350.0);
  assert.strictEqual(listing.listing_status, "ACTIVE");
});

// 7. Producer Listing Updates
test("7. Producer Service: Update Listing Price and Available Quantity", async () => {
  const listing = await producerService.createListing({
    producerId: 2,
    energySource: "SOLAR",
    totalEnergyKwh: 100.0,
    pricePerKwh: 0.00009,
  });

  const updated = await producerService.updateListing(listing.id, 2, {
    pricePerKwh: 0.000086,
    availableEnergyKwh: 80.0,
  });

  assert.strictEqual(updated.available_energy_kwh, 80.0);
  assert.strictEqual(Number(updated.price_per_kwh), 0.000086);

  // Unauthorized update attempt
  await assert.rejects(
    async () => {
      await producerService.updateListing(listing.id, 3, { pricePerKwh: 0.00005 });
    },
    { statusCode: 403 }
  );
});

// 8. Consumer Demands & Requests
test("8. Consumer Service: Create Energy Request with Priority Weight", async () => {
  const req = await consumerService.createRequest({
    consumerId: 6,
    requestedEnergyKwh: 120.0,
    priorityWeight: 2.0,
    maxAcceptablePrice: 0.00011,
    urgencyLevel: "HIGH",
  });

  assert.ok(req.id);
  assert.strictEqual(req.consumer_id, 6);
  assert.strictEqual(req.requested_energy_kwh, 120.0);
  assert.strictEqual(req.priority_weight, 2.0);
  assert.strictEqual(req.request_status, "PENDING");
});

// 9. Marketplace Search
test("9. Marketplace Service: Search Listings by Producer Name or Energy Source", async () => {
  const searchResult = await marketplaceService.getMarketplaceListings({
    search: "Solar",
    page: 1,
    limit: 10,
  });

  assert.ok(searchResult.listings.length > 0);
  assert.ok(searchResult.meta.total > 0);
  assert.ok(
    searchResult.listings.every(
      (l) => l.energy_source === "SOLAR" || l.producer_name.toLowerCase().includes("solar")
    )
  );
});

// 10. Marketplace Filtering (Energy Source, Min/Max Price)
test("10. Marketplace Service: Filter by Energy Source and Price Range", async () => {
  const filtered = await marketplaceService.getMarketplaceListings({
    energySource: "WIND",
    minPrice: 0.00005,
    maxPrice: 0.0001,
  });

  assert.ok(filtered.listings.length > 0);
  assert.ok(filtered.listings.every((l) => l.energy_source === "WIND"));
  assert.ok(filtered.listings.every((l) => Number(l.price_per_kwh) <= 0.0001));
});

// 11. Pagination Verification
test("11. Marketplace Service: Returns Correct Page and Limit Meta", async () => {
  const p1 = await marketplaceService.getMarketplaceListings({ page: 1, limit: 2 });
  assert.strictEqual(p1.listings.length, 2);
  assert.strictEqual(p1.meta.page, 1);
  assert.strictEqual(p1.meta.limit, 2);
  assert.ok(p1.meta.totalPages >= 1);
});

// 12. Invalid Energy Quantities (Zod Validation)
test("12. Validation Middleware: Rejects Negative or Zero Energy Quantities", () => {
  const mockInvalid = createMockReqRes({
    energySource: "SOLAR",
    totalEnergyKwh: -50.0, // Invalid: must be positive
    pricePerKwh: 0.00008,
  });
  validate(createListingSchema)(mockInvalid.req, mockInvalid.res, mockInvalid.next);
  assert.strictEqual(mockInvalid.res.statusCode, 400);
  assert.strictEqual(mockInvalid.res.bodyData.success, false);
  assert.ok(mockInvalid.res.bodyData.details.some((d) => d.field === "totalEnergyKwh"));
});

// 13. Invalid Price Validation
test("13. Validation Middleware: Rejects Zero or Negative Selling Price", () => {
  const mockZeroPrice = createMockReqRes({
    energySource: "SOLAR",
    totalEnergyKwh: 100.0,
    pricePerKwh: 0.0, // Invalid: must be positive
  });
  validate(createListingSchema)(mockZeroPrice.req, mockZeroPrice.res, mockZeroPrice.next);
  assert.strictEqual(mockZeroPrice.res.statusCode, 400);
  assert.strictEqual(mockZeroPrice.res.bodyData.success, false);
});

// 14. Transaction Execution & Calculations
test("14. Transaction Service: Settlement Execution Calculates Exact Total and Carbon", async () => {
  const listing = await producerService.createListing({
    producerId: 2,
    energySource: "HYDRO",
    totalEnergyKwh: 100.0,
    pricePerKwh: 0.000095,
  });

  const tx = await transactionService.createTransaction({
    consumerId: 5,
    listingId: listing.id,
    energyQuantityKwh: 40.0,
  });

  assert.ok(tx.id);
  assert.strictEqual(tx.consumer_id, 5);
  assert.strictEqual(tx.producer_id, 2);
  assert.strictEqual(tx.energy_quantity_kwh, 40.0);
  assert.strictEqual(Number(tx.price_per_kwh), 0.000095);
  // Total: 40 * 0.000095 = 0.0038 ETH
  assert.strictEqual(Number(tx.total_amount), 0.0038);
  // Carbon: 40 * 0.82 = 32.8 kg CO2
  assert.strictEqual(tx.carbonSavedKg, 32.8);

  // Verify listing available quantity decremented to 60.0
  const refreshedListing = await producerService.getListingById(listing.id);
  assert.strictEqual(refreshedListing.available_energy_kwh, 60.0);
});

// 15. Duplicate Operation Prevention & Self-Trading Guard
test("15. Transaction Service: Prevents Producers Purchasing Own Listings", async () => {
  const listing = await producerService.createListing({
    producerId: 2,
    energySource: "SOLAR",
    totalEnergyKwh: 50.0,
    pricePerKwh: 0.00009,
  });

  await assert.rejects(
    async () => {
      await transactionService.createTransaction({
        consumerId: 2, // Same as producerId
        listingId: listing.id,
        energyQuantityKwh: 10.0,
      });
    },
    { statusCode: 400 }
  );
});

// 16. Concurrency Control & Overselling Prevention
test("16. Transaction Service: Prevents Overselling Beyond Available Energy Capacity", async () => {
  const listing = await producerService.createListing({
    producerId: 3,
    energySource: "WIND",
    totalEnergyKwh: 25.0,
    pricePerKwh: 0.00008,
  });

  // Attempt to buy 50 kWh when only 25 kWh is available
  await assert.rejects(
    async () => {
      await transactionService.createTransaction({
        consumerId: 6,
        listingId: listing.id,
        energyQuantityKwh: 50.0,
      });
    },
    { statusCode: 400 }
  );
});

// 17. Admin-Only Access Restriction
test("17. Admin Service & Middleware: Restricts Administrative Privileges", async () => {
  // Consumer attempting admin action
  const mockConsumer = createMockReqRes();
  mockConsumer.req.user = { id: 5, role: "CONSUMER" };
  requireRoles("ADMIN")(mockConsumer.req, mockConsumer.res, mockConsumer.next);
  assert.strictEqual(mockConsumer.res.statusCode, 403);

  // Admin access succeeds
  const mockAdmin = createMockReqRes();
  mockAdmin.req.user = { id: 1, role: "ADMIN" };
  requireRoles("ADMIN")(mockAdmin.req, mockAdmin.res, mockAdmin.next);
  assert.ok(mockAdmin.getNextCalled());

  const adminStats = await adminService.getAdminDashboardStats();
  assert.ok(adminStats.totalUsers > 0);
  assert.ok(adminStats.systemHealth === "OPTIMAL");
});
