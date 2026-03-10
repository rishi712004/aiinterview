import { useState, useEffect } from "react";
import api from "../../services/api";

const DIFF_COLOR = {
  easy:   "var(--lime)",
  medium: "var(--amber)",
  hard:   "var(--pink)",
};

function Countdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const now      = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ fontFamily: "'JetBrains Mono',monospace",
      color: "var(--amber)", fontSize: ".8rem" }}>
      ⏳ {timeLeft}
    </span>
  );
}

export default function DailyChallengePage({ onSolve }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await api.get("/daily");
        setData(res);
      } catch (err) {
        setError("Failed to load daily challenge.");
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
      // loading today's challenge...
    </div>
  );

  if (error) return (
    <div className="page fade-up" style={{ color: "var(--pink)",
      fontFamily: "'JetBrains Mono',monospace" }}>{error}</div>
  );

  const { question: q, already_solved, already_attempted,
          user_score, solved_today, date } = data;

  const diffColor = DIFF_COLOR[q.difficulty] || "var(--muted)";

  // Format date nicely
  const dateStr = new Date(date).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="page fade-up">

      {/* HEADER BANNER */}
      <div style={{
        background: "linear-gradient(135deg, var(--ink2) 0%, var(--ink3) 100%)",
        border: "1px solid var(--border)", borderRadius: 16,
        padding: "2rem", marginBottom: "1.5rem", position: "relative",
        overflow: "hidden"
      }}>
        {/* BG DECORATION */}
        <div style={{ position: "absolute", top: "-20px", right: "-20px",
          fontSize: "8rem", opacity: .04, userSelect: "none" }}>🎯</div>

        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: ".68rem", color: "var(--lime)",
              fontFamily: "'JetBrains Mono',monospace", marginBottom: ".3rem",
              textTransform: "uppercase", letterSpacing: ".1em" }}>
              // daily challenge
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900,
              marginBottom: ".4rem", letterSpacing: "-.02em" }}>
              {q.title}
            </div>
            <div style={{ display: "flex", gap: ".6rem", alignItems: "center",
              flexWrap: "wrap" }}>
              <span style={{ padding: ".2rem .7rem", borderRadius: 20,
                background: "var(--ink1)", border: `1px solid ${diffColor}40`,
                fontSize: ".72rem", color: diffColor, fontWeight: 700,
                fontFamily: "'JetBrains Mono',monospace" }}>
                {q.difficulty}
              </span>
              <span style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace" }}>
                {q.topic}
              </span>
              <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>·</span>
              <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{dateStr}</span>
            </div>
          </div>

          {/* STATUS + COUNTDOWN */}
          <div style={{ textAlign: "right" }}>
            {already_solved ? (
              <div style={{ padding: ".6rem 1.2rem", borderRadius: 10,
                background: "var(--limebg)", border: "1px solid rgba(184,255,87,.3)",
                textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem" }}>✅</div>
                <div style={{ fontSize: ".78rem", fontWeight: 700,
                  color: "var(--lime)" }}>Solved!</div>
                <div style={{ fontSize: ".7rem", color: "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  Score: {user_score}/100
                </div>
              </div>
            ) : already_attempted ? (
              <div style={{ padding: ".6rem 1.2rem", borderRadius: 10,
                background: "var(--amberbg)", border: "1px solid rgba(255,181,71,.3)",
                textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem" }}>🟡</div>
                <div style={{ fontSize: ".78rem", fontWeight: 700,
                  color: "var(--amber)" }}>Attempted</div>
                <div style={{ fontSize: ".7rem", color: "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  Score: {user_score}/100
                </div>
              </div>
            ) : (
              <div style={{ padding: ".6rem 1.2rem", borderRadius: 10,
                background: "var(--pinkbg)", border: "1px solid rgba(255,95,143,.2)",
                textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem" }}>🔥</div>
                <div style={{ fontSize: ".78rem", fontWeight: 700,
                  color: "var(--pink)", marginBottom: ".3rem" }}>Not Solved</div>
                <Countdown />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="g12">

        {/* LEFT — PROBLEM */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          {/* DESCRIPTION */}
          <div className="card card-p">
            <div className="card-title">📋 Problem Description</div>
            <div style={{ fontSize: ".85rem", lineHeight: 1.8,
              color: "var(--muted2)", marginBottom: "1.2rem" }}>
              {q.description}
            </div>
            <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
              {q.tags?.map(tag => (
                <span key={tag} style={{ padding: ".2rem .6rem", borderRadius: 20,
                  background: "var(--ink3)", border: "1px solid var(--border)",
                  fontSize: ".65rem", color: "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace" }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* STATS */}
          <div className="card card-p">
            <div className="card-title">📊 Challenge Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem" }}>
              {[
                { icon: "👥", label: "Solved Today",  val: `${solved_today} users`    },
                { icon: "📈", label: "Acceptance",    val: `${q.acceptance}%`          },
                { icon: "🔥", label: "Frequency",     val: `${q.frequency}%`           },
                { icon: "🏢", label: "Top Companies", val: q.companies?.slice(0,2).join(", ") },
              ].map(s => (
                <div key={s.label} style={{ padding: ".8rem", background: "var(--ink3)",
                  borderRadius: 8, display: "flex", gap: ".6rem", alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: ".62rem", color: "var(--muted)",
                      fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
                    <div style={{ fontSize: ".82rem", fontWeight: 700 }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — ACTION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          {/* SOLVE BUTTON */}
          <div className="card card-p" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: ".6rem" }}>
              {already_solved ? "🏆" : already_attempted ? "🔄" : "⚡"}
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: ".4rem" }}>
              {already_solved   ? "Challenge Complete!"
             : already_attempted ? "Try Again?"
             : "Ready to Solve?"}
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace", marginBottom: "1.2rem",
              lineHeight: 1.6 }}>
              {already_solved
                ? `// great job! you scored ${user_score}/100 today`
                : already_attempted
                ? `// you scored ${user_score}/100 — can you do better?`
                : "// solve today's challenge to maintain your streak"}
            </div>

            <button className="btn btn-lime"
              onClick={() => onSolve && onSolve(q.slug)}
              style={{ width: "100%", justifyContent: "center",
                padding: ".7rem", fontSize: ".9rem" }}>
              {already_solved   ? "🔍 Review Solution"
             : already_attempted ? "🔄 Retry Challenge"
             : "▶ Start Solving"}
            </button>

            {!already_solved && (
              <div style={{ marginTop: ".8rem", fontSize: ".7rem",
                color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>
                New challenge in: <Countdown />
              </div>
            )}
          </div>

          {/* STREAK REMINDER */}
          <div style={{ padding: "1.2rem", borderRadius: 12,
            background: already_solved
              ? "var(--limebg)" : "rgba(255,181,71,.08)",
            border: `1px solid ${already_solved
              ? "rgba(184,255,87,.2)" : "rgba(255,181,71,.2)"}` }}>
            <div style={{ fontSize: ".7rem", color: already_solved
              ? "var(--lime)" : "var(--amber)",
              fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem" }}>
              // streak tip
            </div>
            <div style={{ fontSize: ".78rem", color: "var(--muted2)", lineHeight: 1.6 }}>
              {already_solved
                ? "🔥 Your streak is safe for today! Keep coming back daily to maintain it."
                : "⚠️ Solve today's challenge before midnight to keep your streak alive!"}
            </div>
          </div>

          {/* COMPANIES */}
          <div className="card card-p">
            <div className="card-title">🏢 Asked By</div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {q.companies?.map(c => (
                <span key={c} style={{ padding: ".3rem .8rem", borderRadius: 8,
                  background: "var(--ink3)", border: "1px solid var(--border)",
                  fontSize: ".75rem", fontWeight: 600 }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
