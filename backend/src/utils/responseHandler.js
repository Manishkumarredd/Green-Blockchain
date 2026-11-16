/**
 * Standardized API Response Handler
 * Provides uniform JSON envelope across all endpoints:
 * {
 *   success: true,
 *   message: string,
 *   data: any,
 *   meta?: { page, limit, total, totalPages }
 * }
 */
function sendSuccess(res, data = null, message = "Success", statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== null && typeof meta === "object") {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
};
