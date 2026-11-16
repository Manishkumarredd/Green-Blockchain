const { sendError } = require("../utils/errorHandler");

/**
 * Zod Schema Validation Middleware Factory
 * @param {import('zod').ZodSchema} schema 
 * @param {'body'|'query'|'params'} source 
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      const issues = err.issues || err.errors;
      if (issues && Array.isArray(issues)) {
        const details = issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
          message: e.message,
        }));
        return sendError(res, `Validation failed: ${details.map((d) => d.message).join("; ")}`, 400, details);
      }
      return sendError(res, err.message, 400);
    }
  };
}

module.exports = {
  validate,
};
