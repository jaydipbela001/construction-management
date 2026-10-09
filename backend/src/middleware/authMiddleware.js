const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware.
 *
 * Flow:
 *   1. Read the "Authorization: Bearer <token>" header.
 *   2. Verify the JWT signature/expiry.
 *   3. Load the admin from the token subject.
 *   4. Attach it to `req.admin` for downstream controllers.
 *
 * Any failure is forwarded to the error middleware, which returns the right
 * status code and JSON shape.
 */
async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Your session has expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid authentication token.');
    }

    const admin = await Admin.findById(payload.sub);
    if (!admin) {
      throw new ApiError(401, 'The account for this session no longer exists.');
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { protect };
