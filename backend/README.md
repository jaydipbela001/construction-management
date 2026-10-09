# Backend — Construction Management API

Node.js + Express + Mongoose API. Written in plain JavaScript (CommonJS).
It powers a single-admin panel with multiple, fully isolated projects.

---

## 1. How a request flows

```
  Browser (Axios)
        |
        v
   Express app            src/app.js
        |
        |-- helmet / cors / express.json
        |
   /api/health  (liveness, no DB)
        |
   /api DB guard          src/config/db.js   -> cached MongoDB connection
        |
        v
   Router                 src/routes/*.js
        |                 - matches the URL
        |                 - attaches auth (protect)
        |                 - attaches validation (validateRequest)
        v
   Validator              src/validators/*.js   (pure function)
        |                 returns clean data or throws ApiError(400)
        v
   Controller             src/controllers/*.js
        |                 try { ... } catch (error) { next(error) }
        |                 calls a service when logic is shared
        v
   Service                src/services/*.js   (reusable business logic)
        |
        v
   Model                  src/models/*.js   -> MongoDB
```

Every layer has **one job**:

| Layer        | Responsibility                                                        |
| ------------ | --------------------------------------------------------------------- |
| `routes/`    | URL -> middleware -> controller. Declarative, no logic.               |
| `validators/`| Validate + sanitize `req.body`. Pure functions, easily testable.       |
| `controllers/`| Read `req`, call services/models, send `res`. Always `try/catch`.    |
| `services/`  | Reusable business logic (project lookup, totals, dashboard summary).  |
| `models/`    | Mongoose schemas, indexes, defaults, simple helpers.                  |
| `middleware/`| Cross-cutting concerns (auth, validation runner, error handling).     |
| `utils/`     | Tiny shared helpers (ApiError, money rounding, pagination).           |
| `config/`    | Environment loading and the MongoDB connection.                       |

### Error handling (uniform)

Controllers never format errors. They call `next(error)` and the central
`errorMiddleware.js` turns it into one JSON shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "name": "Project name is required" }
}
```

`ApiError` (`utils/ApiError.js`) carries the HTTP status and optional field
details. Common Mongoose errors are auto-translated:

| Mongoose error            | HTTP |
| ------------------------- | ---- |
| `ValidationError`         | 400  |
| `CastError` (bad ObjectId)| 400  |
| duplicate key (`11000`)   | 409  |
| unknown / unexpected      | 500  |

---

## 2. Folder structure

```
backend/
├── api/
│   └── index.js              # Vercel serverless entry (exports the app)
├── server.js                 # Local dev server (node server.js)
├── tests/
│   └── api.test.js           # Integration tests (needs TEST_MONGODB_URI)
└── src/
    ├── app.js                # Express app factory: createApp()
    ├── config/
    │   ├── db.js             # Cached MongoDB connection
    │   └── loadEnv.js        # Loads .env from backend/ and repo root
    ├── controllers/          # HTTP layer (try/catch -> next(error))
    │   ├── authController.js
    │   ├── projectController.js
    │   ├── materialController.js
    │   ├── expenseController.js
    │   └── dashboardController.js
    ├── middleware/
    │   ├── authMiddleware.js     # protect: verifies JWT, sets req.admin
    │   ├── validateRequest.js    # runs a validator, stores clean req.body
    │   └── errorMiddleware.js    # notFoundHandler + errorHandler
    ├── models/
    │   ├── Admin.js
    │   ├── Project.js
    │   ├── Material.js
    │   └── Expense.js
    ├── routes/               # URL wiring + middleware order
    ├── services/             # Shared business logic
    │   ├── projectService.js     # findProjectOrFail, computeProjectTotals
    │   └── dashboardService.js   # global aggregates
    ├── validators/           # Pure body validators
    ├── utils/
    │   ├── ApiError.js
    │   ├── asyncHandler.js   # optional wrapper (project uses try/catch)
    │   ├── generateProjectCode.js
    │   ├── helpers.js        # isEmpty, isObjectId
    │   ├── money.js          # roundMoney
    │   └── pagination.js     # parsePagination, escapeRegex
    └── scripts/
        ├── createAdmin.js    # Create/reset the admin password
        └── seedDemo.js       # Optional demo data
```

---

## 3. Business rules enforced by the backend

1. **Projects are isolated.** Every material/expense query is scoped by
   `projectId`, so data can never leak between projects.
2. **New projects start empty.** `createProject` creates nothing else; only the
   project document is inserted.
3. **No copying.** There is no code path that copies materials/expenses from one
   project to another.
4. **`lineTotal = quantity x unitPrice`.** Computed on read, never stored.
5. **Stock is derived.** Each material stores `quantity` (total purchased) and
   `usedQuantity`; `currentStock = quantity - usedQuantity` is a virtual, and
   `usedQuantity` can never exceed `quantity`.
6. **Estimated material value ≠ recorded expenses.** They are two separate
   totals derived from different collections.
7. **Materials never create expenses.** Adding a material touches only the
   `materials` collection.
8. **Cascade delete.** Deleting a project removes only that project's materials
   and expenses, inside a transaction when the MongoDB topology supports it,
   with an ordered-delete fallback for standalone MongoDB.

---

## 4. Environment variables

Create a single `.env` in the repository root (see `.env.example`):

| Variable            | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `MONGODB_URI`       | MongoDB Atlas / local connection string       |
| `JWT_SECRET`        | Secret used to sign JWTs                      |
| `JWT_EXPIRES_IN`    | Token lifetime (default `7d`)                 |
| `NODE_ENV`          | `development` / `production`                  |
| `FRONTEND_URL`      | Comma-separated allowed CORS origins          |
| `PORT`              | Local dev port (default `5000`)               |
| `ADMIN_EMAIL`       | Used by `createAdmin.js`                      |
| `ADMIN_PASSWORD`    | Used by `createAdmin.js`                      |
| `TEST_MONGODB_URI`  | Test database (the suite DROPS it)            |

`src/config/loadEnv.js` loads `backend/.env` (optional override) and then the
root `.env`, so the backend works no matter which directory you run it from.
On Vercel, values come from Project Settings instead.

---

## 5. Scripts

```bash
npm run dev            # nodemon server.js
npm start              # node server.js
npm run create-admin   # create / reset admin (ADMIN_EMAIL + ADMIN_PASSWORD)
npm run seed           # optional demo data (only if no projects exist)
npm test               # integration tests (skipped unless TEST_MONGODB_URI set)
```

Run the tests against a throwaway database:

```bash
TEST_MONGODB_URI="mongodb://127.0.0.1:27017/construction_test" npm test
```

---

## 6. API summary

| Method | Path                                              | Auth | Description             |
| ------ | ------------------------------------------------- | ---- | ----------------------- |
| POST   | `/api/auth/login`                                 | no   | Get a JWT                |
| GET    | `/api/auth/me`                                    | yes  | Current admin           |
| POST   | `/api/auth/logout`                                | yes  | No-op logout            |
| GET    | `/api/admins`                                     | yes  | List admins             |
| POST   | `/api/admins`                                     | yes  | Create an admin         |
| GET    | `/api/dashboard/summary`                          | yes  | Global aggregates       |
| GET    | `/api/projects`                                   | yes  | List + search + paging  |
| POST   | `/api/projects`                                   | yes  | Create empty project    |
| GET    | `/api/projects/:projectId`                        | yes  | Project + totals        |
| PATCH  | `/api/projects/:projectId`                        | yes  | Update project          |
| DELETE | `/api/projects/:projectId`                        | yes  | Cascade delete          |
| GET    | `/api/projects/:projectId/materials`              | yes  | List materials          |
| POST   | `/api/projects/:projectId/materials`              | yes  | Add material            |
| GET    | `/api/projects/:projectId/materials/:materialId`  | yes  | Get one                 |
| PATCH  | `/api/projects/:projectId/materials/:materialId`  | yes  | Update one              |
| DELETE | `/api/projects/:projectId/materials/:materialId`  | yes  | Delete one              |
| GET    | `/api/projects/:projectId/expenses`               | yes  | List expenses           |
| POST   | `/api/projects/:projectId/expenses`               | yes  | Add expense             |
| GET    | `/api/projects/:projectId/expenses/:expenseId`    | yes  | Get one                 |
| PATCH  | `/api/projects/:projectId/expenses/:expenseId`    | yes  | Update one              |
| DELETE | `/api/projects/:projectId/expenses/:expenseId`    | yes  | Delete one              |
