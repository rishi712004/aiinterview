import { useState, useEffect } from "react";
import api from "../../services/api";

const STATUS_CONFIG = {
  solved:    { color: "var(--lime)",  bg: "var(--limebg)",  icon: "✅", label: "Solved"    },
  attempted: { color: "var(--amber)", bg: "var(--amberbg)", icon: "🟡", label: "Attempted" },
  failed:    { color: "var(--pink)",  bg: "var(--pinkbg)",  icon: "❌", label: "Failed"    },
};

function formatTime(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function HistoryPage({ onOpenQuestion }) {
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [expanded, setExpanded] = useState(null);

  const load = async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/history?page=${p}&limit=10`);
      const newAttempts = data.attempts || [];
      setAttempts(prev => reset ? newAttempts : [...prev, ...newAttempts]);
      setHasMore(newAttempts.length === 10);
      setPage(p);
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, true); }, []);

  const filtered = attempts.filter(a => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  // Stats from attempts
  const totalSolved   = attempts.filter(a => a.status === "solved").length;
  const totalFailed   = attempts.filter(a => a.status === "failed").length;
  const avgScore      = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.ai_score || 0), 0) / attempts.length)
    : 0;
  const bestScore     = attempts.length
    ? Math.max(...attempts.map(a => a.ai_score || 0))
    : 0;

  return (
    <div className="page fade-up">

      {/* STATS ROW */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Total Submissions", val: attempts.length, color: "lime",  accent: "📝" },
          { label: "Solved",            val: totalSolved,      color: "blue",  accent: "✅" },
          { label: "Avg Score",         val: `${avgScore}%`,   color: "amber", accent: "📊" },
          { label: "Best Score",        val: `${bestScore}%`,  color: "pink",  accent: "🏆" },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-accent">{s.accent}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-val">{s.val}</div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ padding: ".8rem 1.2rem", display: "flex",
          alignItems: "center", gap: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {[
              { key: "all",      label: `All (${attempts.length})`   },
              { key: "solved",   label: `✅ Solved (${totalSolved})`  },
              { key: "attempted",label: `🟡 Attempted`               },
              { key: "failed",   label: `❌ Failed (${totalFailed})`  },
            ].map(t => (
              <button key={t.key}
                className={`tab-btn ${filter === t.key ? "active" : ""}`}
                onClick={() => setFilter(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: ".72rem",
            color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>
            {filtered.length} submissions
          </div>
        </div>

        {/* ATTEMPTS LIST */}
        {loading && attempts.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center",
            color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>
            // loading history...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center",
            color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>
            // no submissions yet — go solve some problems!
          </div>
        ) : (
          filtered.map((a, i) => {
            const s = STATUS_CONFIG[a.status] || STATUS_CONFIG.attempted;
            const isOpen = expanded === a.id;
            return (
              <div key={a.id}>
                {/* ROW */}
                <div onClick={() => setExpanded(isOpen ? null : a.id)}
                  style={{ padding: ".9rem 1.2rem", cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    background: isOpen ? "var(--ink3)" : "transparent",
                    transition: "background .15s",
                    display: "flex", alignItems: "center", gap: "1rem" }}>

                  {/* STATUS ICON */}
                  <div style={{ fontSize: "1.1rem", flexShrink: 0 }}>{s.icon}</div>

                  {/* QUESTION INFO */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center",
                      gap: ".6rem", marginBottom: ".2rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: ".85rem",
                        color: "var(--blue)", cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuestion && onOpenQuestion(a.slug);
                        }}>
                        {a.title}
                      </span>
                      <span className={`diff-pill ${a.difficulty}`}>{a.difficulty}</span>
                      <span className="q-tag">{a.topic}</span>
                    </div>
                    <div style={{ fontSize: ".7rem", color: "var(--muted)",
                      fontFamily: "'JetBrains Mono',monospace" }}>
                      {a.language} · {formatTime(a.time_taken)} · {timeAgo(a.created_at)}
                    </div>
                  </div>

                  {/* SCORE */}
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900,
                      color: s.color, letterSpacing: "-.04em" }}>
                      {a.ai_score}
                    </div>
                    <div style={{ fontSize: ".6rem", color: "var(--muted)",
                      fontFamily: "'JetBrains Mono',monospace" }}>score</div>
                  </div>

                  {/* SCORE BAR */}
                  <div style={{ width: 60, flexShrink: 0 }}>
                    <div style={{ height: 4, background: "var(--ink3)", borderRadius: 2 }}>
                      <div style={{ width: `${a.ai_score}%`, height: "100%",
                        background: s.color, borderRadius: 2,
                        transition: "width .6s ease" }} />
                    </div>
                  </div>

                  {/* EXPAND ARROW */}
                  <div style={{ color: "var(--muted)", fontSize: ".8rem",
                    transition: "transform .2s",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▾
                  </div>
                </div>

                {/* EXPANDED — CODE + FEEDBACK */}
                {isOpen && <AttemptDetail attemptId={a.id} language={a.language} />}
              </div>
            );
          })
        )}

        {/* LOAD MORE */}
        {hasMore && !loading && (
          <div style={{ padding: "1rem", textAlign: "center" }}>
            <button className="btn btn-ghost"
              onClick={() => load(page + 1)}
              style={{ justifyContent: "center" }}>
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Expanded attempt detail ───────────────────────────────────────────────
function AttemptDetail({ attemptId, language }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/sessions/attempt/${attemptId}`);
        setDetail(data);
      } catch (err) {
        console.error("Attempt detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading) return (
    <div style={{ padding: "1rem 1.5rem", background: "var(--ink3)",
      borderBottom: "1px solid var(--border)",
      color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace", fontSize: ".75rem" }}>
      // loading details...
    </div>
  );

  if (!detail) return null;

  const fb   = detail.ai_feedback || {};
  const exec = fb.execution || {};

  return (
    <div style={{ background: "var(--ink3)", borderBottom: "1px solid var(--border)",
      padding: "1.2rem 1.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>

        {/* LEFT — FEEDBACK */}
        <div style={{ flex: 1, minWidth: 250 }}>

          {/* TEST RESULTS */}
          {exec.test_cases?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: ".68rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", marginBottom: ".5rem",
                display: "flex", justifyContent: "space-between" }}>
                <span>// test cases</span>
                <span style={{ color: exec.tests_passed === exec.tests_total
                  ? "var(--lime)" : "var(--amber)" }}>
                  {exec.tests_passed}/{exec.tests_total} passed
                </span>
              </div>
              {exec.test_cases.map((tc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center",
                  gap: ".6rem", padding: ".4rem .6rem", marginBottom: ".3rem",
                  background: tc.passed ? "rgba(184,255,87,.05)" : "rgba(255,95,143,.05)",
                  borderRadius: 6, fontSize: ".72rem",
                  fontFamily: "'JetBrains Mono',monospace",
                  border: `1px solid ${tc.passed ? "rgba(184,255,87,.15)" : "rgba(255,95,143,.15)"}` }}>
                  <span style={{ color: tc.passed ? "var(--lime)" : "var(--pink)" }}>
                    {tc.passed ? "✓" : "✗"}
                  </span>
                  <span style={{ color: "var(--muted2)", flex: 1 }}>
                    {tc.input}
                  </span>
                  <span style={{ color: tc.passed ? "var(--lime)" : "var(--pink)" }}>
                    {tc.passed ? tc.expected : `got: ${tc.actual}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* SUMMARY */}
          {fb.summary && (
            <div style={{ fontSize: ".76rem", color: "var(--muted2)", lineHeight: 1.7,
              padding: ".7rem", background: "var(--ink2)", borderRadius: 8,
              marginBottom: ".8rem" }}>
              {fb.summary}
            </div>
          )}

          {/* COMPLEXITY */}
          {fb.time_complexity && (
            <div style={{ display: "flex", gap: ".6rem", marginBottom: ".8rem" }}>
              {[
                { label: "Time",  val: fb.time_complexity  },
                { label: "Space", val: fb.space_complexity },
              ].map(({ label, val }) => (
                <div key={label} style={{ flex: 1, padding: ".5rem",
                  background: "var(--ink2)", borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: ".6rem", color: "var(--muted)",
                    fontFamily: "'JetBrains Mono',monospace" }}>{label}</div>
                  <div style={{ fontSize: ".8rem", fontWeight: 700,
                    color: "var(--blue)", fontFamily: "'JetBrains Mono',monospace" }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STRENGTHS + IMPROVEMENTS */}
          {fb.strengths?.length > 0 && (
            <div style={{ marginBottom: ".6rem" }}>
              {fb.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: ".73rem", color: "var(--muted2)",
                  padding: ".3rem .6rem", borderLeft: "2px solid var(--lime)",
                  marginBottom: ".3rem" }}>✓ {s}</div>
              ))}
            </div>
          )}
          {fb.improvements?.length > 0 && (
            <div>
              {fb.improvements.map((s, i) => (
                <div key={i} style={{ fontSize: ".73rem", color: "var(--muted2)",
                  padding: ".3rem .6rem", borderLeft: "2px solid var(--amber)",
                  marginBottom: ".3rem" }}>→ {s}</div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — CODE */}
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: ".5rem" }}>
            <div style={{ fontSize: ".68rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace" }}>// submitted code</div>
            <button onClick={() => setShowCode(!showCode)}
              style={{ background: "var(--ink2)", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--muted)", cursor: "pointer",
                padding: ".2rem .6rem", fontSize: ".68rem",
                fontFamily: "'JetBrains Mono',monospace" }}>
              {showCode ? "Hide" : "Show"} Code
            </button>
          </div>
          {showCode && detail.code && (
            <pre style={{ background: "var(--ink2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "1rem", overflow: "auto",
              fontSize: ".72rem", color: "var(--lime)", lineHeight: 1.7,
              fontFamily: "'JetBrains Mono',monospace", maxHeight: 300,
              margin: 0 }}>
              {detail.code}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
