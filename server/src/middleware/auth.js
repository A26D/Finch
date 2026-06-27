import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";

export default function auth(req, res, next) {
  // 1. Try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.id, email: decoded.email };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  // 2. Fallback: user_id query param (backward compatibility)
  if (req.query.user_id) {
    req.user = { id: req.query.user_id };
    return next();
  }

  // 3. Fallback: user_id in request body
  if (req.body && req.body.user_id) {
    req.user = { id: req.body.user_id };
    return next();
  }

  return res.status(401).json({ error: "Authentication required" });
}
