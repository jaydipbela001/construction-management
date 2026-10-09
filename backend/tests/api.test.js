/* eslint-disable no-console */
// Integration tests for the most important business rules and API behaviour.
//
// These tests DROP the database they connect to, so they only run when an
// explicit test database is provided:
//
//   TEST_MONGODB_URI="mongodb://127.0.0.1:27017/construction_test" npm test --prefix backend
//
// Without TEST_MONGODB_URI the suite is skipped, which keeps `npm test` safe
// to run anywhere.
if (process.env.TEST_MONGODB_URI) {
  process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const mongoose = require('mongoose');

const createApp = require('../src/app');
const connectDB = require('../src/config/db');
const Admin = require('../src/models/Admin');

const RUN = Boolean(process.env.TEST_MONGODB_URI);

let baseUrl;
let server;
let token;
let projectA;
let projectB;

async function api(method, path, { auth = true, body } = {}) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

test('Construction Management API', { skip: !RUN && 'Set TEST_MONGODB_URI to run' }, async (t) => {
  await connectDB();
  await mongoose.connection.dropDatabase();

  const passwordHash = await Admin.hashPassword('StrongPass123!');
  await Admin.create({ email: 'admin@test.com', passwordHash });

  const app = createApp();
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  t.after(async () => {
    await mongoose.connection.dropDatabase();
    server.close();
    await mongoose.connection.close();
  });

  await t.test('rejects unauthenticated access', async () => {
    const res = await api('GET', '/projects', { auth: false });
    assert.equal(res.status, 401);
  });

  await t.test('logs in and exposes a safe admin payload', async () => {
    const bad = await api('POST', '/auth/login', {
      auth: false,
      body: { email: 'admin@test.com', password: 'nope' },
    });
    assert.equal(bad.status, 401);

    const good = await api('POST', '/auth/login', {
      auth: false,
      body: { email: 'admin@test.com', password: 'StrongPass123!' },
    });
    assert.equal(good.status, 200);
    token = good.json.data.token;
    assert.ok(token);

    const me = await api('GET', '/auth/me');
    assert.equal(me.json.data.admin.email, 'admin@test.com');
    assert.equal(me.json.data.admin.passwordHash, undefined);
  });

  await t.test('lets an admin create another admin who can log in', async () => {
    const create = await api('POST', '/admins', {
      body: { name: 'Second Admin', email: 'second@test.com', password: 'SecondPass123!' },
    });
    assert.equal(create.status, 201);
    assert.equal(create.json.data.admin.email, 'second@test.com');
    assert.equal(create.json.data.admin.passwordHash, undefined);

    const duplicate = await api('POST', '/admins', {
      body: { email: 'second@test.com', password: 'SecondPass123!' },
    });
    assert.equal(duplicate.status, 409);

    const weak = await api('POST', '/admins', {
      body: { email: 'weak@test.com', password: 'short' },
    });
    assert.equal(weak.status, 400);

    // The new admin can sign in immediately with the chosen credentials.
    const login = await api('POST', '/auth/login', {
      auth: false,
      body: { email: 'second@test.com', password: 'SecondPass123!' },
    });
    assert.equal(login.status, 200);
    assert.ok(login.json.data.token);

    const list = await api('GET', '/admins');
    assert.equal(list.status, 200);
    assert.ok(list.json.data.items.some((admin) => admin.email === 'second@test.com'));
  });

  await t.test('rejects an invalid token', async () => {
    const saved = token;
    token = 'invalid.token.value';
    const res = await api('GET', '/projects');
    token = saved;
    assert.equal(res.status, 401);
  });

  await t.test('creates projects with unique codes and empty records', async () => {
    const a = await api('POST', '/projects', { body: { name: 'Project A' } });
    assert.equal(a.status, 201);
    assert.ok(a.json.data.project.projectCode);
    projectA = a.json.data.project;

    const b = await api('POST', '/projects', {
      body: { name: 'Project B', projectCode: 'PRJ-B-001' },
    });
    assert.equal(b.status, 201);
    projectB = b.json.data.project;

    const dup = await api('POST', '/projects', {
      body: { name: 'Duplicate', projectCode: 'PRJ-B-001' },
    });
    assert.equal(dup.status, 409);

    const detail = await api('GET', `/projects/${projectA._id}`);
    assert.equal(detail.json.data.totals.materialCount, 0);
    assert.equal(detail.json.data.totals.expenseCount, 0);
  });

  await t.test('rejects invalid project dates', async () => {
    const res = await api('POST', '/projects', {
      body: { name: 'Bad dates', startDate: '2026-05-01', expectedCompletionDate: '2026-01-01' },
    });
    assert.equal(res.status, 400);
  });

  let ironId;
  await t.test('adds a material to project A only', async () => {
    const res = await api('POST', `/projects/${projectA._id}/materials`, {
      body: {
        name: 'Iron',
        category: 'Metal',
        quantity: 500,
        usedQuantity: 100,
        unit: 'kg',
        unitPrice: 65,
      },
    });
    assert.equal(res.status, 201);
    ironId = res.json.data.material._id;
    assert.equal(res.json.data.material.currentStock, 400);

    const listA = await api('GET', `/projects/${projectA._id}/materials`);
    assert.equal(listA.json.data.items.length, 1);
    assert.equal(listA.json.data.items[0].lineTotal, 32500);
    assert.equal(listA.json.data.items[0].usedQuantity, 100);
    assert.equal(listA.json.data.items[0].currentStock, 400);
    assert.equal(listA.json.data.summary.estimatedMaterialValue, 32500);

    const listB = await api('GET', `/projects/${projectB._id}/materials`);
    assert.equal(listB.json.data.items.length, 0);
  });

  await t.test('rejects used quantity greater than total quantity', async () => {
    const res = await api('POST', `/projects/${projectA._id}/materials`, {
      body: { name: 'OverUsed', quantity: 10, usedQuantity: 25, unit: 'kg', unitPrice: 5 },
    });
    assert.equal(res.status, 400);

    const patch = await api('PATCH', `/projects/${projectA._id}/materials/${ironId}`, {
      body: { usedQuantity: 999 },
    });
    assert.equal(patch.status, 400);

    const ok = await api('PATCH', `/projects/${projectA._id}/materials/${ironId}`, {
      body: { usedQuantity: 500 },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.material.currentStock, 0);

    // Restore so later totals/tests stay predictable.
    await api('PATCH', `/projects/${projectA._id}/materials/${ironId}`, { body: { usedQuantity: 100 } });
  });

  await t.test('enforces project isolation for a material', async () => {
    const viaB = await api('GET', `/projects/${projectB._id}/materials/${ironId}`);
    assert.equal(viaB.status, 404);

    const patchViaB = await api('PATCH', `/projects/${projectB._id}/materials/${ironId}`, {
      body: { quantity: 1 },
    });
    assert.equal(patchViaB.status, 404);
  });

  await t.test('rejects invalid numeric material values', async () => {
    const negQty = await api('POST', `/projects/${projectA._id}/materials`, {
      body: { name: 'BadQty', quantity: -5, unit: 'kg', unitPrice: 10 },
    });
    assert.equal(negQty.status, 400);

    const negPrice = await api('POST', `/projects/${projectA._id}/materials`, {
      body: { name: 'BadPrice', quantity: 5, unit: 'kg', unitPrice: -1 },
    });
    assert.equal(negPrice.status, 400);
  });

  await t.test('allows the same material name with different values per project', async () => {
    const a = await api('POST', `/projects/${projectA._id}/materials`, {
      body: { name: 'Cement', quantity: 100, unit: 'bag', unitPrice: 380 },
    });
    const b = await api('POST', `/projects/${projectB._id}/materials`, {
      body: { name: 'Cement', quantity: 200, unit: 'bag', unitPrice: 390 },
    });
    assert.equal(a.json.data.material.name, b.json.data.material.name);
    assert.notEqual(a.json.data.material.unitPrice, b.json.data.material.unitPrice);
    assert.notEqual(a.json.data.material.projectId, b.json.data.material.projectId);
  });

  await t.test('keeps expenses associated with the correct project', async () => {
    const add = await api('POST', `/projects/${projectA._id}/expenses`, {
      body: { title: 'Labor', category: 'labor', amount: 45000 },
    });
    assert.equal(add.status, 201);

    const bExpenses = await api('GET', `/projects/${projectB._id}/expenses`);
    assert.equal(bExpenses.json.data.items.length, 0);

    const aDetail = await api('GET', `/projects/${projectA._id}`);
    assert.equal(aDetail.json.data.totals.expenseCount, 1);
    assert.equal(aDetail.json.data.totals.totalExpenses, 45000);
    assert.equal(aDetail.json.data.totals.estimatedMaterialValue, 32500 + 38000);
  });

  await t.test('aggregates dashboard statistics from the database', async () => {
    const res = await api('GET', '/dashboard/summary');
    assert.equal(res.status, 200);
    assert.equal(res.json.data.stats.totalProjects, 2);
    assert.equal(res.json.data.stats.totalMaterialEntries, 3);
    assert.equal(res.json.data.stats.totalRecordedExpenses, 45000);
  });

  await t.test('supports search and filters', async () => {
    const search = await api('GET', `/projects/${projectA._id}/materials?search=iron`);
    assert.equal(search.json.data.items.length, 1);

    const category = await api('GET', `/projects/${projectA._id}/materials?category=Metal`);
    assert.equal(category.json.data.items.length, 1);

    const projects = await api('GET', '/projects?search=Project');
    assert.equal(projects.json.data.items.length, 2);
  });

  await t.test('cascade-deletes only the deleted project records', async () => {
    const del = await api('DELETE', `/projects/${projectA._id}`);
    assert.equal(del.status, 200);

    const remaining = await api('GET', `/projects/${projectB._id}/materials`);
    assert.equal(remaining.json.data.items.length, 1);

    const summary = await api('GET', '/dashboard/summary');
    assert.equal(summary.json.data.stats.totalProjects, 1);
    assert.equal(summary.json.data.stats.totalMaterialEntries, 1);
  });

  await t.test('returns 404 for missing resources and unknown routes', async () => {
    const missing = await api('GET', '/projects/000000000000000000000000');
    assert.equal(missing.status, 404);

    const unknown = await api('GET', '/does-not-exist');
    assert.equal(unknown.status, 404);
  });
});
