const transactionService = require("../services/transactionService");
const { sendSuccess } = require("../utils/responseHandler");

class TransactionController {
  async createTransaction(req, res, next) {
    try {
      const transaction = await transactionService.createTransaction({
        consumerId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, transaction, "Energy transaction settled successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const transactions = await transactionService.getUserTransactions(req.user.id, req.user.role);
      return sendSuccess(res, transactions, "Transactions retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async getTransactionById(req, res, next) {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);
      return sendSuccess(res, transaction, "Transaction details retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const transactions = await transactionService.getUserTransactions(req.user.id, req.user.role);
      return sendSuccess(res, transactions, "Transaction history retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TransactionController();
