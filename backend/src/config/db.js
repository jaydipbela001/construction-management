const mongoose = require('mongoose');

/**
 * MongoDB connection with caching.
 *
 * Why cache? Vercel serverless functions can be invoked many times, but each
 * warm instance only needs one connection. We store the connection (and the
 * in-flight promise) on a global so hot reloads and concurrent requests reuse
 * the same one instead of opening a new pool every time.
 */

let cached = global.__mongooseCache;
if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

/**
 * Connect to MongoDB (or return the cached connection).
 * Reads MONGODB_URI at call time so environment variables can be loaded just
 * before connecting.
 *
 * @returns {Promise<import('mongoose').Mongoose>}
 */
async function connectDB() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'MONGODB_URI is not defined. Set it in your environment (Vercel project settings or local .env).'
      );
    }

    if (!cached.promise) {
      const options = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      };

      cached.promise = mongoose
        .connect(uri, options)
        .then((mongooseInstance) => mongooseInstance)
        .catch((error) => {
          // Allow the next request to retry a failed connection.
          cached.promise = null;
          throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

module.exports = connectDB;
