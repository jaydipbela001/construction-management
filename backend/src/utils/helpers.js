const mongoose = require('mongoose');

/**
 * Small, dependency-free helpers shared across the backend.
 * Keeping them in one place avoids duplicating the same checks everywhere.
 */

/**
 * Returns true when a value is undefined, null, or an empty/whitespace string.
 * @param {unknown} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Returns true when a value can be cast to a MongoDB ObjectId.
 * @param {unknown} value
 * @returns {boolean}
 */
function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value));
}

module.exports = { isEmpty, isObjectId };
