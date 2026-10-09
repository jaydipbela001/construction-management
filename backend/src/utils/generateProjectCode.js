const crypto = require('crypto');
const Project = require('../models/Project');

async function generateProjectCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `PRJ-${crypto.randomBytes(3).toString('hex').toUpperCase()}${Date.now()
      .toString()
      .slice(-4)}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await Project.exists({ projectCode: code });
    if (!existing) return code;
  }
  throw new Error('Unable to generate a unique project code. Please try again.');
}

module.exports = { generateProjectCode };
