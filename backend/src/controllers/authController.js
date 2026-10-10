const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');

/**
 * Create a signed JWT for an admin.
 * @param {import('mongoose').Document} admin
 * @returns {string}
 */
function signToken(admin) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ApiError(500, 'Server authentication is not configured.');
    }

    return jwt.sign({ sub: admin._id.toString(), email: admin.email, role: admin.role }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (error) {
    // Re-throw ApiError as-is; wrap anything else.
    throw error instanceof ApiError ? error : new ApiError(500, 'Could not create a session.');
  }
}

/**
 * POST /api/auth/login
 * Body is already validated/sanitized by validateRequest(validateLogin).
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+passwordHash');

    // Uniform message so we never reveal whether the email exists.
    if (!admin || !(await admin.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    return res.status(200).json({
      success: true,
      data: { token: signToken(admin), admin: admin.toSafeJSON() },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/auth/me
 * `req.admin` was attached by the protect middleware.
 */
async function me(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: { admin: req.admin.toSafeJSON() } });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logout is handled in the client by dropping the
 * token. This endpoint exists for a clear API contract.
 */
async function logout(_req, res, next) {
  try {
    return res.status(200).json({ success: true, data: { message: 'Logged out.' } });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/auth/profile
 * Lets the signed-in admin update their own name and/or email. Body is
 * validated/sanitized by validateRequest(validateUpdateProfile).
 */
async function updateProfile(req, res, next) {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(404, 'Account not found.');
    }

    const { email, name } = req.body;

    if (email && email !== admin.email) {
      const existing = await Admin.exists({ email, _id: { $ne: admin._id } });
      if (existing) {
        throw new ApiError(409, 'An admin with this email already exists.', {
          email: 'This email is already registered',
        });
      }
    }

    if (name !== undefined) admin.name = name;
    if (email !== undefined) admin.email = email;
    await admin.save();

    return res.status(200).json({ success: true, data: { admin: admin.toSafeJSON() } });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/change-password
 * Verifies the current password before storing the new hash. Body is
 * validated/sanitized by validateRequest(validateChangePassword).
 */
async function changePassword(req, res, next) {
  try {
    const admin = await Admin.findById(req.admin._id).select('+passwordHash');
    if (!admin) {
      throw new ApiError(404, 'Account not found.');
    }

    const { currentPassword, newPassword } = req.body;

    if (!(await admin.comparePassword(currentPassword))) {
      throw new ApiError(400, 'Validation failed', {
        currentPassword: 'Current password is incorrect',
      });
    }

    admin.passwordHash = await Admin.hashPassword(newPassword);
    await admin.save();

    return res
      .status(200)
      .json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, me, logout, updateProfile, changePassword };
