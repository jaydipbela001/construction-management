const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, me, logout, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const {
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
} = require('../validators/authValidator');

const router = express.Router();

// Throttle login attempts to slow down brute-force attacks.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

// Public
router.post('/login', loginLimiter, validateRequest(validateLogin), login);

// Protected
router.get('/me', protect, me);
router.post('/logout', protect, logout);
router.patch('/profile', protect, validateRequest(validateUpdateProfile), updateProfile);
router.post('/change-password', protect, validateRequest(validateChangePassword), changePassword);

module.exports = router;
