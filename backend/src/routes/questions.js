/**
 * QUESTIONS ROUTES
 * GET /api/questions              — list with filters + Redis cache
 * GET /api/questions/:slug        — single question detail
 * GET /api/questions/company/:name — company-specific pattern
 */

import express from "express";
import { query } from "../config/db.js";
import { cacheGet, cacheSet } from "../config/redis.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── GET /api/questions ────────────────────────────────────────────────────
// Supports: ?topic=Arrays&difficulty=medium&company=Google&search=two sum
router.get("/", protect, async (req, res, next) => {
  try {
    const { topic, difficulty, company, search } = req.query;

    // Build cache key from query params
    const cacheKey = `questions:${topic||""}:${difficulty||""}:${company||""}:${search||""}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ questions: cached, fromCache: true });

    // Build dynamic SQL
    const conditions = [];
    const params = [];
    let p = 1;

    if (topic)      { conditions.push(`topic = $${p++}`);                 params.push(topic); }
    if (difficulty) { conditions.push(`difficulty = $${p++}`);            params.push(difficulty); }
    if (company)    { conditions.push(`$${p++} = ANY(companies)`);        params.push(company); }
    if (search)     { conditions.push(`title ILIKE $${p++}`);             params.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT id, title, slug, difficulty, topic, companies, tags, frequency, acceptance
       FROM questions
       ${where}
       ORDER BY frequency DESC
       LIMIT 500`,
      params
    );

    // Cache for 1 hour — questions don't change often
    await cacheSet(cacheKey, rows, 3600);

    res.json({ questions: rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questions/company/:name ─────────────────────────────────────
// Returns topic frequency breakdown for a company (for the pattern chart)
router.get("/company/:name", protect, async (req, res, next) => {
  try {
    const { name } = req.params;
    const cacheKey = `company_pattern:${name}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(
      `SELECT topic, COUNT(*) as count,
              ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 0) as pct
       FROM questions
       WHERE $1 = ANY(companies)
       GROUP BY topic
       ORDER BY count DESC`,
      [name]
    );

    const result = { company: name, pattern: rows };

    // Cache 24 hours — company patterns are very stable
    await cacheSet(cacheKey, result, 86400);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questions/:slug ─────────────────────────────────────────────
router.get("/:slug", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM questions WHERE slug = $1",
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Question not found." });
    }

    res.json({ question: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;