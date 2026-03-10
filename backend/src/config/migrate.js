/**
 * DATABASE MIGRATION
 * Run once with: npm run migrate
 * Creates all tables if they don't already exist (safe to re-run)
 */

import { query } from "./db.js";

async function migrate() {
  console.log("🔄 Running migrations...");

  // ── 1. USERS ─────────────────────────────────────────────
  // Stores account info + prep preferences
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            VARCHAR(100) NOT NULL,
      email           VARCHAR(150) UNIQUE NOT NULL,
      password        VARCHAR(255) NOT NULL,
      streak          INTEGER DEFAULT 0,
      last_active     DATE,
      target_role     VARCHAR(100) DEFAULT 'Full Stack Developer',
      target_company  VARCHAR(100),
      plan            VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free','pro')),
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("  ✅ users");

  // ── 2. QUESTIONS ──────────────────────────────────────────
  // DSA problem bank — seeded with sample data
  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(200) NOT NULL,
      slug        VARCHAR(200) UNIQUE NOT NULL,
      description TEXT,
      difficulty  VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard')),
      topic       VARCHAR(50),
      companies   TEXT[] DEFAULT '{}',
      tags        TEXT[] DEFAULT '{}',
      frequency   INTEGER DEFAULT 50,
      acceptance  INTEGER DEFAULT 50,
      hints       TEXT[] DEFAULT '{}',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("  ✅ questions");

  // ── 3. ATTEMPTS ───────────────────────────────────────────
  // Every time a user submits a solution
  await query(`
    CREATE TABLE IF NOT EXISTS attempts (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      status      VARCHAR(20) DEFAULT 'attempted' CHECK (status IN ('solved','attempted','failed')),
      language    VARCHAR(30) DEFAULT 'javascript',
      code        TEXT,
      time_taken  INTEGER,           -- seconds
      ai_score    INTEGER,           -- 0-100 from Groq
      ai_feedback JSONB,             -- {summary, tips[], strengths[]}
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("  ✅ attempts");

  // ── 4. TOPIC SCORES ───────────────────────────────────────
  // Running accuracy per topic — updated after each attempt
  await query(`
    CREATE TABLE IF NOT EXISTS topic_scores (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
      topic     VARCHAR(50) NOT NULL,
      total     INTEGER DEFAULT 0,    -- total attempts on this topic
      solved    INTEGER DEFAULT 0,    -- how many solved
      avg_score NUMERIC(5,2) DEFAULT 0,
      UNIQUE(user_id, topic)           -- one row per user per topic
    );
  `);
  console.log("  ✅ topic_scores");

  // ── 5. MOCK SESSIONS ──────────────────────────────────────
  // Scheduled mock interviews
  await query(`
    CREATE TABLE IF NOT EXISTS mock_sessions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
      type          VARCHAR(30) DEFAULT 'dsa',
      status        VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
      scheduled_at  TIMESTAMPTZ NOT NULL,
      duration_min  INTEGER DEFAULT 45,
      overall_score INTEGER,
      feedback      JSONB,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("  ✅ mock_sessions");

  // ── 6. RESUME ANALYSES ────────────────────────────────────
  // AI-analysed resumes
  await query(`
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
      filename      VARCHAR(255),
      ats_score     INTEGER,
      format_score  INTEGER,
      impact_score  INTEGER,
      keyword_score INTEGER,
      suggestions   JSONB,     -- [{type, title, description}]
      role_matches  JSONB,     -- [{role, match_pct}]
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("  ✅ resume_analyses");

  // ── INDEXES for fast lookups ───────────────────────────────
  await query(`CREATE INDEX IF NOT EXISTS idx_attempts_user    ON attempts(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_attempts_date    ON attempts(created_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_topic_scores_user ON topic_scores(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_mock_user        ON mock_sessions(user_id);`);
  console.log("  ✅ indexes");

  // ── Auto-update streak trigger ─────────────────────────────
  await query(`
    CREATE OR REPLACE FUNCTION update_streak()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE users
      SET
        streak = CASE
          WHEN last_active = CURRENT_DATE - INTERVAL '1 day' THEN streak + 1
          WHEN last_active = CURRENT_DATE THEN streak
          ELSE 1
        END,
        last_active = CURRENT_DATE
      WHERE id = NEW.user_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await query(`DROP TRIGGER IF EXISTS on_attempt ON attempts;`);
  await query(`
    CREATE TRIGGER on_attempt
    AFTER INSERT ON attempts
    FOR EACH ROW EXECUTE FUNCTION update_streak();
  `);
  console.log("  ✅ streak trigger");

  console.log("\n🎉 All migrations complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});