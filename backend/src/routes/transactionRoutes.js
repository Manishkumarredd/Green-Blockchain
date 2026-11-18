const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { createTransactionSchema } = require("../validators/schemas");

router.use(authenticateToken);

router.post("/", requireRoles("CONSUMER", "ADMIN"), validate(createTransactionSchema), transactionController.createTransaction);
router.get("/", transactionController.getTransactions);
router.get("/history", transactionController.getHistory);
router.get("/:id", transactionController.getTransactionById);

module.exports = router;
