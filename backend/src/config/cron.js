/**
 * CRON JOBS
 * Runs scheduled tasks: streak resets, cache warming etc.
 */

import cron from "node-cron";
import { resetMissedStreaks } from "../services/streak.js";
import { query } from "./db.js";

export function startCronJobs() {

  // ── 1. Reset missed streaks — runs every day at midnight ──────────────
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [CRON] Running midnight streak reset...");
    const count = await resetMissedStreaks();
    console.log(`⏰ [CRON] Streak reset complete — ${count} users affected`);
  }, {
    timezone: "Asia/Kolkata" // IST timezone — change if needed
  });

  // ── 2. Warm leaderboard cache — runs every 10 minutes ─────────────────
  cron.schedule("*/10 * * * *", async () => {
    try {
      await query(`
        SELECT u.name, u.target_company,
          COUNT(*) FILTER (WHERE a.status = 'solved') as solved,
          ROUND(AVG(a.ai_score), 0) as avg_score,
          u.streak
        FROM users u
        LEFT JOIN attempts a ON a.user_id = u.id
        GROUP BY u.id
        ORDER BY solved DESC
        LIMIT 20
      `);
      console.log("⏰ [CRON] Leaderboard cache warmed");
    } catch (err) {
      console.error("⏰ [CRON] Cache warm error:", err.message);
    }
  });

  // ── 3. Daily stats log — runs every day at 6am ────────────────────────
  cron.schedule("0 6 * * *", async () => {
    try {
      const { rows } = await query(`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_attempts,
          COUNT(*) FILTER (WHERE status = 'solved') as solved,
          ROUND(AVG(ai_score), 0) as avg_score
        FROM attempts
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);
      console.log("📊 [CRON] Daily stats:", rows[0]);
    } catch (err) {
      console.error("📊 [CRON] Daily stats error:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata"
  });

  console.log("⏰ Cron jobs started (streak reset @ midnight IST)");
}
