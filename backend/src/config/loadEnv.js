const path = require('path');
const dotenv = require('dotenv');

/**
 * Load environment variables for local development.
 *
 * The project keeps a single `.env` at the repository root (see
 * `.env.example`), but the backend runs from the `backend/` directory.
 * Plain `dotenv.config()` would only look at `backend/.env` and miss it,
 * which is why the server used to start with zero variables.
 *
 * Loading order (first value wins because dotenv never overrides existing
 * variables):
 *   1. backend/.env        (optional, local override)
 *   2. <repo root>/.env    (the shared file)
 *
 * On Vercel no `.env` file exists; real values come from Project Settings.
 */
function loadEnv() {
  const backendEnv = path.resolve(__dirname, '..', '..', '.env');
  const rootEnv = path.resolve(__dirname, '..', '..', '..', '.env');

  dotenv.config({ path: backendEnv });
  dotenv.config({ path: rootEnv });
}

module.exports = loadEnv;
