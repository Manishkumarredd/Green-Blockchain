/**
 * Standardized Custom AppError and Error Response Utility
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

function sendError(res, message = "Internal Server Error", statusCode = 500, details = null) {
  const payload = {
    success: false,
    error: message,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  AppError,
  sendError,
};
