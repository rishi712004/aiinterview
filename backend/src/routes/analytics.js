/**
 * ANALYTICS ROUTES
 * GET /api/analytics/overview    — stats for dashboard (cached 5min)
 * GET /api/analytics/weaknesses  — weak topics + Groq study plan
 * GET /api/analytics/heatmap     — activity for last 180 days
 * GET /api/analytics/leaderboard — top users by problems solved
 */

import express from "express";
import { query } from "../config/db.js";
import { cacheGet, cacheSet } from "../config/redis.js";
import { getStudyPlan } from "../services/groq.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── GET /api/analytics/overview ──────────────────────────────────────────
router.get("/overview", protect, async (req, res, next) => {
  try {
    const cacheKey = `analytics:${req.user.id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Total solved + avg score
    const { rows: totals } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'solved')    as total_solved,
         COUNT(*)                                      as total_attempts,
         ROUND(AVG(ai_score), 0)                       as avg_score
       FROM attempts WHERE user_id = $1`,
      [req.user.id]
    );

    // Solved by difficulty
    const { rows: byDiff } = await query(
      `SELECT q.difficulty,
         COUNT(*) FILTER (WHERE a.status = 'solved') as solved,
         COUNT(*) as total
       FROM attempts a
       JOIN questions q ON q.id = a.question_id
       WHERE a.user_id = $1
       GROUP BY q.difficulty`,
      [req.user.id]
    );

    // Topic scores
    const { rows: topics } = await query(
      `SELECT topic,
         total, solved,
         ROUND(avg_score, 0) as avg_score,
         ROUND(solved::numeric / NULLIF(total, 0) * 100, 0) as accuracy
       FROM topic_scores
       WHERE user_id = $1
       ORDER BY accuracy ASC`,
      [req.user.id]
    );

    const result = {
      solved:      parseInt(totals[0].total_solved) || 0,
      attempts:    parseInt(totals[0].total_attempts) || 0,
      avg_score:   parseInt(totals[0].avg_score) || 0,
      streak:      req.user.streak || 0,
      by_difficulty: byDiff,
      topics,
    };

    await cacheSet(cacheKey, result, 300); // 5 min cache
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/analytics/weaknesses ────────────────────────────────────────
// Returns weak topics + AI-generated study plan from Groq
router.get("/weaknesses", protect, async (req, res, next) => {
  try {
    const cacheKey = `weaknesses:${req.user.id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Topics with below 60% accuracy
    const { rows: weak } = await query(
      `SELECT topic,
         total, solved,
         ROUND(solved::numeric / NULLIF(total, 0) * 100, 0) as accuracy
       FROM topic_scores
       WHERE user_id = $1
         AND total >= 3
         AND (solved::numeric / NULLIF(total, 0)) < 0.6
       ORDER BY accuracy ASC
       LIMIT 5`,
      [req.user.id]
    );

    let studyPlan = null;

    if (weak.length > 0) {
      try {
        studyPlan = await getStudyPlan({
          weakTopics:    weak,
          targetCompany: req.user.target_company,
          targetRole:    req.user.target_role,
        });
      } catch (aiErr) {
        console.error("Study plan AI error:", aiErr.message);
      }
    }

    const result = { weak_topics: weak, study_plan: studyPlan };
    await cacheSet(cacheKey, result, 600); // 10 min cache
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/analytics/heatmap ───────────────────────────────────────────
// Returns daily attempt counts for last 180 days (for calendar heatmap)
router.get("/heatmap", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as count
       FROM attempts
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '180 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [req.user.id]
    );

    res.json({ heatmap: rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/analytics/leaderboard ───────────────────────────────────────
router.get("/leaderboard", protect, async (req, res, next) => {
  try {
    const cacheKey = "leaderboard:global";
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(
      `SELECT
         u.name,
         u.target_company,
         COUNT(*) FILTER (WHERE a.status = 'solved') as solved,
         ROUND(AVG(a.ai_score), 0) as avg_score,
         u.streak
       FROM users u
       LEFT JOIN attempts a ON a.user_id = u.id
       GROUP BY u.id
       ORDER BY solved DESC
       LIMIT 20`
    );

    const result = { leaderboard: rows };
    await cacheSet(cacheKey, result, 300); // 5 min
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
// ── GET /api/analytics/streak ─────────────────────────────────────────────
import { getStreakStats } from "../services/streak.js";

router.get("/streak", protect, async (req, res, next) => {
  try {
    const stats = await getStreakStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});
