/**
 * AUTH ROUTES
 * POST /api/auth/register  — create account
 * POST /api/auth/login     — get JWT token
 * GET  /api/auth/me        — get logged-in user profile
 * PUT  /api/auth/profile   — update target role/company
 */

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── Helper: generate JWT ──────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, target_role, target_company } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Hash password — bcrypt with 12 rounds
    const hashed = await bcrypt.hash(password, 12);

    // Insert user
    const { rows } = await query(
      `INSERT INTO users (name, email, password, target_role, target_company)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, streak, target_role, target_company, plan`,
      [name, email.toLowerCase(), hashed, target_role || "Full Stack Developer", target_company || null]
    );

    const user = rows[0];
    const token = signToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Find user
    const { rows } = await query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user.id);

    // Don't send password back
    delete user.password;

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────
router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, target_role, target_company } = req.body;

    const { rows } = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        target_role = COALESCE($2, target_role),
        target_company = COALESCE($3, target_company)
       WHERE id = $4
       RETURNING id, name, email, streak, target_role, target_company, plan`,
      [name, target_role, target_company, req.user.id]
    );

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;