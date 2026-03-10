import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { getOverview, getHeatmap, getWeaknesses } from "../../services/api";

// ── GitHub-style heatmap ──────────────────────────────────────────────────
function Heatmap({ data }) {
  // Build 365 days from today backwards
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find(h => h.date?.slice(0, 10) === key);
    days.push({ date: key, count: found ? parseInt(found.count) : 0 });
  }

  // Split into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (count === 0) return "var(--ink3)";
    if (count === 1) return "rgba(184,255,87,.3)";
    if (count === 2) return "rgba(184,255,87,.55)";
    if (count === 3) return "rgba(184,255,87,.75)";
    return "var(--lime)";
  };

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: ".5rem" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((day, di) => (
              <div key={di} title={`${day.date}: ${day.count} submissions`}
                style={{ width: 11, height: 11, borderRadius: 2,
                  background: getColor(day.count), cursor: "default",
                  transition: "transform .1s" }}
                onMouseEnter={e => e.target.style.transform = "scale(1.4)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between",
        fontSize: ".62rem", color: "var(--muted)", marginTop: ".4rem",
        fontFamily: "'JetBrains Mono',monospace" }}>
        {months.map(m => <span key={m}>{m}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: ".4rem",
        marginTop: ".6rem", fontSize: ".65rem", color: "var(--muted)",
        fontFamily: "'JetBrains Mono',monospace" }}>
        <span>Less</span>
        {[0,1,2,3,4].map(n => (
          <div key={n} style={{ width: 10, height: 10, borderRadius: 2,
            background: getColor(n) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Custom tooltip for charts ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--ink2)", border: "1px solid var(--border)",
      borderRadius: 8, padding: ".6rem .9rem", fontSize: ".75rem",
      fontFamily: "'JetBrains Mono',monospace" }}>
      <div style={{ color: "var(--muted)", marginBottom: ".2rem" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--lime)" }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage({ user }) {
  const [overview,   setOverview]   = useState(null);
  const [heatmap,    setHeatmap]    = useState([]);
  const [weaknesses, setWeaknesses] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ov, hm, wk] = await Promise.all([
          getOverview(),
          getHeatmap(),
          getWeaknesses(),
        ]);
        setOverview(ov.data);
        setHeatmap(hm.data.heatmap || []);
        setWeaknesses(wk.data);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="page fade-up" style={{ display: "flex", alignItems: "center",
      justifyContent: "center", minHeight: 400, color: "var(--muted)",
      fontFamily: "'JetBrains Mono',monospace" }}>
      // loading analytics...
    </div>
  );

  const topics = overview?.topics || [];

  // Radar chart data
  const radarData = topics.map(t => ({
    topic: t.topic.length > 10 ? t.topic.slice(0, 10) + ".." : t.topic,
    accuracy: parseInt(t.accuracy) || 0,
    fullMark: 100,
  }));

  // Bar chart — solved per topic
  const barData = topics.map(t => ({
    topic: t.topic.length > 8 ? t.topic.slice(0, 8) + ".." : t.topic,
    solved: parseInt(t.solved) || 0,
    total:  parseInt(t.total)  || 0,
  }));

  // Difficulty breakdown
  const byDiff = overview?.by_difficulty || [];
  const easy   = byDiff.find(d => d.difficulty === "easy")?.solved   || 0;
  const medium = byDiff.find(d => d.difficulty === "medium")?.solved || 0;
  const hard   = byDiff.find(d => d.difficulty === "hard")?.solved   || 0;

  // Total activity from heatmap
  const totalActivity = heatmap.reduce((sum, h) => sum + parseInt(h.count), 0);
  const activeDays    = heatmap.filter(h => parseInt(h.count) > 0).length;

  return (
    <div className="page fade-up">

      {/* STAT CARDS */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Problems Solved", val: overview?.solved || 0,
            sub: `// of 111 total`, color: "lime", accent: "🎯" },
          { label: "Avg Score",       val: `${overview?.avg_score || 0}%`,
            sub: "// AI graded",     color: "blue", accent: "📊" },
          { label: "Day Streak",      val: `${overview?.streak || 0} 🔥`,
            sub: "// keep it up",    color: "amber", accent: "⚡" },
          { label: "Active Days",     val: activeDays,
            sub: `// ${totalActivity} total submissions`, color: "pink", accent: "📅" },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-accent">{s.accent}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* HEATMAP */}
      <div className="card card-p" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "1rem" }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            📅 Submission Activity
          </div>
          <div style={{ fontSize: ".72rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace" }}>
            {totalActivity} submissions · {activeDays} active days
          </div>
        </div>
        <Heatmap data={heatmap} />
      </div>

      {/* CHARTS ROW */}
      <div className="g12" style={{ marginBottom: "1.5rem" }}>

        {/* RADAR — topic accuracy */}
        <div className="card card-p">
          <div className="card-title">🕸 Topic Accuracy Radar</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="topic"
                  tick={{ fill: "var(--muted)", fontSize: 11,
                    fontFamily: "'JetBrains Mono',monospace" }} />
                <Radar name="Accuracy" dataKey="accuracy"
                  stroke="var(--lime)" fill="var(--lime)" fillOpacity={0.2}
                  strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem" }}>
              // solve problems to see radar
            </div>
          )}
        </div>

        {/* BAR — solved per topic */}
        <div className="card card-p">
          <div className="card-title">📊 Problems Solved by Topic</div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="topic"
                  tick={{ fill: "var(--muted)", fontSize: 10,
                    fontFamily: "'JetBrains Mono',monospace" }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="solved" name="Solved" fill="var(--lime)"
                  radius={[4, 4, 0, 0]} opacity={0.9} />
                <Bar dataKey="total" name="Total" fill="var(--ink3)"
                  radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem" }}>
              // solve problems to see chart
            </div>
          )}
        </div>
      </div>

      {/* DIFFICULTY BREAKDOWN + TOPIC TABLE */}
      <div className="g12">

        {/* DIFFICULTY */}
        <div className="card card-p">
          <div className="card-title">🎯 Difficulty Breakdown</div>

          {[
            { label: "Easy",   val: easy,   total: 40, color: "var(--lime)"  },
            { label: "Medium", val: medium, total: 55, color: "var(--amber)" },
            { label: "Hard",   val: hard,   total: 16, color: "var(--pink)"  },
          ].map(d => (
            <div key={d.label} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: ".78rem", marginBottom: ".4rem" }}>
                <span style={{ fontWeight: 600, color: d.color }}>{d.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace",
                  color: "var(--muted)" }}>
                  {d.val} / {d.total}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--ink3)", borderRadius: 4 }}>
                <div style={{ width: `${Math.min((d.val / d.total) * 100, 100)}%`,
                  height: "100%", background: d.color, borderRadius: 4,
                  transition: "width .6s ease" }} />
              </div>
            </div>
          ))}

          {/* OVERALL PROGRESS RING */}
          <div style={{ textAlign: "center", marginTop: "1.5rem",
            padding: "1rem", background: "var(--ink3)", borderRadius: 10 }}>
            <div style={{ fontSize: "2rem", fontWeight: 900,
              color: "var(--lime)", letterSpacing: "-.04em" }}>
              {overview?.solved || 0}
              <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/111</span>
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace" }}>
              {Math.round(((overview?.solved || 0) / 111) * 100)}% complete
            </div>
          </div>
        </div>

        {/* TOPIC TABLE */}
        <div className="card card-p">
          <div className="card-title">📋 Topic Performance</div>
          {topics.length > 0 ? (
            <table className="q-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Solved</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t, i) => {
                  const acc = parseInt(t.accuracy) || 0;
                  const color = acc >= 70 ? "var(--lime)"
                              : acc >= 50 ? "var(--amber)" : "var(--pink)";
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, fontSize: ".8rem" }}>{t.topic}</td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace",
                        fontSize: ".78rem" }}>{t.solved}/{t.total}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                          <div style={{ width: 50, height: 4,
                            background: "var(--ink3)", borderRadius: 2 }}>
                            <div style={{ width: `${acc}%`, height: "100%",
                              background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: ".72rem", color,
                            fontFamily: "'JetBrains Mono',monospace" }}>{acc}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: ".65rem", padding: ".2rem .5rem",
                          borderRadius: 20, background: "var(--ink3)",
                          color, fontFamily: "'JetBrains Mono',monospace",
                          border: `1px solid ${color}40` }}>
                          {acc >= 70 ? "Strong" : acc >= 50 ? "OK" : "Weak"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".8rem", padding: "2rem 0", textAlign: "center" }}>
              // solve problems to see topic performance
            </div>
          )}
        </div>
      </div>

      {/* AI STUDY PLAN */}
      {weaknesses?.study_plan && (
        <div className="ai-feedback-card fade-up" style={{ marginTop: "1.5rem" }}>
          <div className="ai-chip"><div className="ai-pulse" /> AI Study Plan</div>
          <div style={{ fontSize: ".9rem", fontWeight: 700, margin: ".8rem 0 .4rem" }}>
            {weaknesses.study_plan.headline}
          </div>
          <div style={{ fontSize: ".78rem", color: "var(--muted2)", marginBottom: "1rem" }}>
            Priority: <strong style={{ color: "var(--lime)" }}>
              {weaknesses.study_plan.priority_topic}
            </strong> — {weaknesses.study_plan.reason}
          </div>
          <div className="g12">
            {["week1", "week2"].map(week => (
              <div key={week}>
                <div style={{ fontSize: ".7rem", color: "var(--lime)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: ".5rem" }}>
                  // {week.replace("week", "week ")}
                </div>
                {weaknesses.study_plan[week]?.map((d, i) => (
                  <div key={i} style={{ padding: ".6rem .8rem", marginBottom: ".4rem",
                    background: "var(--ink3)", borderRadius: 8,
                    border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      fontSize: ".75rem", marginBottom: ".2rem" }}>
                      <span style={{ fontWeight: 700 }}>{d.day}</span>
                      <span style={{ color: "var(--lime)",
                        fontFamily: "'JetBrains Mono',monospace" }}>
                        {d.problems} problems
                      </span>
                    </div>
                    <div style={{ fontSize: ".72rem", color: "var(--blue)",
                      marginBottom: ".2rem" }}>{d.focus}</div>
                    <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                      💡 {d.tip}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
