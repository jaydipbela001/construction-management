# BuildTrack — Construction Management Admin Panel

A production-oriented Construction Management Admin Panel for a single administrator to
manage multiple independent construction projects, each with its own custom materials,
prices, quantities, and recorded expenses.

There is **no** public registration, customer, contractor, or employee portal. The admin
creates every project and every material manually; a new project always starts empty.

---

## 1. Technology stack

| Layer      | Technology                                                                |
| ---------- | ------------------------------------------------------------------------- |
| Frontend   | React 19, JavaScript only, Vite, React Router, Vanilla CSS, Axios          |
| Backend    | Node.js, Express (v5), JavaScript only, Mongoose                            |
| Database   | MongoDB Atlas                                                              |
| Auth       | JWT (signed), bcryptjs password hashing                                    |
| Deployment | Vercel (static Vite frontend + serverless Express function), MongoDB Atlas |

No TypeScript, no Tailwind, no Bootstrap, no CSS-in-JS. One global stylesheet holds all
design tokens; each component/page has its own plain CSS file.

---

## 2. Project structure

```
construction-management/
├── api/
│   └── index.js                 # Vercel Function detected at /api (re-exports backend)
├── backend/
│   ├── api/
│   │   └── index.js             # Express exported as the serverless handler
│   ├── src/
│   │   ├── app.js               # Express app factory
│   │   ├── config/db.js         # Cached MongoDB connection (serverless-safe)
│   │   ├── models/              # Admin, Project, Material, Expense
│   │   ├── controllers/         # auth, project, material, expense, dashboard
│   │   ├── routes/              # REST route definitions
│   │   ├── middleware/          # auth, error, validateRequest
│   │   ├── services/            # aggregation helpers
│   │   ├── utils/               # ApiError, asyncHandler, money, pagination
│   │   └── scripts/             # createAdmin.js, seedDemo.js
│   ├── server.js                # Local-only Express listener
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js           # Dev proxy /api -> localhost:5000
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── components/          # Navbar, Sidebar, Modal, DataTable, etc.
│       ├── pages/               # Login, Dashboard, Projects, Materials, Expenses…
│       ├── services/            # api.js + one service per resource
│       ├── context/             # AuthContext, ToastContext
│       ├── hooks/               # useAuth, useToast, useDebounce
│       └── utils/               # currency, date, constants, number
├── vercel.json                  # Build + routing for the combined deployment
├── .env.example
└── README.md
```

---

## 3. Local setup

### Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas cluster (or a local `mongodb://` URI for development)

### Steps

```bash
# 1. Install dependencies
npm install --prefix backend
npm install --prefix frontend

# 2. Configure environment
cp .env.example backend/.env         # then edit backend/.env
cp .env.example frontend/.env        # then edit frontend/.env (only VITE_* matter)

# 3. Create the single admin account
npm run create-admin --prefix backend
#   or with explicit values:
#   node backend/src/scripts/createAdmin.js admin@example.com 'StrongPass123'

# 4. (Optional) seed demo data
npm run seed --prefix backend

# 5. Run the API and the frontend (in two terminals)
npm run dev --prefix backend      # http://localhost:5000
npm run dev --prefix frontend     # http://localhost:5173
```

Open http://localhost:5173 and sign in with the admin credentials you created.

The Vite dev server proxies any request to `/api` to `http://localhost:5000`
(configurable via `VITE_DEV_API_URL`), so the frontend always calls relative `/api` URLs.

---

## 4. MongoDB Atlas configuration

1. Create a free M0 cluster at https://www.mongodb.com/atlas.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add an IP access list entry. For Vercel serverless deployments,
   allow `0.0.0.0/0` (all IPs) because function IPs are dynamic, or configure a VPC setup.
4. **Connect** → *Drivers* → copy the connection string.
5. Replace `<user>`, `<password>`, and add a database name, e.g.
   `.../construction_management?retryWrites=true&w=majority`.
6. Put the string in `MONGODB_URI` (local `backend/.env` and in Vercel project settings).

Collections (`admins`, `projects`, `materials`, `expenses`) and indexes are created
automatically by Mongoose on first use.

---

## 5. Initial admin creation

There is **no** public registration endpoint. Create the admin with the seed script:

```bash
# reads ADMIN_EMAIL / ADMIN_PASSWORD from backend/.env
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='StrongPass123!' node backend/src/scripts/createAdmin.js

# or pass them as arguments
node backend/src/scripts/createAdmin.js admin@example.com 'StrongPass123!'
```

Re-running the script with an existing email resets that admin's password. Passwords are
hashed with bcrypt (12 rounds); the plain password is never stored. Do not commit real
credentials.

---

## 6. Environment variables

| Variable             | Where                              | Purpose                                                          |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `MONGODB_URI`        | Vercel + `backend/.env`            | MongoDB Atlas connection string                                  |
| `JWT_SECRET`         | Vercel + `backend/.env`            | Secret used to sign/verify JWTs (long random string)             |
| `JWT_EXPIRES_IN`     | Vercel + `backend/.env`            | Token lifetime, e.g. `7d`                                        |
| `NODE_ENV`           | Vercel + `backend/.env`            | `production` on Vercel                                           |
| `FRONTEND_URL`       | Vercel + `backend/.env`            | Optional comma-separated allowed CORS origins                    |
| `PORT`               | local only                         | Local Express dev port (default `5000`)                          |
| `ADMIN_EMAIL`        | local only                         | Used by `createAdmin.js`                                         |
| `ADMIN_PASSWORD`     | local only                         | Used by `createAdmin.js`                                         |
| `VITE_API_BASE_URL`  | Vercel + `frontend/.env`           | API base URL; leave empty to use relative `/api`                 |
| `VITE_CURRENCY`      | Vercel + `frontend/.env`           | Currency code (default `INR`)                                    |
| `VITE_LOCALE`        | Vercel + `frontend/.env`           | Locale for formatting (default `en-IN`)                          |

> In Vercel, set variables for **both** the build (they are read at build time for the
> `VITE_*` ones) and the serverless function. `VITE_*` values must be present at build time.

---

## 7. API reference

All responses use a consistent envelope: `{ "success": boolean, "data"?: ..., "message"?: ..., "errors"?: {...} }`.
Private routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path                       | Description                     |
| ------ | -------------------------- | ------------------------------- |
| POST   | `/api/auth/login`          | Log in, returns `{ token, admin }` |
| GET    | `/api/auth/me`             | Current admin (protected)       |
| POST   | `/api/auth/logout`         | Stateless logout ack            |
| PATCH  | `/api/auth/profile`        | Update own name/email (protected) |
| POST   | `/api/auth/change-password`| Update own password (protected) |

### Projects (protected)

| Method | Path                       |
| ------ | -------------------------- |
| GET    | `/api/projects`            |
| POST   | `/api/projects`            |
| GET    | `/api/projects/:projectId` |
| PATCH  | `/api/projects/:projectId` |
| DELETE | `/api/projects/:projectId` |

Query params for `GET /api/projects`: `search`, `status`, `sortBy`, `order`, `page`, `limit`.
`GET` a single project also returns `totals` (material count, estimated material value,
expense count, recorded expenses).

### Materials (project-scoped, protected)

```
GET    /api/projects/:projectId/materials
POST   /api/projects/:projectId/materials
GET    /api/projects/:projectId/materials/:materialId
PATCH  /api/projects/:projectId/materials/:materialId
DELETE /api/projects/:projectId/materials/:materialId
```

Query params: `search`, `category`, `sortBy`, `order`, `page`, `limit`.

### Expenses (project-scoped, protected)

```
GET    /api/projects/:projectId/expenses
POST   /api/projects/:projectId/expenses
GET    /api/projects/:projectId/expenses/:expenseId
PATCH  /api/projects/:projectId/expenses/:expenseId
DELETE /api/projects/:projectId/expenses/:expenseId
```

Query params: `search`, `category`, `from`, `to`, `sortBy`, `order`, `page`, `limit`.

### Reports / export (protected)

CSV downloads. Set the `Accept`/token via the app's axios instance; responses include
`Content-Disposition: attachment`.

```
GET    /api/dashboard/export                       Portfolio rollup (one row per project)
GET    /api/projects/:projectId/export/materials   Project materials
GET    /api/projects/:projectId/export/expenses    Project expenses
GET    /api/projects/:projectId/export/summary     Project financial summary
```

A printable report is available in the browser via the dashboard/project **Print** buttons
(print stylesheet in `index.css`).

### Dashboard (protected)

| Method | Path                      | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/api/dashboard/summary`  | Aggregated statistics + chart series + recent items |

The summary also includes `charts.{expenseTrend, expensesByCategory, projectsByStatus}` which
drive the dashboard visualisations.

Status codes: `200` reads/updates, `201` creation, `400` validation, `401` unauthenticated,
`403` forbidden, `404` missing, `409` conflict (duplicate project code), `500` server error.

---

## 8. Business rules enforced

- Creating a project **never** creates materials or expenses, and never copies data from
  another project.
- Materials and expenses are always scoped by `projectId`; a record can only be read or
  modified through the project it belongs to.
- Line total = `quantity × unitPrice`; project estimated material value = sum of line totals.
- Estimated material value is clearly labelled as an estimate and is distinct from recorded
  expenses. Adding a material does **not** create an expense.
- Deleting a project cascades to **only that project's** materials and expenses (inside a
  MongoDB transaction where supported, with an ordered-delete fallback for standalone
  deployments).
- Totals are always recomputed on the backend from validated MongoDB records.
- Duplicate project codes return `409`.

---

## 9. Production deployment (Vercel, single project)

The repository is designed as one Vercel project:

- The **frontend** is built with Vite (`frontend/dist` is the output directory).
- The **backend** is exposed as a single serverless function at `api/index.js` (root), which
  re-exports `backend/api/index.js`. That handler exports the Express app instead of calling
  `app.listen()`.
- MongoDB connections are cached across warm invocations in `backend/src/config/db.js`.

### Steps

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project**, import the repo.
3. **Root Directory:** leave as the repository root.
4. **Framework Preset:** *Other* (or let `vercel.json` decide — it sets `framework: null`).
5. **Build & Output Settings:** leave the defaults; `vercel.json` overrides them:
   - Install Command: `npm install --prefix backend && npm install --prefix frontend`
   - Build Command: `npm run build --prefix frontend`
   - Output Directory: `frontend/dist`
6. **Environment Variables** (Production + Preview):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` = `7d`
   - `NODE_ENV` = `production`
   - `VITE_API_BASE_URL` = *(leave empty)*
   - `VITE_CURRENCY` = `INR`, `VITE_LOCALE` = `en-IN`
   - `FRONTEND_URL` = your production domain (optional; omit if same-origin)
7. **Deploy.**
8. Create the production admin once, locally, against the same database:

   ```bash
   MONGODB_URI="<atlas-uri>" JWT_SECRET="<secret>" \
     node backend/src/scripts/createAdmin.js admin@example.com 'StrongPass123!'
   ```

### vercel.json (included)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "installCommand": "npm install --prefix backend && npm install --prefix frontend",
  "buildCommand": "npm run build --prefix frontend",
  "outputDirectory": "frontend/dist",
  "functions": { "api/index.js": { "maxDuration": 30 } },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- `/api/*` → the Express serverless function.
- Everything else → `/index.html` so client-side routes survive a refresh (no 404).
- Vercel serves real static files (`/assets/*`, favicon) from `frontend/dist` before applying
  rewrites.

### Alternative: two Vercel projects

If you prefer a dedicated API project (for team permissions, independent scaling, or
different regions), deploy `backend/` as its own Vercel project:

- **Root Directory:** `backend`
- Vercel auto-detects `backend/src/app.js` as an Express app when it exports the app.
  (In this repo `backend/api/index.js` is the handler — set the **Output Directory** empty and
  let it deploy as a function, or point `api/index.js` if you move it.)
- Set the backend env vars there and deploy the frontend separately with
  `VITE_API_BASE_URL=https://<backend-domain>/api`.

The single-project setup above is simpler and recommended; the two-project option is only
needed for organisational reasons.

---

## 10. Local development commands

```bash
npm run dev --prefix backend      # Express + nodemon on :5000
npm run dev --prefix frontend     # Vite dev server on :5173 (proxies /api)
npm run build --prefix frontend   # production build -> frontend/dist
npm run lint --prefix frontend    # oxlint
npm test --prefix frontend        # Vitest + React Testing Library
npm run create-admin --prefix backend
npm run seed --prefix backend
```

### Tests

The backend ships two suites:

- `unit` — pure CSV/auth-validator/dashboard-helper tests, always run.
- `integration` — `backend/tests/api.test.js`, which **drops** the database it connects to, so it
  only runs when an explicit test database is provided:

```bash
TEST_MONGODB_URI="mongodb://127.0.0.1:27017/construction_test" npm test --prefix backend
```

The frontend test suite (Vitest + React Testing Library) runs without a database:

```bash
npm test --prefix frontend
```


---

## 11. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `MONGODB_URI is not defined` | Add it to `backend/.env` (local) and Vercel project settings. |
| API returns 500 / times out on Vercel | Check Atlas **Network Access** (allow `0.0.0.0/0`) and that the DB user has read/write. |
| Login always fails | Ensure the admin exists: run `createAdmin.js` against the same `MONGODB_URI`. |
| `Invalid email or password` after deploy | Verify `JWT_SECRET` is set in Vercel; tokens signed with a different secret are rejected. |
| 401 immediately after refresh | Token expired or `JWT_SECRET` changed — log in again. |
| API calls 404 on the deployed site | Confirm `/api/*` rewrite is present and `api/index.js` exists at the repo root. |
| Refreshing a page 404s | The SPA fallback rewrite `/(.*)` → `/index.html` must be present. |
| `VITE_*` value not applied | They are build-time variables — set them in Vercel and redeploy. |
| CORS errors | Leave `FRONTEND_URL` empty for same-origin; otherwise list exact origins, comma-separated. |

---

## 12. Testing checklist

1. Admin logs in and reaches the dashboard.
2. Unauthenticated requests to `/api/*` return `401`; UI redirects to `/login`.
3. Create multiple projects; each appears in the list.
4. A newly created project has **no** materials and **no** expenses.
5. Add custom materials to Project A; Project B stays empty.
6. The same material name can be used in different projects with different prices/quantities.
7. Line totals and estimated material values are computed correctly.
8. Negative prices and zero/negative quantities are rejected (`400`).
9. Expenses stay associated with their project.
10. A Project A material cannot be accessed via Project B's endpoint (`404`).
11. Dashboard and project totals reflect saved MongoDB data.
12. Search, filters, sorting, and pagination work.
13. Expired/invalid JWTs are handled gracefully.
14. Layout works on desktop, tablet, and mobile.
15. API works through the Vercel serverless function; refreshing a route does not 404.
16. Data persists across requests and cold starts.
