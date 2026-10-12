const express = require('express');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { getProjectReport } = require('../controllers/reportController');
const { validateRequest } = require('../middleware/validateRequest');
const { validateCreateProject, validateUpdateProject } = require('../validators/projectValidator');
const materialRoutes = require('./materialRoutes');
const expenseRoutes = require('./expenseRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router
  .route('/')
  .get(listProjects)
  .post(validateRequest(validateCreateProject), createProject);

router
  .route('/:projectId')
  .get(getProject)
  .patch(validateRequest(validateUpdateProject), updateProject)
  .delete(deleteProject);

// Full JSON payload for the printable project report (PDF).
router.get('/:projectId/report', getProjectReport);

// Nested resources: materials and expenses always live under a project.
// mergeParams (in those routers) makes :projectId available to their controllers.
router.use('/:projectId/materials', materialRoutes);
router.use('/:projectId/expenses', expenseRoutes);
router.use('/:projectId/export', reportRoutes);

module.exports = router;
