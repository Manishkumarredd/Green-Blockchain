const { sendError } = require("../utils/errorHandler");

/**
 * Centralized Express Error Handling Middleware
 */
function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Handle Zod or JSON syntax errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, "Malformed JSON payload in request body", 400);
  }

  return sendError(res, message, statusCode, err.details || null);
}

function notFoundHandler(req, res, next) {
  return sendError(res, `Resource endpoint not found: ${req.method} ${req.originalUrl}`, 404);
}

module.exports = {
  errorMiddleware,
  notFoundHandler,
};
