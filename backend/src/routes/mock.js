/**
 * MOCK INTERVIEW ROUTES
 * POST /api/mock/schedule      — book a session
 * GET  /api/mock/upcoming      — upcoming sessions
 * PUT  /api/mock/:id/cancel    — cancel a session
 * PUT  /api/mock/:id/complete  — mark complete + save score
 * GET  /api/mock/stats         — mock interview stats
 */

import express from "express";
import { query } from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const VALID_TYPES = ["dsa", "behavioral", "system_design", "hr"];

// ── POST /api/mock/schedule ───────────────────────────────────────────────
router.post("/schedule", protect, async (req, res, next) => {
  try {
    const { type = "dsa", scheduled_at, duration_min = 45 } = req.body;

    if (!scheduled_at) {
      return res.status(400).json({ error: "scheduled_at is required." });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
    }

    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: "scheduled_at must be in the future." });
    }

    const { rows } = await query(
      `INSERT INTO mock_sessions (user_id, type, scheduled_at, duration_min)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, type, scheduled_at, duration_min]
    );

    res.status(201).json({ session: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mock/upcoming ────────────────────────────────────────────────
router.get("/upcoming", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM mock_sessions
       WHERE user_id = $1
         AND status = 'scheduled'
         AND scheduled_at >= NOW()
       ORDER BY scheduled_at ASC`,
      [req.user.id]
    );

    res.json({ sessions: rows });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/mock/:id/cancel ──────────────────────────────────────────────
router.put("/:id/cancel", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE mock_sessions
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'scheduled'
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found or already cancelled." });
    }

    res.json({ session: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/mock/:id/complete ────────────────────────────────────────────
router.put("/:id/complete", protect, async (req, res, next) => {
  try {
    const { overall_score, feedback } = req.body;

    const { rows } = await query(
      `UPDATE mock_sessions
       SET status = 'completed', overall_score = $1, feedback = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [overall_score, JSON.stringify(feedback || {}), req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found." });
    }

    res.json({ session: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mock/stats ───────────────────────────────────────────────────
router.get("/stats", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         type,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         ROUND(AVG(overall_score) FILTER (WHERE status = 'completed'), 0) as avg_score
       FROM mock_sessions
       WHERE user_id = $1
       GROUP BY type`,
      [req.user.id]
    );

    res.json({ stats: rows });
  } catch (err) {
    next(err);
  }
});

export default router;