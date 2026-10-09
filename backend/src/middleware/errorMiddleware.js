const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

/**
 * Runs when no route matched. Forwards a 404 to the error handler.
 */
function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Every controller/middleware sends errors here via
 * `next(error)`, so the JSON error shape is defined in exactly one place.
 *
 * It also translates common Mongoose/driver errors into clean ApiErrors:
 *   - ValidationError -> 400 with per-field messages
 *   - CastError       -> 400 (bad ObjectId, etc.)
 *   - duplicate key    -> 409
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  try {
    let error = err;

    if (error instanceof mongoose.Error.ValidationError) {
      const details = Object.fromEntries(
        Object.entries(error.errors).map(([field, e]) => [field, e.message])
      );
      error = new ApiError(400, 'Validation failed', details);
    }

    if (error instanceof mongoose.Error.CastError) {
      error = new ApiError(400, `Invalid value for ${error.path}: ${error.value}`);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      error = new ApiError(409, `A record with this ${field} already exists.`);
    }

    const statusCode = error.statusCode || 500;
    const isServerError = statusCode >= 500;

    if (isServerError) {
      // eslint-disable-next-line no-console
      console.error('[ServerError]', err);
    }

    return res.status(statusCode).json({
      success: false,
      message: isServerError ? 'Something went wrong. Please try again later.' : error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  } catch (unexpected) {
    // Last-resort guard so the request never hangs without a response.
    // eslint-disable-next-line no-console
    console.error('[FatalErrorHandler]', unexpected);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
}

module.exports = { notFoundHandler, errorHandler };
