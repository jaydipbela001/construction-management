// Vercel Serverless Function entry point.
// Exports the configured Express application as the request handler.
// MongoDB connections are created lazily (and cached) per invocation.
require('../src/config/loadEnv')();
const createApp = require('../src/app');

// eslint-disable-next-line no-console
console.log(`[boot] backend function cold-started at ${new Date().toISOString()}`);

const app = createApp();

module.exports = app;
