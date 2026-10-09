const { PROJECT_STATUSES } = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { isEmpty } = require('../utils/helpers');

const DATE_FIELDS = ['startDate', 'expectedCompletionDate', 'actualCompletionDate'];

/**
 * Parse an optional date value. Records a validation error when the value is
 * present but cannot be parsed, otherwise returns a Date or null.
 */
function parseDate(value, field, errors) {
  if (isEmpty(value)) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors[field] = 'Invalid date';
    return undefined;
  }
  return date;
}

/**
 * Shared builder for create (partial: false) and update (partial: true).
 * - create: every required field must be supplied.
 * - update: only the fields present in the body are validated/returned.
 */
function buildProjectData(body = {}, { partial }) {
  const errors = {};
  const data = {};

  if (!partial || body.name !== undefined) {
    if (isEmpty(body.name)) errors.name = 'Project name is required';
    else data.name = String(body.name).trim();
  }

  if (!partial || body.projectCode !== undefined) {
    if (!isEmpty(body.projectCode)) data.projectCode = String(body.projectCode).trim().toUpperCase();
  }

  if (body.description !== undefined) data.description = String(body.description || '').trim();
  if (body.location !== undefined) data.location = String(body.location || '').trim();
  if (body.notes !== undefined) data.notes = String(body.notes || '').trim();

  if (!partial || body.status !== undefined) {
    const status = body.status || 'planned';
    if (!PROJECT_STATUSES.includes(status)) {
      errors.status = `Status must be one of: ${PROJECT_STATUSES.join(', ')}`;
    } else {
      data.status = status;
    }
  }

  for (const field of DATE_FIELDS) {
    if (body[field] !== undefined) {
      const parsed = parseDate(body[field], field, errors);
      if (parsed !== undefined) data[field] = parsed;
    }
  }

  // Date relationship rules, applied to the dates supplied in this request.
  const { startDate: start, expectedCompletionDate: expected, actualCompletionDate: actual } = data;
  if (start && expected && expected < start) {
    errors.expectedCompletionDate = 'Expected completion date cannot be before the start date';
  }
  if (start && actual && actual < start) {
    errors.actualCompletionDate = 'Actual completion date cannot be before the start date';
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
}

/** POST /api/projects */
const validateCreateProject = (body) => buildProjectData(body, { partial: false });

/** PATCH /api/projects/:projectId */
const validateUpdateProject = (body) => buildProjectData(body, { partial: true });

module.exports = { validateCreateProject, validateUpdateProject };
