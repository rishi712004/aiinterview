import { useState, useEffect } from "react";
import ProgressRing from "../../components/charts/ProgressRing";
import MiniBars from "../../components/charts/MiniBars";
import ActivityHeatmap from "../../components/dashboard/ActivityHeatmap";
import { getOverview, getWeaknesses, getHeatmap } from "../../services/api";

export default function DashboardPage({ user }) {
  const [animBars, setAnimBars] = useState(false);
  const [overview, setOverview] = useState(null);
  const [weaknesses, setWeaknesses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, wkRes] = await Promise.all([
          getOverview(),
          getWeaknesses(),
        ]);
        setOverview(ovRes.data);
        setWeaknesses(wkRes.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setAnimBars(true), 400);
      }
    };
    load();
  }, []);

  // ── Derive values from real data (fallback to 0 if no attempts yet) ──
  const solved    = overview?.solved    || 0;
  const avgScore  = overview?.avg_score || 0;
  const streak    = user?.streak        || 0;
  const topics    = overview?.topics    || [];

  // Weak topics = accuracy below 60%
  const weakTopics = weaknesses?.weak_topics || [];
  const studyPlan  = weaknesses?.study_plan  || null;

  // Build topic bars from real data
  const topicBars = topics.map((t) => ({
    name:   t.topic,
    pct:    parseInt(t.accuracy) || 0,
    color:  parseInt(t.accuracy) >= 70
              ? "var(--lime)"
              : parseInt(t.accuracy) >= 50
              ? "var(--amber)"
              : "var(--pink)",
    status: parseInt(t.accuracy) >= 70 ? "✓"
          : parseInt(t.accuracy) >= 50 ? "~" : "✗",
  }));

  // Overall readiness = avg of all topic accuracies
  const overallPct = topicBars.length
    ? Math.round(topicBars.reduce((s, t) => s + t.pct, 0) / topicBars.length)
    : 0;

  if (loading) {
    return (
      <div className="page fade-up" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: 400, color: "var(--muted)",
        fontFamily: "'JetBrains Mono',monospace", fontSize: ".85rem"
      }}>
        // loading your stats...
      </div>
    );
  }

  return (
    <div className="page fade-up">

      {/* STATS */}
      <div className="stat-grid">
        {[
          {
            label: "Problems Solved", val: solved,
            sub: solved > 0 ? "↑ Keep going!" : "// start solving!",
            color: "lime", accent: "🎯"
          },
          {
            label: "Accuracy Rate", val: `${avgScore}%`,
            sub: avgScore >= 70 ? "↑ Great accuracy!" : avgScore > 0 ? "~ Room to improve" : "// no attempts yet",
            color: "blue", accent: "📈"
          },
          {
            label: "Day Streak", val: streak,
            sub: streak > 0 ? "🔥 Keep it up!" : "// solve today!",
            color: "amber", accent: "⚡"
          },
          {
            label: "Weak Topics", val: weakTopics.length,
            sub: weakTopics.length > 0
              ? `↓ ${weakTopics.slice(0,2).map(t => t.topic).join(", ")}`
              : "✓ Looking strong!",
            color: "pink", accent: "⚠️"
          },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-accent">{s.accent}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div className={`stat-sub ${
              s.sub.includes("↑") || s.sub.includes("🔥") ? "up"
              : s.sub.includes("↓") ? "down" : ""
            }`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ROW 1 */}
      <div className="g21">

        {/* TOPIC BARS */}
        <div className="card card-p">
          <div className="card-title">
            📊 Topic Performance — AI-Identified Weak Areas
          </div>

          {topicBars.length === 0 ? (
            <div style={{
              color: "var(--muted)", fontSize: ".8rem",
              fontFamily: "'JetBrains Mono',monospace",
              padding: "2rem 0", textAlign: "center"
            }}>
              // no attempts yet — start solving questions!
            </div>
          ) : (
            topicBars.map((t) => (
              <div key={t.name} className="topic-row">
                <div className="topic-name">{t.name}</div>
                <div className="topic-bar-wrap">
                  <div className="topic-bar" style={{
                    width: animBars ? `${t.pct}%` : "0%",
                    background: t.color,
                  }} />
                </div>
                <div className="topic-pct">{t.pct}%</div>
                <div className="topic-status">{t.status}</div>
              </div>
            ))
          )}
        </div>

        {/* READINESS RINGS */}
        <div className="card card-p">
          <div className="card-title">🎯 Readiness Score</div>
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "1.2rem"
          }}>
            <ProgressRing pct={overallPct} color="var(--lime)" size={120} label="Overall" />
            <div style={{ display: "flex", gap: ".8rem" }}>
              <ProgressRing pct={avgScore}   color="var(--blue)"  size={72} label="Accuracy" />
              <ProgressRing pct={Math.min(streak * 3, 100)} color="var(--amber)" size={72} label="Streak" />
              <ProgressRing pct={Math.min(solved, 100)}     color="var(--pink)"  size={72} label="Volume" />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="g2">

        {/* ACTIVITY HEATMAP */}
        <div className="card card-p">
          <div className="card-title">📅 Activity — Last 6 Months</div>
          <ActivityHeatmap />
        </div>

        {/* AI STUDY PLAN */}
        <div className="card card-p">
          <div className="card-title">🤖 AI Study Recommendations</div>

          {studyPlan ? (
            <>
              <div style={{
                background: "var(--limebg)",
                border: "1px solid rgba(184,255,87,.2)",
                borderRadius: 10, padding: "1rem", marginBottom: "1rem"
              }}>
                <div style={{
                  fontSize: ".72rem", color: "var(--lime)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem"
                }}>// priority this week</div>
                <div style={{ fontSize: ".88rem", fontWeight: 700, marginBottom: ".3rem" }}>
                  Focus on {studyPlan.priority_topic}
                </div>
                <div style={{
                  fontSize: ".75rem", color: "var(--muted2)",
                  fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6
                }}>
                  {studyPlan.reason}
                </div>
              </div>

              <MiniBars items={weakTopics.slice(0, 5).map(t => ({
                label: t.topic,
                val:   parseInt(t.accuracy) || 0,
                color: parseInt(t.accuracy) < 40 ? "var(--pink)" : "var(--amber)"
              }))} />
            </>
          ) : (
            <div style={{
              background: "var(--limebg)",
              border: "1px solid rgba(184,255,87,.2)",
              borderRadius: 10, padding: "1rem"
            }}>
              <div style={{
                fontSize: ".72rem", color: "var(--lime)",
                fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem"
              }}>// getting started</div>
              <div style={{ fontSize: ".88rem", fontWeight: 700, marginBottom: ".3rem" }}>
                Solve your first problems!
              </div>
              <div style={{
                fontSize: ".75rem", color: "var(--muted2)",
                fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6
              }}>
                Once you attempt a few questions, AI will generate a personalised study plan based on your weak areas.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
