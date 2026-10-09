// Root Vercel Function detected by the zero-config `api` directory.
// It simply re-exports the backend Express handler so the whole API lives in
// `/backend` while still being deployable as a single Vercel project.
module.exports = require('../backend/api/index.js');
