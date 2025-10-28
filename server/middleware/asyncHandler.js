// Simple async handler to wrap async route handlers and forward errors
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
