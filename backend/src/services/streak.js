/**
 * STREAK SERVICE
 * - updateStreak()  — call after every submission
 * - resetStreaks()  — cron job runs at midnight daily
 */

import { query } from "../config/db.js";

// ── Called after every code submission ───────────────────────────────────
// Logic:
//   - If user already submitted today → streak unchanged
//   - If last submission was yesterday → streak + 1
//   - If last submission was 2+ days ago → streak resets to 1
export async function updateStreak(userId) {
  try {
    const { rows } = await query(
      `SELECT 
         streak,
         last_active,
         DATE(NOW()) as today,
         DATE(last_active) as last_day
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) return;

    const { streak, last_active } = rows[0];
    const today     = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = last_active ? new Date(last_active) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let newStreak = streak || 0;

    if (!lastActive) {
      // First ever submission
      newStreak = 1;
    } else if (lastActive.getTime() === today.getTime()) {
      // Already submitted today — don't change streak
      return;
    } else if (lastActive.getTime() === yesterday.getTime()) {
      // Submitted yesterday — extend streak
      newStreak = (streak || 0) + 1;
    } else {
      // Gap of 2+ days — reset streak
      newStreak = 1;
    }

    await query(
      `UPDATE users SET streak = $1, last_active = NOW() WHERE id = $2`,
      [newStreak, userId]
    );

    console.log(`🔥 Streak updated for user ${userId}: ${streak} → ${newStreak}`);
    return newStreak;
  } catch (err) {
    console.error("Streak update error:", err.message);
  }
}

// ── Called by cron job at midnight ───────────────────────────────────────
// Reset streak to 0 for users who didn't submit today or yesterday
export async function resetMissedStreaks() {
  try {
    const { rowCount } = await query(
      `UPDATE users
       SET streak = 0
       WHERE streak > 0
         AND (
           last_active IS NULL
           OR DATE(last_active) < DATE(NOW() - INTERVAL '1 day')
         )`
    );

    console.log(`⏰ Streak reset: ${rowCount} users missed their streak`);
    return rowCount;
  } catch (err) {
    console.error("Streak reset error:", err.message);
  }
}

// ── Get streak stats for a user ──────────────────────────────────────────
export async function getStreakStats(userId) {
  try {
    const { rows } = await query(
      `SELECT 
         u.streak,
         u.last_active,
         COUNT(DISTINCT DATE(a.created_at)) as total_active_days,
         MAX(DATE(a.created_at)) as last_submission
       FROM users u
       LEFT JOIN attempts a ON a.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (rows.length === 0) return null;

    const user = rows[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.last_active ? new Date(user.last_active) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    const submittedToday = lastActive?.getTime() === today.getTime();

    return {
      current_streak:    user.streak || 0,
      total_active_days: parseInt(user.total_active_days) || 0,
      last_submission:   user.last_submission,
      submitted_today:   submittedToday,
      at_risk:           !submittedToday && user.streak > 0,
    };
  } catch (err) {
    console.error("Streak stats error:", err.message);
    return null;
  }
}
