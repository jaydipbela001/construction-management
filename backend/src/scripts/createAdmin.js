/* eslint-disable no-console */
require('../config/loadEnv')();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

async function run() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';
  const role = (process.argv[4] || process.env.ADMIN_ROLE || 'superadmin').trim().toLowerCase();

  if (!email || !password) {
    console.error('Email and password are required.');
    console.error('Provide them as args or via ADMIN_EMAIL / ADMIN_PASSWORD env vars.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  if (role !== 'admin' && role !== 'superadmin') {
    console.error('Role must be admin or superadmin.');
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await Admin.hashPassword(password);
  const existing = await Admin.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = role;
    await existing.save();
    console.log(`Updated admin: ${email} (role: ${role})`);
  } else {
    await Admin.create({ email, passwordHash, role });
    console.log(`Created admin: ${email} (role: ${role})`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
