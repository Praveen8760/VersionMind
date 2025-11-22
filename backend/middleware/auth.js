
// backend/middleware/auth.js

export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  console.log("⛔ BLOCKED — User not authenticated for:", req.originalUrl);

  return res.status(401).json({
    success: false,
    message: "Not authenticated",
  });
}
