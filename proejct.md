Your project is a Simple Construction Management Admin Panel. I’ll give you two things:

The purpose of your project and how the complete system should work.

One complete AI prompt you can copy into an AI coding tool to generate the frontend, backend, database, folder structure, responsive UI, and Vercel deployment configuration.

The project will use React.js + JavaScript + Vanilla CSS for the frontend and Node.js + Express.js + JavaScript + MongoDB for the backend. No TypeScript and no Tailwind CSS.

1. Project purpose

The purpose is to manage multiple construction projects from a single admin panel. Each construction project has its own materials, prices, quantities, and expenses.

For example, you might create these projects:

Project 1 — Residential House

Independent project records

Iron — ₹65/kg — 500 kg

Cement — ₹380/bag — 100 bags

Wood — ₹1,200/unit — 20 units

Project 2 — Commercial Building

Separate materials and expenses

Sand — ₹1,500/ton — 10 tons

Cement — ₹390/bag — 200 bags

Bricks — ₹8/piece — 5,000 pieces

These are illustrative examples. The important point is that each project manages its own materials independently.

How the application works

Admin Login

Secure access to the admin panel

Dashboard

Total projects, materials, and expenses

Create or select a project

Each construction project is independent

Manage project materials

Add, edit, delete, and track custom items

Calculate costs and expenses

Quantity × unit price, with project totals

Important business rules

The admin can create multiple construction projects.

Creating a new project must not automatically create any materials.

Each project starts with an empty materials list.

The admin manually adds materials such as iron, wood, cement, sand, bricks, or any custom item.

Every material belongs to a specific project. The same material name can exist in multiple projects with different prices and quantities.

Material records and expenses from one project must never accidentally appear in another project.

All project and material data must persist in MongoDB.

The application must work properly on desktop, tablet, and mobile screens.

2. Recommended design and technology
Color combination and typography

Use a modern construction-industry dashboard style: professional, clean, easy to read, and not overly colorful.

Recommended color palette

Primary — Navy

#1E293B

Accent — Construction Orange

#F59E0B

Background

#F8FAFC

Card Surface

#FFFFFF

Primary Text

#0F172A

Secondary Text

#64748B

Success

#16A34A

Danger

#DC2626

Recommended font

Inter

Use Inter for headings, forms, tables, dashboard metrics, and mobile layouts. Load it from Google Fonts or bundle it locally.

All colors, font families, font sizes, spacing, border radii, shadows, and other design tokens should be defined in one global CSS file. Individual component styles must reference these variables rather than hardcoding colors.

3. Recommended folder structure

Use a single repository for both frontend and backend so they can be deployed together on Vercel.

construction-management/

Frontend — React + JavaScript + Vanilla CSS

frontend/

src/

assets/

components/

Navbar.jsx, Navbar.css

Sidebar.jsx, Sidebar.css

Modal.jsx, Modal.css

DataTable.jsx, DataTable.css

ProtectedRoute.jsx

pages/

Login.jsx, Login.css

Dashboard.jsx, Dashboard.css

Projects.jsx, Projects.css

ProjectDetails.jsx, ProjectDetails.css

Materials.jsx, Materials.css

Expenses.jsx, Expenses.css

services/api.js

context/AuthContext.jsx

hooks/

utils/

App.jsx

main.jsx

index.css — global CSS variables and reset

index.html, package.json, vite.config.js

Backend — Express + Node.js + MongoDB

backend/

api/index.js — Vercel serverless entry

src/app.js — Express app configuration

config/db.js — MongoDB connection

models/Admin.js

models/Project.js

models/Material.js

models/Expense.js

controllers/authController.js

controllers/projectController.js

controllers/materialController.js

controllers/expenseController.js

routes/authRoutes.js

routes/projectRoutes.js

routes/materialRoutes.js

routes/expenseRoutes.js

middleware/authMiddleware.js

middleware/errorMiddleware.js

services/

utils/

Root configuration

vercel.json

.gitignore

.env.example

README.md

This is the logical structure; the exact Vercel routing and package configuration should be generated and tested against the chosen deployment layout.