const ApiError = require('../utils/ApiError');
const { isEmpty } = require('../utils/helpers');

/**
 * Validator for POST /api/auth/login.
 *
 * Pure function: receives the raw request body and either returns a clean,
 * sanitized object or throws an ApiError(400) with field-level messages.
 */
function validateLogin(body = {}) {
  const errors = {};

  if (isEmpty(body.email)) errors.email = 'Email is required';
  if (isEmpty(body.password)) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return {
    email: String(body.email).trim().toLowerCase(),
    password: String(body.password),
  };
}

module.exports = { validateLogin };
