/**
 * LIVE AI INTERVIEW ROUTES
 * POST /api/interview/start     — start interview, get first question
 * POST /api/interview/answer    — submit answer, get feedback + next question
 * POST /api/interview/finish    — finish interview, get final report
 */

import express from "express";
import { query } from "../config/db.js";
import { protect } from "../middleware/auth.js";
import Groq from "groq-sdk";

const router  = express.Router();
const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TYPE_CONFIG = {
  dsa: {
    label: "DSA Coding Interview",
    systemPrompt: `You are a senior software engineer at a FAANG company conducting a DSA coding interview. 
Ask algorithmic questions (arrays, trees, graphs, DP etc). After each answer, give brief feedback on correctness, time/space complexity, and edge cases. Be encouraging but honest.`,
    questionCount: 3,
  },
  behavioral: {
    label: "Behavioral Interview",
    systemPrompt: `You are an engineering manager at a top tech company conducting a behavioral interview.
Ask STAR-method questions about past experiences, teamwork, conflicts, leadership. After each answer, evaluate structure, specificity, and impact. Be professional and warm.`,
    questionCount: 4,
  },
  system_design: {
    label: "System Design Interview",
    systemPrompt: `You are a staff engineer conducting a system design interview.
Ask questions about designing scalable systems (URL shortener, Twitter feed, etc). Evaluate scalability thinking, trade-offs, and clarity. Guide with follow-up questions.`,
    questionCount: 3,
  },
  hr: {
    label: "HR Round",
    systemPrompt: `You are an HR manager at a top tech company conducting a final HR round.
Ask about salary expectations, career goals, company fit, notice period. Be friendly and professional. Evaluate communication and professionalism.`,
    questionCount: 4,
  },
};

// ── POST /api/interview/start ─────────────────────────────────────────────
router.post("/start", protect, async (req, res, next) => {
  try {
    const { type = "dsa", target_company = "Google", target_role = "Software Engineer" } = req.body;
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.dsa;

    const systemPrompt = `${config.systemPrompt}
    
You are interviewing a candidate for ${target_role} at ${target_company}.
Total questions: ${config.questionCount}. 
IMPORTANT: Respond in JSON format only:
{
  "question": "your question here",
  "question_number": 1,
  "total_questions": ${config.questionCount},
  "tip": "optional short tip for the candidate (1 sentence)"
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: "Start the interview. Ask the first question." },
      ],
      temperature: 0.7,
      max_tokens:  500,
    });

    const raw  = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { parsed = { question: clean, question_number: 1, total_questions: config.questionCount }; }

    // Save session to DB
    const { rows } = await query(
      `INSERT INTO mock_sessions (user_id, type, scheduled_at, duration_min, status)
       VALUES ($1, $2, NOW(), 45, 'scheduled')
       RETURNING id`,
      [req.user.id, type]
    );

    res.json({
      session_id:      rows[0].id,
      type,
      config_label:    config.label,
      question_number: parsed.question_number || 1,
      total_questions: parsed.total_questions || config.questionCount,
      question:        parsed.question,
      tip:             parsed.tip || null,
      history:         [
        { role: "system",    content: systemPrompt },
        { role: "assistant", content: raw },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/interview/answer ────────────────────────────────────────────
router.post("/answer", protect, async (req, res, next) => {
  try {
    const { session_id, answer, history, question_number, total_questions, type } = req.body;

    if (!answer?.trim()) {
      return res.status(400).json({ error: "Answer cannot be empty." });
    }

    const config     = TYPE_CONFIG[type] || TYPE_CONFIG.dsa;
    const isLastQ    = question_number >= total_questions;
    const nextQNum   = question_number + 1;

    const instruction = isLastQ
      ? `The candidate answered the final question (${question_number}/${total_questions}). 
         Give feedback on this answer, then say the interview is complete and wish them well.
         Respond in JSON: { "feedback": "...", "score": 0-100, "is_complete": true, "next_question": null, "tip": null }`
      : `The candidate answered question ${question_number}/${total_questions}.
         Give brief feedback (2-3 sentences), then ask question ${nextQNum}.
         Respond in JSON: { "feedback": "...", "score": 0-100, "is_complete": false, "next_question": "...", "question_number": ${nextQNum}, "tip": "..." }`;

    const messages = [
      ...history,
      { role: "user",   content: answer },
      { role: "user",   content: instruction },
    ];

    const response = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens:  600,
    });

    const raw   = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(clean); }
    catch {
      parsed = {
        feedback:      raw,
        score:         70,
        is_complete:   isLastQ,
        next_question: isLastQ ? null : "Tell me about your approach to problem solving.",
      };
    }

    // Update history
    const newHistory = [
      ...history,
      { role: "user",      content: answer },
      { role: "assistant", content: raw    },
    ];

    res.json({
      feedback:        parsed.feedback,
      score:           parsed.score || 70,
      is_complete:     parsed.is_complete || isLastQ,
      next_question:   parsed.next_question || null,
      question_number: parsed.question_number || nextQNum,
      total_questions,
      tip:             parsed.tip || null,
      history:         newHistory,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/interview/finish ────────────────────────────────────────────
router.post("/finish", protect, async (req, res, next) => {
  try {
    const { session_id, scores, type, history } = req.body;

    const avgScore = scores?.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 70;

    // Get final report from AI
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        ...history,
        { role: "user", content: `Generate a final interview report. Include:
          - Overall performance summary (2-3 sentences)
          - 3 key strengths shown
          - 3 areas to improve
          - Hiring recommendation: Strong Yes / Yes / Maybe / No
          Respond in JSON: { "summary": "...", "strengths": [...], "improvements": [...], "recommendation": "...", "recommendation_reason": "..." }` },
      ],
      temperature: 0.5,
      max_tokens:  700,
    });

    const raw   = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    let report;
    try { report = JSON.parse(clean); }
    catch { report = { summary: raw, strengths: [], improvements: [], recommendation: "Yes" }; }

    // Save to DB
    if (session_id) {
      await query(
        `UPDATE mock_sessions 
         SET status = 'completed', overall_score = $1, feedback = $2
         WHERE id = $3 AND user_id = $4`,
        [avgScore, JSON.stringify(report), session_id, req.user.id]
      );
    }

    res.json({ overall_score: avgScore, report });
  } catch (err) {
    next(err);
  }
});

export default router;
