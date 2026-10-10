const express = require('express');
const { getSummary } = require('../controllers/dashboardController');
const { exportDashboard } = require('../controllers/reportController');

const router = express.Router();

router.get('/summary', getSummary);
router.get('/export', exportDashboard);

module.exports = router;
