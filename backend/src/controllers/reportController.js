const { sendCsv } = require('../utils/csv');
const { findProjectOrFail } = require('../services/projectService');
const {
  buildProjectMaterialsCsv,
  buildProjectExpensesCsv,
  buildProjectSummaryCsv,
  buildProjectReport,
  buildDashboardCsv,
} = require('../services/reportService');

/**
 * GET /api/projects/:projectId/report
 * JSON payload (project + totals + all materials + all expenses) that the
 * frontend renders into a printable PDF report.
 */
async function getProjectReport(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);
    const report = await buildProjectReport(project);
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/dashboard/export
 * Portfolio-wide CSV: one row per project with material/expense totals.
 */
async function exportDashboard(req, res, next) {
  try {
    const { filename, csv } = await buildDashboardCsv();
    return sendCsv(res, filename, csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:projectId/export/materials
 */
async function exportProjectMaterials(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);
    const { filename, csv } = await buildProjectMaterialsCsv(project);
    return sendCsv(res, filename, csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:projectId/export/expenses
 */
async function exportProjectExpenses(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);
    const { filename, csv } = await buildProjectExpensesCsv(project);
    return sendCsv(res, filename, csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:projectId/export/summary
 */
async function exportProjectSummary(req, res, next) {
  try {
    const project = await findProjectOrFail(req.params.projectId);
    const { filename, csv } = await buildProjectSummaryCsv(project);
    return sendCsv(res, filename, csv);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProjectReport,
  exportDashboard,
  exportProjectMaterials,
  exportProjectExpenses,
  exportProjectSummary,
};
