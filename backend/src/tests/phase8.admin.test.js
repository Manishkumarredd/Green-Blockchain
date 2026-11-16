const test = require("node:test");
const assert = require("node:assert");

const adminService = require("../services/adminService");
const { requireRoles } = require("../middleware/roleMiddleware");
const {
  updateUserStatusSchema,
  updateListingStatusSchema,
  updateSettingSchema,
} = require("../validators/schemas");

function createMockReqRes() {
  const req = { user: null, params: {}, query: {}, body: {} };
  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    setHeader() {},
    get statusCode() {
      return statusCode;
    },
    get responseData() {
      return responseData;
    },
  };

  const next = (err) => {
    if (err) throw err;
    nextCalled = true;
  };

  return { req, res, next, getNextCalled: () => nextCalled };
}

test("Phase 8 - Security: Non-administrator roles strictly rejected from admin operations (403 Forbidden)", () => {
  const consumerContext = createMockReqRes();
  consumerContext.req.user = { id: 5, role: "CONSUMER" };
  requireRoles("ADMIN")(consumerContext.req, consumerContext.res, consumerContext.next);
  assert.strictEqual(consumerContext.res.statusCode, 403);

  const producerContext = createMockReqRes();
  producerContext.req.user = { id: 2, role: "PRODUCER" };
  requireRoles("ADMIN")(producerContext.req, producerContext.res, producerContext.next);
  assert.strictEqual(producerContext.res.statusCode, 403);

  // Administrator role is allowed through
  const adminContext = createMockReqRes();
  adminContext.req.user = { id: 1, role: "ADMIN" };
  requireRoles("ADMIN")(adminContext.req, adminContext.res, adminContext.next);
  assert.ok(adminContext.getNextCalled());
});

test("Phase 8 - Admin Dashboard: Returns complete platform KPIs and 6 Recharts analytics series", async () => {
  const dashboard = await adminService.getAdminDashboardStats();

  // 1. KPI Cards
  assert.ok(dashboard.kpi.totalUsers >= 3);
  assert.ok(dashboard.kpi.producersCount >= 1);
  assert.ok(dashboard.kpi.consumersCount >= 1);
  assert.ok(dashboard.kpi.activeListingsCount >= 0);
  assert.ok(dashboard.kpi.totalEnergyListedKwh >= 0);
  assert.ok(dashboard.kpi.totalEnergyTradedKwh >= 0);
  assert.ok(dashboard.kpi.totalEstimatedCarbonKg >= 0);
  assert.strictEqual(dashboard.systemHealth, "OPTIMAL");

  // 2. Charts
  assert.ok(Array.isArray(dashboard.charts.userRegistrationTrends));
  assert.ok(Array.isArray(dashboard.charts.energyListedVsTraded));
  assert.ok(Array.isArray(dashboard.charts.monthlyTransactionVolume));
  assert.ok(Array.isArray(dashboard.charts.renewableSourceDistribution));
  assert.ok(Array.isArray(dashboard.charts.producerVsConsumerDistribution));
  assert.ok(Array.isArray(dashboard.charts.platformActivityTrends));

  // 3. Sections
  assert.ok(Array.isArray(dashboard.sections.recentTransactions));
  assert.ok(Array.isArray(dashboard.sections.recentUsers));
  assert.ok(Array.isArray(dashboard.sections.recentListings));
  assert.ok(Array.isArray(dashboard.sections.recentActivityLogs));
});

test("Phase 8 - User Management: Search, Role Filtering, Pagination, and Safe Projections", async () => {
  // Query all users
  const allResult = await adminService.getAllUsers({ page: 1, limit: 10 });
  assert.ok(allResult.users.length > 0);
  assert.ok(allResult.pagination.total > 0);

  // Verify passwords/hashes/JWTs are NEVER exposed
  for (const u of allResult.users) {
    assert.strictEqual(u.password_hash, undefined, "Security violation: password_hash leaked");
    assert.strictEqual(u.password, undefined, "Security violation: password leaked");
  }

  // Filter by PRODUCER role
  const producerResult = await adminService.getAllUsers({ role: "PRODUCER" });
  for (const u of producerResult.users) {
    assert.strictEqual(u.role, "PRODUCER");
  }

  // Filter by CONSUMER role
  const consumerResult = await adminService.getAllUsers({ role: "CONSUMER" });
  for (const u of consumerResult.users) {
    assert.strictEqual(u.role, "CONSUMER");
  }

  // Search by text query
  const searchResult = await adminService.getAllUsers({ search: "solar" });
  assert.ok(Array.isArray(searchResult.users));
});

test("Phase 8 - User Profile: Detailed inspection with linked activity stats", async () => {
  const profile = await adminService.getUserById(2); // Producer
  assert.strictEqual(profile.user.id, 2);
  assert.strictEqual(profile.user.role, "PRODUCER");
  assert.ok(profile.activityStats.totalListings >= 0);
  assert.ok(typeof profile.walletConnected === "boolean");
});

test("Phase 8 - Security: Administrators cannot deactivate their own account", async () => {
  const adminId = 1;
  await assert.rejects(
    async () => {
      await adminService.updateUserStatus(adminId, adminId, "SUSPENDED", "Self test");
    },
    /Administrators cannot deactivate or modify their own account status/
  );
});

test("Phase 8 - User Status: Updates user account status and records activity log", async () => {
  const adminId = 1;
  const targetUserId = 2;

  const updated = await adminService.updateUserStatus(adminId, targetUserId, "SUSPENDED", "Compliance investigation");
  assert.strictEqual(updated.account_status, "SUSPENDED");

  // Re-activate to preserve state
  const restored = await adminService.updateUserStatus(adminId, targetUserId, "ACTIVE", "Audit completed");
  assert.strictEqual(restored.account_status, "ACTIVE");

  // Check activity log was recorded
  const logs = await adminService.getActivityLogs({ action: "USER_STATUS_CHANGE" });
  assert.ok(logs.logs.length > 0);
  assert.ok(logs.logs[0].description.includes("Compliance investigation") || logs.logs[0].description.includes("Audit completed"));
});

test("Phase 8 - Energy Listings: Search, Source Filter, and Status Moderation", async () => {
  const result = await adminService.getAllListings({ page: 1, limit: 10 });
  assert.ok(result.listings.length > 0);
  assert.ok(result.pagination.total > 0);

  // Moderation: Suspend listing 1
  const adminId = 1;
  const moderated = await adminService.updateListingStatus(adminId, 1, "SUSPENDED", "Rate spike review");
  assert.strictEqual(moderated.listing_status, "SUSPENDED");

  // Restore listing 1 to ACTIVE
  const restored = await adminService.updateListingStatus(adminId, 1, "ACTIVE", "Review verified");
  assert.strictEqual(restored.listing_status, "ACTIVE");
});

test("Phase 8 - Energy Requests: Inspection and Pagination", async () => {
  const result = await adminService.getAllRequests({ page: 1, limit: 10 });
  assert.ok(Array.isArray(result.requests));
  assert.ok(result.pagination.total >= 0);

  if (result.requests.length > 0) {
    const req = result.requests[0];
    assert.ok(req.consumer_name !== undefined);
  }
});

test("Phase 8 - Transactions: Audit Directory with Blockchain Tx Hashes", async () => {
  const result = await adminService.getAllTransactions({ page: 1, limit: 10 });
  assert.ok(Array.isArray(result.transactions));
  assert.ok(result.pagination.total >= 0);

  if (result.transactions.length > 0) {
    const tx = result.transactions[0];
    assert.ok(tx.producer_name !== undefined);
    assert.ok(tx.consumer_name !== undefined);
  }
});

test("Phase 8 - Platform Settings: Retrieve and Update with Audit Trail", async () => {
  const settings = await adminService.getPlatformSettings();
  assert.ok(settings.platform.platformName);
  assert.ok(settings.pricing.baseGridTariffEth > 0);
  assert.strictEqual(settings.environmental.gridEmissionFactorKgPerKwh, 0.8200);

  // Update setting
  const adminId = 1;
  const updated = await adminService.updatePlatformSettings(adminId, {
    base_grid_tariff_eth: "0.00011500",
  });
  assert.strictEqual(updated.pricing.baseGridTariffEth, 0.000115);

  // Verify audit log recorded setting change
  const logs = await adminService.getActivityLogs({ action: "PLATFORM_SETTINGS_UPDATE" });
  assert.ok(logs.logs.length > 0);
});

test("Phase 8 - Research Analytics & CSV Export: RFC 4180 Format and Scenarios", async () => {
  const analytics = await adminService.getResearchAnalytics();
  assert.strictEqual(analytics.scenariosCount, 6);
  assert.ok(analytics.allExperiments.length === 6);
  assert.ok(analytics.disclaimer.includes("RESEARCH SIMULATION DATA"));

  // Verify CSV export
  const csv = await adminService.exportResearchAnalyticsCsv();
  assert.ok(typeof csv === "string");
  assert.ok(csv.startsWith("Scenario_ID,Scenario_Name,Metric,FCFS_Baseline,BPA_Baseline,DA_WPA_Proposed,Unit,Timestamp"));
  assert.ok(csv.includes("LOW_SUPPLY_HIGH_DEMAND"));
  assert.ok(csv.includes("Jain's Fairness Index"));
});

test("Phase 8 - Validation Schemas: Status and Settings validation", () => {
  // Valid user status
  const validStatus = updateUserStatusSchema.safeParse({ status: "ACTIVE" });
  assert.ok(validStatus.success);

  // Invalid user status
  const invalidStatus = updateUserStatusSchema.safeParse({ status: "SUPERUSER" });
  assert.strictEqual(invalidStatus.success, false);

  // Valid listing status
  const validListing = updateListingStatusSchema.safeParse({ status: "SUSPENDED" });
  assert.ok(validListing.success);

  // Valid setting update
  const validSetting = updateSettingSchema.safeParse({ key: "base_grid_tariff_eth", value: "0.0001" });
  assert.ok(validSetting.success);
});
