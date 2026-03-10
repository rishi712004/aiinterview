import { useState, useEffect } from "react";
import { getLeaderboard } from "../../services/api";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage({ user }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("solved");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: res } = await getLeaderboard();
        setData(res.leaderboard || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sort by selected tab
  const sorted = [...data].sort((a, b) => {
    if (tab === "solved")    return (b.solved || 0)    - (a.solved || 0);
    if (tab === "accuracy")  return (b.avg_score || 0) - (a.avg_score || 0);
    if (tab === "streak")    return (b.streak || 0)    - (a.streak || 0);
    return 0;
  });

  const topThree = sorted.slice(0, 3);
  const rest     = sorted.slice(3);

  const getInitials = (name) =>
    name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const avatarColors = [
    "var(--limebg)", "var(--bluebg)", "var(--pinkbg)",
    "var(--amberbg)", "var(--ink3)"
  ];

  if (loading) return (
    <div className="page fade-up" style={{ display: "flex", alignItems: "center",
      justifyContent: "center", minHeight: 400, color: "var(--muted)",
      fontFamily: "'JetBrains Mono',monospace" }}>
      // loading leaderboard...
    </div>
  );

  return (
    <div className="page fade-up">

      {/* HEADER STATS */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Total Users",     val: data.length,
            sub: "// registered",         color: "lime",  accent: "👥" },
          { label: "Top Score",       val: `${sorted[0]?.avg_score || 0}%`,
            sub: `// ${sorted[0]?.name || "—"}`, color: "blue",  accent: "🏆" },
          { label: "Most Solved",     val: sorted[0]?.solved || 0,
            sub: `// ${sorted[0]?.name || "—"}`, color: "amber", accent: "🎯" },
          { label: "Longest Streak",  val: `${Math.max(...data.map(d => d.streak || 0))} days`,
            sub: "// 🔥 current leader",  color: "pink",  accent: "⚡" },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-accent">{s.accent}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TOP 3 PODIUM */}
      {topThree.length >= 3 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: ".7rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace", marginBottom: "1rem",
            textTransform: "uppercase", letterSpacing: ".1em" }}>
            // top performers
          </div>

          <div style={{ display: "flex", alignItems: "flex-end",
            justifyContent: "center", gap: "1rem" }}>

            {/* 2nd place */}
            <div style={{ textAlign: "center", flex: 1, maxWidth: 180 }}>
              <div style={{ fontSize: "1.8rem", marginBottom: ".3rem" }}>🥈</div>
              <div style={{
                background: "var(--ink2)", border: "1px solid var(--border)",
                borderRadius: "12px 12px 0 0", padding: "1.2rem .8rem",
                height: 120, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%",
                  background: "var(--bluebg)", border: "2px solid var(--blue)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: ".85rem", marginBottom: ".5rem" }}>
                  {getInitials(topThree[1]?.name)}
                </div>
                <div style={{ fontWeight: 700, fontSize: ".82rem", marginBottom: ".2rem" }}>
                  {topThree[1]?.name}
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--blue)",
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  {topThree[1]?.solved || 0} solved
                </div>
              </div>
            </div>

            {/* 1st place */}
            <div style={{ textAlign: "center", flex: 1, maxWidth: 200 }}>
              <div style={{ fontSize: "2.2rem", marginBottom: ".3rem" }}>🥇</div>
              <div style={{
                background: "var(--limebg)", border: "1px solid rgba(184,255,87,.3)",
                borderRadius: "12px 12px 0 0", padding: "1.5rem 1rem",
                height: 150, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(184,255,87,.2)", border: "2px solid var(--lime)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: ".95rem", marginBottom: ".5rem",
                  color: "var(--lime)" }}>
                  {getInitials(topThree[0]?.name)}
                </div>
                <div style={{ fontWeight: 800, fontSize: ".9rem", marginBottom: ".2rem" }}>
                  {topThree[0]?.name}
                </div>
                <div style={{ fontSize: ".72rem", color: "var(--lime)",
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  {topThree[0]?.solved || 0} solved
                </div>
                <div style={{ fontSize: ".65rem", color: "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace", marginTop: ".2rem" }}>
                  {topThree[0]?.avg_score || 0}% avg
                </div>
              </div>
            </div>

            {/* 3rd place */}
            <div style={{ textAlign: "center", flex: 1, maxWidth: 180 }}>
              <div style={{ fontSize: "1.8rem", marginBottom: ".3rem" }}>🥉</div>
              <div style={{
                background: "var(--ink2)", border: "1px solid var(--border)",
                borderRadius: "12px 12px 0 0", padding: "1.2rem .8rem",
                height: 100, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%",
                  background: "var(--pinkbg)", border: "2px solid var(--pink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: ".85rem", marginBottom: ".5rem" }}>
                  {getInitials(topThree[2]?.name)}
                </div>
                <div style={{ fontWeight: 700, fontSize: ".82rem", marginBottom: ".2rem" }}>
                  {topThree[2]?.name}
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--pink)",
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  {topThree[2]?.solved || 0} solved
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL TABLE */}
      <div className="card">
        <div style={{ padding: "1rem 1.3rem", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: ".8rem", fontWeight: 700 }}>🏅 Full Rankings</div>

          {/* SORT TABS */}
          <div className="tabs" style={{ marginBottom: 0, marginLeft: "auto" }}>
            {[
              { key: "solved",   label: "By Solved"   },
              { key: "accuracy", label: "By Accuracy" },
              { key: "streak",   label: "By Streak"   },
            ].map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        <table className="q-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Target</th>
              <th>Solved</th>
              <th>Avg Score</th>
              <th>Streak</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => {
              const isMe = u.name === user?.name;
              const level = u.solved >= 100 ? "Expert" : u.solved >= 50 ? "Advanced"
                          : u.solved >= 20 ? "Intermediate" : "Beginner";
              const levelColor = u.solved >= 100 ? "var(--lime)" : u.solved >= 50 ? "var(--blue)"
                               : u.solved >= 20 ? "var(--amber)" : "var(--muted)";
              return (
                <tr key={i} style={{
                  background: isMe ? "rgba(184,255,87,.05)" : "transparent",
                  outline: isMe ? "1px solid rgba(184,255,87,.2)" : "none"
                }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                      {i < 3 ? (
                        <span style={{ fontSize: "1rem" }}>{MEDALS[i]}</span>
                      ) : (
                        <span style={{ fontFamily: "'JetBrains Mono',monospace",
                          fontSize: ".75rem", color: "var(--muted)", minWidth: 24 }}>
                          #{i + 1}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%",
                        background: avatarColors[i % avatarColors.length],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: ".72rem",
                        border: isMe ? "2px solid var(--lime)" : "none" }}>
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: ".82rem" }}>
                          {u.name} {isMe && <span style={{ fontSize: ".65rem",
                            color: "var(--lime)", fontFamily: "'JetBrains Mono',monospace" }}>
                            (you)</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ fontSize: ".72rem", color: "var(--muted2)" }}>
                    {u.target_company || "—"}
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      <div style={{ width: 50, height: 4, background: "var(--ink3)", borderRadius: 2 }}>
                        <div style={{ width: `${Math.min((u.solved / 111) * 100, 100)}%`,
                          height: "100%", background: "var(--lime)", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: ".82rem",
                        color: "var(--lime)", fontFamily: "'JetBrains Mono',monospace" }}>
                        {u.solved || 0}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem",
                      color: parseInt(u.avg_score) >= 70 ? "var(--lime)"
                           : parseInt(u.avg_score) >= 50 ? "var(--amber)" : "var(--pink)" }}>
                      {u.avg_score || 0}%
                    </span>
                  </td>

                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".78rem",
                      color: u.streak > 0 ? "var(--amber)" : "var(--muted)" }}>
                      {u.streak > 0 ? `🔥 ${u.streak}` : "—"}
                    </span>
                  </td>

                  <td>
                    <span style={{ padding: ".2rem .6rem", borderRadius: 20,
                      background: "var(--ink3)", fontSize: ".65rem",
                      color: levelColor, fontFamily: "'JetBrains Mono',monospace",
                      border: `1px solid ${levelColor}40` }}>
                      {level}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
