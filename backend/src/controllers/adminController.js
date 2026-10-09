const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/admins
 * Lists all admins (safe fields only — never the password hash).
 */
async function listAdmins(_req, res, next) {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      data: { items: admins.map((admin) => admin.toSafeJSON()) },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admins
 * Creates a new admin from an email + password. The new account can log in
 * immediately with those credentials. Body is validated/sanitized by
 * validateRequest(validateCreateAdmin).
 */
async function createAdmin(req, res, next) {
  try {
    const { email, password, name } = req.body;

    const existing = await Admin.exists({ email });
    if (existing) {
      throw new ApiError(409, 'An admin with this email already exists.', {
        email: 'This email is already registered',
      });
    }

    const passwordHash = await Admin.hashPassword(password);
    const admin = await Admin.create({ email, passwordHash, ...(name ? { name } : {}) });

    return res.status(201).json({ success: true, data: { admin: admin.toSafeJSON() } });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAdmins, createAdmin };
