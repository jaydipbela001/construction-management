const express = require('express');
const {
  exportProjectMaterials,
  exportProjectExpenses,
  exportProjectSummary,
} = require('../controllers/reportController');

// mergeParams lets this router read :projectId from the parent route.
const router = express.Router({ mergeParams: true });

router.get('/materials', exportProjectMaterials);
router.get('/expenses', exportProjectExpenses);
router.get('/summary', exportProjectSummary);

module.exports = router;
