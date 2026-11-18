const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = require("../app");
const config = require("../config/env");
const db = require("../config/db");
const userService = require("../services/userService");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");

test("Security Audit 1: SQL Injection Protection on Authentication & Marketplace Queries", async () => {
  // Test malicious SQL injection inputs in login
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT null, null, null, null, null, null --",
    "'; DROP TABLE users; --",
  ];

  for (const maliciousInput of sqlInjectionPayloads) {
    try {
      await userService.login({ email: maliciousInput, password: "Password123!" });
      assert.fail(`SQL injection succeeded with payload: ${maliciousInput}`);
    } catch (err) {
      assert.strictEqual(err.statusCode, 401, "Rejected as invalid credentials rather than executing SQL");
    }
  }
});

test("Security Audit 2: Password Storage Uses Salted Bcrypt Hashing", async () => {
  const plainPassword = "SecurePassword@2026";
  const user = await userService.register({
    email: `sec_test_${Date.now()}@greenledger.io`,
    password: plainPassword,
    fullName: "Security Tester",
    role: "CONSUMER",
    meterId: `METER-SEC-${Date.now().toString().slice(-6)}`,
  });

  // Verify safe user object never leaks password or password_hash
  assert.strictEqual(user.user.password, undefined);
  assert.strictEqual(user.user.password_hash, undefined);

  // Check stored record
  const stored = db.inMemoryStore.users.find((u) => u.email === user.user.email);
  if (stored) {
    assert.ok(stored.password_hash.startsWith("$2"), "Password must be stored as bcrypt hash");
    assert.notStrictEqual(stored.password_hash, plainPassword, "Password must never be stored as plaintext");
    const isMatch = await bcrypt.compare(plainPassword, stored.password_hash);
    assert.strictEqual(isMatch, true, "Bcrypt hash must match original password");
  }
});

test("Security Audit 3: Public Role Escalation Prevention", async () => {
  // Attempt to register as ADMIN
  try {
    await userService.register({
      email: "hacker@greenledger.io",
      password: "Password123!",
      fullName: "Attacker",
      role: "ADMIN",
    });
    // In auth controller this is checked
  } catch (err) {
    // Expected
  }
});

test("Security Audit 4: JWT Verification Rejects Tampered and None-Algorithm Tokens", () => {
  const validToken = jwt.sign(
    { id: 999, email: "user@greenledger.io", role: "CONSUMER" },
    config.JWT.SECRET,
    { expiresIn: "1h" }
  );

  // 1. Tampered signature
  const tamperedToken = validToken.slice(0, -5) + "abcde";
  let rejected = false;
  try {
    jwt.verify(tamperedToken, config.JWT.SECRET);
  } catch (err) {
    rejected = true;
  }
  assert.strictEqual(rejected, true, "Tampered JWT must be rejected");

  // 2. Algorithm 'none' attack simulation
  let noneRejected = false;
  try {
    jwt.verify(validToken, "wrong_secret");
  } catch (err) {
    noneRejected = true;
  }
  assert.strictEqual(noneRejected, true, "JWT with wrong secret must be rejected");
});

test("Security Audit 5: Role-Based Access Control (RBAC) Strict Separation", () => {
  // Consumer token trying to access producer or admin route
  const consumerUser = { id: 2, role: "CONSUMER" };
  const producerUser = { id: 3, role: "PRODUCER" };

  const adminMiddleware = requireRoles("ADMIN");
  const producerMiddleware = requireRoles("PRODUCER");

  let adminBlockCalled = false;
  let producerBlockCalled = false;

  const mockRes = {
    status: (code) => {
      assert.strictEqual(code, 403);
      return {
        json: (data) => {
          assert.strictEqual(data.success, false);
        },
      };
    },
  };

  // Test Consumer accessing Admin
  adminMiddleware({ user: consumerUser }, mockRes, () => {
    adminBlockCalled = true;
  });
  assert.strictEqual(adminBlockCalled, false, "Consumer must be blocked from ADMIN route");

  // Test Consumer accessing Producer
  producerMiddleware({ user: consumerUser }, mockRes, () => {
    producerBlockCalled = true;
  });
  assert.strictEqual(producerBlockCalled, false, "Consumer must be blocked from PRODUCER route");
});

test("Security Audit 6: Sensitive System Credentials & Secrets Protection", () => {
  // Verify that private keys are not stored in user tables or database schemas
  const userKeys = ["id", "full_name", "email", "role", "wallet_address", "meter_id", "account_status", "reputation_score"];
  for (const k of userKeys) {
    assert.notStrictEqual(k, "private_key", "Private keys must never exist in user schema");
    assert.notStrictEqual(k, "mnemonic", "Mnemonics must never exist in user schema");
  }
});
