const { sendCsv } = require('../utils/csv');
const { findProjectOrFail } = require('../services/projectService');
const {
  buildProjectMaterialsCsv,
  buildProjectExpensesCsv,
  buildProjectSummaryCsv,
  buildDashboardCsv,
} = require('../services/reportService');

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
  exportDashboard,
  exportProjectMaterials,
  exportProjectExpenses,
  exportProjectSummary,
};
