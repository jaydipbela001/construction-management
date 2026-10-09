/**
 * Optional helper that wraps an async route handler and forwards rejected
 * promises to the error middleware:
 *
 *   const getThing = asyncHandler(async (req, res) => { ... });
 *
 * This project deliberately uses explicit `try { ... } catch (error) {
 * next(error); }` inside controllers instead, because it makes the control
 * flow obvious to anyone reading the code. asyncHandler is kept as a utility
 * for anyone who prefers the shorter style.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
