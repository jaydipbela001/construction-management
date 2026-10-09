const ApiError = require('../utils/ApiError');
const { isEmpty } = require('../utils/helpers');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validator for POST /api/admins (create a new admin).
 *
 * Pure function: returns clean data or throws ApiError(400).
 * The plain password leaves this function only to be hashed in the controller;
 * it is never stored or returned.
 */
function validateCreateAdmin(body = {}) {
  const errors = {};
  const data = {};

  if (!isEmpty(body.name)) {
    data.name = String(body.name).trim();
  }

  if (isEmpty(body.email)) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
    errors.email = 'Please provide a valid email address';
  } else {
    data.email = String(body.email).trim().toLowerCase();
  }

  if (isEmpty(body.password)) {
    errors.password = 'Password is required';
  } else if (String(body.password).length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  } else {
    data.password = String(body.password);
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
}

module.exports = { validateCreateAdmin, MIN_PASSWORD_LENGTH };
