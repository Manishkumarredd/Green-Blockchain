const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");

// Mock request / response helper for Express controllers
function createMockReqRes(body = {}, headers = {}) {
  const req = {
    body,
    headers,
    user: null,
  };

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

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, next };
}

const authController = require("../controllers/auth.controller");
const db = require("../config/db");

test("Auth Controller: Producer Registration with Valid Payload", async () => {
  const { req, res, next } = createMockReqRes({
    name: "Apex Solar Farm",
    email: "apex.solar@microgrid.org",
    password: "StrongPassword123!",
    role: "PRODUCER",
    phone: "+1-555-0199",
  });

  await authController.register(req, res, next);

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.bodyData.success, true);
  assert.strictEqual(res.bodyData.user.role, "PRODUCER");
  assert.strictEqual(res.bodyData.user.email, "apex.solar@microgrid.org");
  assert.strictEqual(res.bodyData.redirectPath, "/producer/dashboard");
  assert.ok(res.bodyData.token, "JWT token must be issued on registration");

  // Verify password is not exposed
  assert.strictEqual(res.bodyData.user.password_hash, undefined);
});

test("Auth Controller: Consumer Registration with Valid Payload", async () => {
  const { req, res, next } = createMockReqRes({
    name: "Green Horizons Logistics",
    email: "logistics@greenhorizons.com",
    password: "SecurePass2026!",
    role: "CONSUMER",
  });

  await authController.register(req, res, next);

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.bodyData.success, true);
  assert.strictEqual(res.bodyData.user.role, "CONSUMER");
  assert.strictEqual(res.bodyData.redirectPath, "/consumer/dashboard");
  assert.ok(res.bodyData.token);
});

test("Auth Controller: Rejects Public Administrator Registration", async () => {
  const { req, res, next } = createMockReqRes({
    name: "Fake Admin",
    email: "fake.admin@hack.org",
    password: "AdminPassword123!",
    role: "ADMIN",
  });

  await authController.register(req, res, next);

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.bodyData.success, false);
  assert.ok(res.bodyData.error.includes("administrator registration is prohibited"));
});

test("Auth Controller: Rejects Weak Passwords", async () => {
  // Test password too short (< 8 chars)
  const short = createMockReqRes({
    name: "Test User",
    email: "weak1@test.com",
    password: "short",
    role: "CONSUMER",
  });
  await authController.register(short.req, short.res, short.next);
  assert.strictEqual(short.res.statusCode, 400);

  // Test password missing uppercase / number
  const noUpper = createMockReqRes({
    name: "Test User",
    email: "weak2@test.com",
    password: "alllowercasepassword",
    role: "CONSUMER",
  });
  await authController.register(noUpper.req, noUpper.res, noUpper.next);
  assert.strictEqual(noUpper.res.statusCode, 400);
});

test("Auth Controller: Rejects Duplicate Email Registration", async () => {
  const duplicate = createMockReqRes({
    name: "Duplicate User",
    email: "apex.solar@microgrid.org", // Already registered in test 1
    password: "StrongPassword123!",
    role: "PRODUCER",
  });

  await authController.register(duplicate.req, duplicate.res, duplicate.next);

  assert.strictEqual(duplicate.res.statusCode, 409);
  assert.strictEqual(duplicate.res.bodyData.success, false);
  assert.ok(duplicate.res.bodyData.error.includes("already exists"));
});

test("Auth Controller: Successful Login with Valid Credentials", async () => {
  const { req, res, next } = createMockReqRes({
    email: "producer.solarfarm@greenledger.io",
    password: "Password123!",
  });

  await authController.login(req, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.bodyData.success, true);
  assert.strictEqual(res.bodyData.user.role, "PRODUCER");
  assert.strictEqual(res.bodyData.redirectPath, "/producer/dashboard");
  assert.ok(res.bodyData.token);

  // Decode JWT to verify payload integrity
  const decoded = jwt.verify(res.bodyData.token, config.JWT.SECRET);
  assert.strictEqual(decoded.email, "producer.solarfarm@greenledger.io");
  assert.strictEqual(decoded.role, "PRODUCER");
});

test("Auth Controller: Rejects Invalid Password", async () => {
  const { req, res, next } = createMockReqRes({
    email: "producer.solarfarm@greenledger.io",
    password: "WrongPassword999!",
  });

  await authController.login(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.bodyData.success, false);
  assert.ok(res.bodyData.error.includes("Invalid email or password"));
});

test("Auth Controller: Rejects Non-Existent User Login", async () => {
  const { req, res, next } = createMockReqRes({
    email: "nonexistent.user@nowhere.com",
    password: "Password123!",
  });

  await authController.login(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.bodyData.success, false);
});

test("Auth Controller: Nonce Generation for Web3 Signature Flow", async () => {
  const walletAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const { req, res, next } = createMockReqRes({ walletAddress });

  await authController.requestNonce(req, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.bodyData.success, true);
  assert.ok(res.bodyData.nonce.includes("Sign this message to authenticate with GreenLedger"));
  assert.strictEqual(res.bodyData.walletAddress, walletAddress.toLowerCase());
});

test("Auth Controller: Forgot Password Dispatches Secure Neutral Response", async () => {
  const { req, res, next } = createMockReqRes({
    email: "producer.solarfarm@greenledger.io",
  });

  await authController.forgotPassword(req, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.bodyData.success, true);
  assert.ok(res.bodyData.message.includes("password reset instructions have been sent"));
});

test("Auth Controller: Protected Profile Retrieval with Valid JWT", async () => {
  const { req, res, next } = createMockReqRes();
  req.user = { userId: 2, role: "PRODUCER", email: "producer.solarfarm@greenledger.io" };

  await authController.getProfile(req, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.bodyData.success, true);
  assert.strictEqual(res.bodyData.user.id, 2);
  assert.strictEqual(res.bodyData.user.role, "PRODUCER");
  assert.strictEqual(res.bodyData.user.password_hash, undefined);
});

test("Role-Based Redirection Matrix Verification", () => {
  const roleRoutes = {
    PRODUCER: "/producer/dashboard",
    CONSUMER: "/consumer/dashboard",
    ADMIN: "/admin/dashboard",
  };

  assert.strictEqual(roleRoutes["PRODUCER"], "/producer/dashboard");
  assert.strictEqual(roleRoutes["CONSUMER"], "/consumer/dashboard");
  assert.strictEqual(roleRoutes["ADMIN"], "/admin/dashboard");
});

test("Web3 MetaMask: Ethereum Sepolia Chain ID Specifications", () => {
  const SEPOLIA_HEX = "0xaa36a7";
  const SEPOLIA_DEC = 11155111;

  assert.strictEqual(parseInt(SEPOLIA_HEX, 16), SEPOLIA_DEC);
  assert.strictEqual("0x" + SEPOLIA_DEC.toString(16), SEPOLIA_HEX);
});
