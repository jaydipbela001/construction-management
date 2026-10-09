/* eslint-disable no-console */
// Secure initial admin creation / password reset.
// Usage:
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='strong-password' node src/scripts/createAdmin.js
// or:
//   node src/scripts/createAdmin.js admin@example.com 'strong-password'
require('../config/loadEnv')();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

async function run() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Email and password are required.');
    console.error('Provide them as args or via ADMIN_EMAIL / ADMIN_PASSWORD env vars.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await Admin.hashPassword(password);
  const existing = await Admin.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated password for existing admin: ${email}`);
  } else {
    await Admin.create({ email, passwordHash });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
