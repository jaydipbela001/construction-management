// Vercel Serverless Function entry point.
// Exports the configured Express application as the request handler.
// MongoDB connections are created lazily (and cached) per invocation.
require('../src/config/loadEnv')();
const createApp = require('../src/app');

const app = createApp();

module.exports = app;
