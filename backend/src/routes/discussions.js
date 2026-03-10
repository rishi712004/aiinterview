/**
 * DISCUSSIONS ROUTES
 * GET    /api/discussions/:questionId       — get all comments
 * POST   /api/discussions/:questionId       — post a comment
 * POST   /api/discussions/:id/like          — like a comment
 * DELETE /api/discussions/:id               — delete own comment
 */

import express from "express";
import { query } from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── GET /api/discussions/:questionId ──────────────────────────────────────
router.get("/:questionId", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT 
         d.id, d.content, d.likes, d.parent_id,
         d.created_at, d.updated_at,
         u.name as author_name,
         u.id   as author_id,
         COUNT(r.id) as reply_count
       FROM discussions d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN discussions r ON r.parent_id = d.id
       WHERE d.question_id = $1
         AND d.parent_id IS NULL
       GROUP BY d.id, u.name, u.id
       ORDER BY d.likes DESC, d.created_at DESC`,
      [req.params.questionId]
    );

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      rows.map(async (comment) => {
        const { rows: replies } = await query(
          `SELECT d.id, d.content, d.likes, d.parent_id,
                  d.created_at, u.name as author_name, u.id as author_id
           FROM discussions d
           JOIN users u ON u.id = d.user_id
           WHERE d.parent_id = $1
           ORDER BY d.created_at ASC`,
          [comment.id]
        );
        return { ...comment, replies };
      })
    );

    res.json({ comments: commentsWithReplies, total: rows.length });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/discussions/:questionId ─────────────────────────────────────
router.post("/:questionId", protect, async (req, res, next) => {
  try {
    const { content, parent_id } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty." });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: "Comment too long (max 2000 chars)." });
    }

    // Verify question exists
    const { rows: qRows } = await query(
      "SELECT id FROM questions WHERE id = $1",
      [req.params.questionId]
    );
    if (qRows.length === 0) {
      return res.status(404).json({ error: "Question not found." });
    }

    const { rows } = await query(
      `INSERT INTO discussions (question_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, likes, parent_id, created_at`,
      [req.params.questionId, req.user.id, content.trim(), parent_id || null]
    );

    res.status(201).json({
      comment: {
        ...rows[0],
        author_name: req.user.name,
        author_id:   req.user.id,
        replies:     [],
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/discussions/:id/like ────────────────────────────────────────
router.post("/:id/like", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE discussions SET likes = likes + 1
       WHERE id = $1
       RETURNING id, likes`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }
    res.json({ likes: rows[0].likes });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/discussions/:id ───────────────────────────────────────────
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT user_id FROM discussions WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Comment not found." });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Cannot delete another user's comment." });
    }
    await query("DELETE FROM discussions WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
