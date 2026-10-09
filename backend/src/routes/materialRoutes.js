const express = require('express');
const {
  listMaterials,
  createMaterial,
  getMaterial,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');
const { validateRequest } = require('../middleware/validateRequest');
const {
  validateCreateMaterial,
  validateUpdateMaterial,
} = require('../validators/materialValidator');

// mergeParams lets this router read :projectId from the parent route.
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(listMaterials)
  .post(validateRequest(validateCreateMaterial), createMaterial);

router
  .route('/:materialId')
  .get(getMaterial)
  .patch(validateRequest(validateUpdateMaterial), updateMaterial)
  .delete(deleteMaterial);

module.exports = router;
