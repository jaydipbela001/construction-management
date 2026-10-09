const { getDashboardSummary } = require('../services/dashboardService');

/**
 * GET /api/dashboard
 * Returns global aggregates + recent activity. All heavy lifting lives in
 * services/dashboardService.js, keeping this controller thin.
 */
async function getSummary(_req, res, next) {
  try {
    const summary = await getDashboardSummary();
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSummary };
