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

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validator for PATCH /api/auth/profile.
 *
 * Only the fields present in the body are returned, so a partial update never
 * clears values the caller did not send. An entirely empty body is rejected.
 */
function validateUpdateProfile(body = {}) {
  const errors = {};
  const data = {};

  if (body.name !== undefined && !isEmpty(body.name)) {
    data.name = String(body.name).trim();
    if (data.name.length > 120) {
      errors.name = 'Name cannot exceed 120 characters';
    }
  }

  if (body.email !== undefined) {
    if (isEmpty(body.email)) {
      errors.email = 'Email cannot be empty';
    } else if (!EMAIL_REGEX.test(String(body.email).trim())) {
      errors.email = 'Please provide a valid email address';
    } else {
      data.email = String(body.email).trim().toLowerCase();
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'Nothing to update. Provide a name or email.');
  }

  return data;
}

/**
 * Validator for POST /api/auth/change-password.
 * The plain password leaves this function only to be hashed in the controller.
 */
function validateChangePassword(body = {}) {
  const errors = {};
  const data = {};

  if (isEmpty(body.currentPassword)) {
    errors.currentPassword = 'Current password is required';
  } else {
    data.currentPassword = String(body.currentPassword);
  }

  if (isEmpty(body.newPassword)) {
    errors.newPassword = 'New password is required';
  } else if (String(body.newPassword).length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  } else if (String(body.newPassword) === String(body.currentPassword)) {
    errors.newPassword = 'New password must be different from the current password';
  } else {
    data.newPassword = String(body.newPassword);
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
}

module.exports = {
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  MIN_PASSWORD_LENGTH,
};
