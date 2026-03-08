import { useState, useEffect } from "react";

import ProgressRing from "../../components/charts/ProgressRing";
import MiniBars from "../../components/charts/MiniBars";
import ActivityHeatmap from "../../components/dashboard/ActivityHeatmap";

import { TOPICS } from "../../data/topics";

export default function DashboardPage() {
  const [animBars, setAnimBars] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimBars(true), 400);
  }, []);

  return (
    <div className="page fade-up">

      {/* STATS */}
      <div className="stat-grid">
        {[
          { label: "Problems Solved", val: "347", sub: "↑ +12 this week", color: "lime", accent: "🎯" },
          { label: "Accuracy Rate", val: "74%", sub: "↑ +3% vs last month", color: "blue", accent: "📈" },
          { label: "Day Streak", val: "23", sub: "🔥 Personal best!", color: "amber", accent: "⚡" },
          { label: "Weak Topics", val: "3", sub: "↓ Trees, DP, Graphs", color: "pink", accent: "⚠️" },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-accent">{s.accent}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div
              className={`stat-sub ${
                s.sub.includes("↑") || s.sub.includes("🔥")
                  ? "up"
                  : s.sub.includes("↓")
                  ? "down"
                  : ""
              }`}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ROW 1 */}
      <div className="g21">
        {/* TOPIC WEAKNESS */}
        <div className="card card-p">
          <div className="card-title">
            📊 Topic Performance Heatmap — AI-Identified Weak Areas
          </div>

          {TOPICS.map((t) => (
            <div key={t.name} className="topic-row">
              <div className="topic-name">{t.name}</div>

              <div className="topic-bar-wrap">
                <div
                  className="topic-bar"
                  style={{
                    width: animBars ? `${t.pct}%` : "0%",
                    background: t.color,
                  }}
                />
              </div>

              <div className="topic-pct">{t.pct}%</div>
              <div className="topic-status">{t.status}</div>
            </div>
          ))}
        </div>

        {/* RINGS */}
        <div className="card card-p">
          <div className="card-title">🎯 Readiness Score</div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.2rem",
            }}
          >
            <ProgressRing pct={68} color="var(--lime)" size={120} label="Overall" />

            <div style={{ display: "flex", gap: ".8rem" }}>
              <ProgressRing pct={82} color="var(--blue)" size={72} label="Technical" />
              <ProgressRing pct={55} color="var(--pink)" size={72} label="Concepts" />
              <ProgressRing pct={74} color="var(--amber)" size={72} label="Speed" />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="g2">
        {/* ACTIVITY */}
        <div className="card card-p">
          <div className="card-title">📅 Activity — Last 6 Months</div>
          <ActivityHeatmap />
        </div>

        {/* AI RECOMMENDATION */}
        <div className="card card-p">
          <div className="card-title">🤖 AI Study Recommendations</div>

          <div
            style={{
              background: "var(--limebg)",
              border: "1px solid rgba(184,255,87,.2)",
              borderRadius: 10,
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontSize: ".72rem",
                color: "var(--lime)",
                fontFamily: "'JetBrains Mono',monospace",
                marginBottom: ".4rem",
              }}
            >
              // priority this week
            </div>

            <div
              style={{
                fontSize: ".88rem",
                fontWeight: 700,
                marginBottom: ".3rem",
              }}
            >
              Focus on Trees & Graph BFS/DFS
            </div>

            <div
              style={{
                fontSize: ".75rem",
                color: "var(--muted2)",
                fontFamily: "'JetBrains Mono',monospace",
                lineHeight: 1.6,
              }}
            >
              Google interviews in the last 3 months have had 68% tree/graph
              problems. Your accuracy here is 28%.
            </div>
          </div>

          <MiniBars
            items={[
              { label: "Arrays", val: 88, color: "var(--lime)" },
              { label: "Trees", val: 28, color: "var(--pink)" },
              { label: "DP", val: 18, color: "var(--pink)" },
              { label: "Graphs", val: 28, color: "var(--pink)" },
              { label: "Greedy", val: 60, color: "var(--amber)" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}