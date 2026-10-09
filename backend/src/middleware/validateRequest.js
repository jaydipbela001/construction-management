const ApiError = require('../utils/ApiError');

/**
 * Turns a pure validator function into Express middleware.
 *
 * Flow:
 *   route -> validateRequest(validateX) -> controller
 *
 * The validator receives `req.body` and must return a sanitized object (or
 * throw an ApiError). The clean object replaces `req.body`, so controllers can
 * trust that the data they read is already valid and normalized.
 *
 * Usage:
 *   router.post('/', validateRequest(validateCreateProject), createProject);
 */
function validateRequest(validator) {
  return function validate(req, _res, next) {
    try {
      req.body = validator(req.body, req) || {};
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/**
 * Builds a validation middleware that throws a 400 when a body is empty.
 * Handy for endpoints where the entire body is required.
 */
function requireBody(req, _res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ApiError(400, 'Request body cannot be empty');
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { validateRequest, requireBody };
