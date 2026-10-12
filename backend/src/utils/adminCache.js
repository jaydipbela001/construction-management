/**
 * Tiny in-memory cache for authenticated admin documents.
 *
 * Why: `protect` runs on every protected request and performs an
 * `Admin.findById` round trip to MongoDB. On Vercel, each round trip to Atlas
 * adds real latency, so we cache the loaded admin for a short TTL per warm
 * serverless instance.
 *
 * Staleness: entries expire after TTL_MS and are explicitly invalidated when an
 * admin is deleted (see adminController.deleteAdmin).
 */

const TTL_MS = 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map();

function get(id) {
  if (!id) return null;
  const key = String(id);
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.admin;
}

function set(admin) {
  if (!admin || !admin._id) return;
  const key = String(admin._id);
  cache.set(key, { admin, expiresAt: Date.now() + TTL_MS });
  if (cache.size > MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function invalidate(id) {
  if (!id) return;
  cache.delete(String(id));
}

function clear() {
  cache.clear();
}

module.exports = { get, set, invalidate, clear, TTL_MS };
