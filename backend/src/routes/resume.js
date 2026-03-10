/**
 * RESUME ROUTES
 * POST /api/resume/analyze  — upload PDF → extract text → Groq analysis
 * GET  /api/resume/history  — past analyses
 */

import express from "express";
import multer from "multer";
import { query } from "../config/db.js";
import { analyzeResume } from "../services/groq.js";
import { protect } from "../middleware/auth.js";

// ── Multer setup — stores file in memory (no disk needed) ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted."), false);
    }
  },
});

const router = express.Router();

// ── POST /api/resume/analyze ──────────────────────────────────────────────
router.post("/analyze", protect, upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a PDF file." });
    }

    // Extract text from PDF using pdf-parse
    // Dynamic import because pdf-parse uses CommonJS
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract text from PDF. Please try a different file." });
    }

    // Send to Groq for analysis (free!)
    let analysis;
    try {
      analysis = await analyzeResume({
        resumeText,
        targetRole:    req.user.target_role,
        targetCompany: req.user.target_company,
      });
    } catch (aiErr) {
      console.error("Resume AI error:", aiErr.message);
      return res.status(502).json({ error: "AI analysis failed. Please try again." });
    }

    // Save analysis to DB
    const { rows } = await query(
      `INSERT INTO resume_analyses
         (user_id, filename, ats_score, format_score, impact_score, keyword_score, suggestions, role_matches)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        req.file.originalname,
        analysis.ats_score,
        analysis.format_score,
        analysis.impact_score,
        analysis.keyword_score,
        JSON.stringify(analysis.suggestions || []),
        JSON.stringify(analysis.role_matches || []),
      ]
    );

    res.status(201).json({
      analysis: rows[0],
      verdict:         analysis.overall_verdict,
      missing_keywords: analysis.missing_keywords || [],
      top_strengths:   analysis.top_strengths || [],
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/resume/history ───────────────────────────────────────────────
router.get("/history", protect, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, filename, ats_score, format_score, impact_score, keyword_score, created_at
       FROM resume_analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({ analyses: rows });
  } catch (err) {
    next(err);
  }
});

export default router;