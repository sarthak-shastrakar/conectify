/**
 * Centralized error handler — MUST be registered as the LAST middleware in app.js.
 *
 * In production: generic messages only — no stack traces leaked to clients.
 * In development: full error detail for debugging.
 * Always returns a consistent shape: { success: false, message: "..." }
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // --- Mongoose: Bad ObjectId (e.g. /users/not-a-valid-id) ---
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  // --- Mongoose: Duplicate key (unique index violation) ---
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {}).join(", ");
    message = `${field} already exists`;
  }

  // --- JWT: invalid signature or malformed ---
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // --- JWT: expired ---
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // --- Mongoose: validation failed ---
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Never expose stack traces in production
  const response = { success: false, message };
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export { errorHandler };
