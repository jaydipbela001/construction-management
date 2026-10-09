const express = require('express');
const { listAdmins, createAdmin } = require('../controllers/adminController');
const { validateRequest } = require('../middleware/validateRequest');
const { validateCreateAdmin } = require('../validators/adminValidator');

const router = express.Router();

router
  .route('/')
  .get(listAdmins)
  .post(validateRequest(validateCreateAdmin), createAdmin);

module.exports = router;
