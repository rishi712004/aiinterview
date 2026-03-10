import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { startCronJobs } from "./config/cron.js";
import interviewRoutes from "./routes/interview.js";

import authRoutes       from "./routes/auth.js";
import questionRoutes   from "./routes/questions.js";
import sessionRoutes    from "./routes/sessions.js";
import analyticsRoutes  from "./routes/analytics.js";
import resumeRoutes     from "./routes/resume.js";
import mockRoutes       from "./routes/mock.js";
import dailyRoutes      from "./routes/daily.js";
import discussionRoutes from "./routes/discussions.js";

import { errorHandler } from "./middleware/errorHandler.js";

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,   // 500 requests per 15 min (dev-friendly)
  message:  { error: "Too many requests. Please try again in 15 minutes." },
  skip:     (req) => req.path === "/health",
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,    // 30 AI calls per minute
  message:  { error: "Too many AI requests. Please wait a moment." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      50,    // 50 auth attempts per 15 min
  message:  { error: "Too many auth attempts." },
});

app.use("/api", generalLimiter);
app.use("/api/sessions/submit", aiLimiter);
app.use("/api/resume/analyze",  aiLimiter);
app.use("/api/auth/login",      authLimiter);
app.use("/api/auth/register",   authLimiter);
app.use("/api/interview", interviewRoutes);


// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "DSAforge API", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/questions",   questionRoutes);
app.use("/api/sessions",    sessionRoutes);
app.use("/api/analytics",   analyticsRoutes);
app.use("/api/resume",      resumeRoutes);
app.use("/api/mock",        mockRoutes);
app.use("/api/daily",       dailyRoutes);
app.use("/api/discussions", discussionRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
startCronJobs();
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       DSAforge Backend Running!          ║
  ╠══════════════════════════════════════════╣
  ║  URL    : http://localhost:${PORT}           ║
  ║  AI     : Groq (free)                    ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
