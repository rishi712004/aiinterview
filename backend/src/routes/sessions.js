import express from "express";
import { query, withTransaction } from "../config/db.js";
import { cacheDel } from "../config/redis.js";
import { executeCode, getCodeFeedback } from "../services/groq.js";
import { protect } from "../middleware/auth.js";
import { updateStreak } from "../services/streak.js";

const router = express.Router();

router.post("/submit", protect, async (req, res, next) => {
  try {
    const { question_id, code, language = "javascript", time_taken } = req.body;

    if (!question_id || !code) {
      return res.status(400).json({ error: "question_id and code are required." });
    }

    const { rows: qRows } = await query(
      "SELECT id, title, topic, difficulty FROM questions WHERE id::text = $1 OR slug = $1",
      [String(question_id)]
    );

    if (qRows.length === 0) {
      return res.status(404).json({ error: "Question not found." });
    }

    const question = qRows[0];

    // Step 1 — Execute code
    let executionResult = null;
    try {
      executionResult = await executeCode({
        code, language,
        question: question.title,
        topic: question.topic,
      });
    } catch (execErr) {
      console.error("Execution error:", execErr.message);
    }

    // Step 2 — AI feedback
    let aiFeedback;
    try {
      aiFeedback = await getCodeFeedback({
        question: question.title,
        code, language,
        topic: question.topic,
        executionResult,
      });
    } catch (aiErr) {
      console.error("Groq feedback error:", aiErr.message);
      aiFeedback = {
        score: executionResult?.tests_passed > 0 ? 60 : 30,
        status: "attempted",
        summary: "AI feedback unavailable.",
        strengths: [], improvements: [],
      };
    }

    let score = aiFeedback.score || 0;
    if (executionResult?.tests_passed === 3) score = Math.max(score, 85);
    if (executionResult?.has_error)          score = Math.min(score, 40);

    const status = score >= 70 ? "solved" : score >= 40 ? "attempted" : "failed";

    // Step 3 — Save to DB
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO attempts (user_id, question_id, status, language, code, time_taken, ai_score, ai_feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [req.user.id, question.id, status, language, code,
         time_taken, score, JSON.stringify({ ...aiFeedback, execution: executionResult })]
      );

      await client.query(
        `INSERT INTO topic_scores (user_id, topic, total, solved, avg_score)
         VALUES ($1, $2, 1, $3, $4)
         ON CONFLICT (user_id, topic) DO UPDATE SET
           total     = topic_scores.total + 1,
           solved    = topic_scores.solved + $3,
           avg_score = (topic_scores.avg_score * topic_scores.total + $4) / (topic_scores.total + 1)`,
        [req.user.id, question.topic, status === "solved" ? 1 : 0, score]
      );
    });

    // Step 4 — Update streak 🔥
    const newStreak = await updateStreak(req.user.id);

    // Step 5 — Invalidate caches
    await cacheDel(`analytics:${req.user.id}`);
    await cacheDel(`weaknesses:${req.user.id}`);

    res.status(201).json({
      status, score,
      feedback: aiFeedback,
      execution: executionResult,
      question: question.title,
      streak: newStreak,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/history", protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT a.id, a.status, a.language, a.ai_score, a.time_taken, a.created_at,
              q.title, q.topic, q.difficulty, q.slug
       FROM attempts a
       JOIN questions q ON q.id = a.question_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({ attempts: rows, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

export default router;

// ── GET /api/sessions/attempt/:id ─────────────────────────────────────────
router.get("/attempt/:id", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.id, a.code, a.language, a.status, a.ai_score,
              a.ai_feedback, a.time_taken, a.created_at,
              q.title, q.topic, q.difficulty, q.slug
       FROM attempts a
       JOIN questions q ON q.id = a.question_id
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Attempt not found." });
    }

    const attempt = rows[0];
    res.json({
      ...attempt,
      ai_feedback: typeof attempt.ai_feedback === "string"
        ? JSON.parse(attempt.ai_feedback)
        : attempt.ai_feedback,
    });
  } catch (err) {
    next(err);
  }
});
