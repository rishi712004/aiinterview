import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

// ─── protect ──────────────────────────────────────────────────────────────
// Attach this to any route that requires login
// Usage: router.get("/me", protect, handler)
export const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided. Please log in." });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check user still exists in DB
    const { rows } = await query(
      "SELECT id, name, email, streak, target_role, target_company, plan FROM users WHERE id = $1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    // 4. Attach user to request object
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    next(err);
  }
};

// ─── requirePro ───────────────────────────────────────────────────────────
// Use after protect to lock features to Pro users only
export const requirePro = (req, res, next) => {
  if (req.user.plan !== "pro") {
    return res.status(403).json({
      error: "This feature requires a Pro plan.",
      upgrade: true,
    });
  }
  next();
};