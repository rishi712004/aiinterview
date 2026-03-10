/**
 * DAILY CHALLENGE ROUTE
 * GET /api/daily — returns today's challenge (deterministic by date)
 * POST /api/daily/complete — mark as completed
 */

import express from "express";
import { query } from "../config/db.js";
import { cacheGet, cacheSet } from "../config/redis.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── Deterministic daily question picker ───────────────────────────────────
// Uses date as seed so everyone gets same question each day
function getDailyQuestionId(totalQuestions) {
  const today = new Date();
  const seed  = today.getFullYear() * 10000 +
                (today.getMonth() + 1) * 100 +
                today.getDate();
  return (seed % totalQuestions) + 1;
}

// ── GET /api/daily ─────────────────────────────────────────────────────────
router.get("/", protect, async (req, res, next) => {
  try {
    const cacheKey = `daily:${new Date().toISOString().slice(0, 10)}`;
    const cached   = await cacheGet(cacheKey);

    let question;
    if (cached) {
      question = cached;
    } else {
      // Get total question count
      const { rows: countRows } = await query("SELECT COUNT(*) as total FROM questions");
      const total = parseInt(countRows[0].total);

      // Pick today's question deterministically
      const dailyId = getDailyQuestionId(total);

      const { rows } = await query(
        `SELECT id, title, slug, difficulty, topic, companies, tags,
                frequency, acceptance, description
         FROM questions
         ORDER BY id
         LIMIT 1 OFFSET $1`,
        [dailyId - 1]
      );

      if (rows.length === 0) return res.status(404).json({ error: "No question found." });
      question = rows[0];
      await cacheSet(cacheKey, question, 86400); // cache 24hrs
    }

    // Check if user already solved today's challenge
    const today = new Date().toISOString().slice(0, 10);
    const { rows: attempts } = await query(
      `SELECT id, status, ai_score, created_at
       FROM attempts
       WHERE user_id = $1
         AND question_id = $2
         AND DATE(created_at) = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id, question.id, today]
    );

    // Get how many users solved today
    const { rows: solvedCount } = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM attempts
       WHERE question_id = $1
         AND DATE(created_at) = $2
         AND status = 'solved'`,
      [question.id, today]
    );

    res.json({
      question,
      date:         today,
      already_attempted: attempts.length > 0,
      already_solved:    attempts[0]?.status === "solved",
      user_score:        attempts[0]?.ai_score || null,
      solved_today:      parseInt(solvedCount[0].count) || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
