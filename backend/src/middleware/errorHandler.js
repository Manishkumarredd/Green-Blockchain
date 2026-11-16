/**
 * Global Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode}`, err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    status: 404,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
