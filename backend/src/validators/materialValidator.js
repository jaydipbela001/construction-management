const ApiError = require('../utils/ApiError');
const { isEmpty } = require('../utils/helpers');

/**
 * Parse a required/optional number.
 * @param {unknown} value
 * @param {string} field
 * @param {{ allowZero: boolean, required: boolean }} options
 * @param {object} errors
 */
function parseNumber(value, field, options, errors) {
  const { allowZero, required } = options;

  if (isEmpty(value)) {
    if (required) errors[field] = `${field} is required`;
    return undefined;
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    errors[field] = `${field} must be a valid number`;
    return undefined;
  }
  if (number < 0) {
    errors[field] = `${field} cannot be negative`;
    return undefined;
  }
  if (!allowZero && number === 0) {
    errors[field] = `${field} must be greater than zero`;
    return undefined;
  }
  return number;
}

/**
 * Shared builder for create (partial: false) and update (partial: true).
 */
function buildMaterialData(body = {}, { partial }) {
  const errors = {};
  const data = {};

  if (!partial || body.name !== undefined) {
    if (isEmpty(body.name)) errors.name = 'Material name is required';
    else data.name = String(body.name).trim();
  }

  if (!partial || body.unit !== undefined) {
    if (isEmpty(body.unit)) errors.unit = 'Unit is required';
    else data.unit = String(body.unit).trim();
  }

  if (!partial || body.quantity !== undefined) {
    const quantity = parseNumber(body.quantity, 'quantity', { allowZero: false, required: true }, errors);
    if (quantity !== undefined) data.quantity = quantity;
  }

  if (body.usedQuantity !== undefined) {
    const usedQuantity = parseNumber(body.usedQuantity, 'usedQuantity', { allowZero: true, required: false }, errors);
    if (usedQuantity !== undefined) data.usedQuantity = usedQuantity;
  }

  if (!partial || body.unitPrice !== undefined) {
    const unitPrice = parseNumber(body.unitPrice, 'unitPrice', { allowZero: true, required: true }, errors);
    if (unitPrice !== undefined) data.unitPrice = unitPrice;
  }

  if (body.category !== undefined) data.category = String(body.category || '').trim();
  if (body.description !== undefined) data.description = String(body.description || '').trim();
  if (body.supplier !== undefined) data.supplier = String(body.supplier || '').trim();
  if (body.notes !== undefined) data.notes = String(body.notes || '').trim();

  if (body.purchaseDate !== undefined) {
    if (isEmpty(body.purchaseDate)) {
      data.purchaseDate = null;
    } else {
      const date = new Date(body.purchaseDate);
      if (Number.isNaN(date.getTime())) errors.purchaseDate = 'Invalid purchase date';
      else data.purchaseDate = date;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
}

/** POST /api/projects/:projectId/materials */
const validateCreateMaterial = (body) => buildMaterialData(body, { partial: false });

/** PATCH /api/projects/:projectId/materials/:materialId */
const validateUpdateMaterial = (body) => buildMaterialData(body, { partial: true });

module.exports = { validateCreateMaterial, validateUpdateMaterial };
