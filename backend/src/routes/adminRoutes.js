const express = require('express');
const { listAdmins, createAdmin, deleteAdmin } = require('../controllers/adminController');
const { validateRequest } = require('../middleware/validateRequest');
const { validateCreateAdmin } = require('../validators/adminValidator');
const { restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(listAdmins)
  .post(validateRequest(validateCreateAdmin), createAdmin);

router.delete('/:id', restrictTo('superadmin'), deleteAdmin);

module.exports = router;
