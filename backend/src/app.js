const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { protect } = require('./middleware/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

/**
 * Build and return the Express application.
 *
 * Middleware order matters:
 *   1. security headers + CORS + body parsing
 *   2. /api/health          (no database needed)
 *   3. /api database guard  (ensures a cached connection before API routes)
 *   4. routes               (public auth, then protected resources)
 *   5. 404 handler
 *   6. central error handler
 */
function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());

  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin/serverless requests have no Origin header.
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Optional per-request timing. Set DEBUG_TIMING=true in Vercel env vars to
  // see exactly how long each request spends before responding.
  if (process.env.DEBUG_TIMING === 'true') {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on('finish', () => {
        // eslint-disable-next-line no-console
        console.log(
          `[timing] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - startedAt}ms (instance uptime ${process.uptime().toFixed(2)}s)`
        );
      });
      next();
    });
  }

  // Liveness check. Intentionally does not touch the database.
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
  });

  // Ensure a (cached) MongoDB connection exists before any data route runs.
  app.use('/api', async (_req, _res, next) => {
    try {
      await connectDB();
      return next();
    } catch (error) {
      return next(error);
    }
  });

  // Public
  app.use('/api/auth', authRoutes);

  // Protected (all routes below require a valid JWT)
  app.use('/api/dashboard', protect, dashboardRoutes);
  app.use('/api/projects', protect, projectRoutes);
  app.use('/api/admins', protect, adminRoutes);

  // Unknown route -> 404, then the central error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
