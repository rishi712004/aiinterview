import { useState } from "react";
import MiniBars from "../../components/charts/MiniBars";
import { analyzeResume } from "../../services/api";

export default function ResumePage() {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files[0] || e.target.files[0];
    if (f && f.type === "application/pdf") {
      setFile(f); setResult(null); setError("");
    } else {
      setError("⚠️ Only PDF files are accepted.");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const { data } = await analyzeResume(file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "❌ Analysis failed. Make sure GROQ_API_KEY is set in backend .env");
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.analysis;
  const suggestions = analysis?.suggestions || [];
  const roleMatches = analysis?.role_matches || [];
  const overallScore = analysis
    ? Math.round((analysis.ats_score + analysis.format_score + analysis.impact_score + analysis.keyword_score) / 4) : 0;

  const scoreColor = (v) => v >= 70 ? "var(--lime)" : v >= 50 ? "var(--amber)" : "var(--pink)";

  return (
    <div className="page fade-up">

      {/* TOP UPLOAD BANNER */}
      <div style={{
        background: "linear-gradient(135deg, var(--ink2) 0%, var(--ink3) 100%)",
        border: "1px solid var(--border)", borderRadius: 16,
        padding: "2rem", marginBottom: "1.5rem",
        display: "flex", alignItems: "center", gap: "2rem",
        flexWrap: "wrap"
      }}>
        {/* DROP ZONE */}
        <div
          onClick={() => !file && document.getElementById("resume-input").click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            flex: "0 0 260px", height: 140,
            border: `2px dashed ${dragging ? "var(--lime)" : file ? "var(--blue)" : "var(--border)"}`,
            borderRadius: 12, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: ".5rem",
            cursor: file ? "default" : "pointer",
            background: dragging ? "var(--limebg)" : file ? "var(--bluebg)" : "var(--ink1)",
            transition: "all .2s",
          }}>
          <input id="resume-input" type="file" accept=".pdf"
            style={{ display: "none" }} onChange={handleDrop} />
          <div style={{ fontSize: "2rem" }}>{file ? "📄" : "⬆️"}</div>
          <div style={{ fontSize: ".82rem", fontWeight: 700, color: file ? "var(--blue)" : "var(--fg)" }}>
            {file ? file.name : "Drop PDF here"}
          </div>
          <div style={{ fontSize: ".68rem", color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>
            {file ? `${(file.size / 1024).toFixed(0)} KB` : "or click to browse"}
          </div>
        </div>

        {/* INFO + ACTIONS */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: ".4rem" }}>
            AI Resume Analyzer
          </div>
          <div style={{ fontSize: ".78rem", color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
            lineHeight: 1.7, marginBottom: "1rem" }}>
            // Powered by Groq (free)<br/>
            // Scores: ATS · Format · Impact · Keywords<br/>
            // Role matching · Missing keywords · Suggestions
          </div>

          <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
            {file && !loading && !result && (
              <button className="btn btn-lime" onClick={handleAnalyze}
                style={{ justifyContent: "center" }}>
                🤖 Analyze Now
              </button>
            )}
            {loading && (
              <button className="btn btn-lime" disabled style={{ justifyContent: "center", opacity: .7 }}>
                ⏳ Analyzing...
              </button>
            )}
            {file && (
              <button className="btn btn-ghost"
                onClick={() => { setFile(null); setResult(null); setError(""); }}
                style={{ justifyContent: "center" }}>
                🔄 Change File
              </button>
            )}
            {!file && (
              <button className="btn btn-ghost"
                onClick={() => document.getElementById("resume-input").click()}
                style={{ justifyContent: "center" }}>
                📁 Browse Files
              </button>
            )}
          </div>
        </div>

        {/* SCORE PREVIEW — only when result available */}
        {result && (
          <div style={{
            flex: "0 0 auto", display: "flex", gap: "1rem",
            background: "var(--ink1)", borderRadius: 12, padding: "1rem 1.5rem"
          }}>
            {[
              { val: overallScore,           lbl: "Overall"  },
              { val: analysis.ats_score,     lbl: "ATS"      },
              { val: analysis.format_score,  lbl: "Format"   },
              { val: analysis.impact_score,  lbl: "Impact"   },
              { val: analysis.keyword_score, lbl: "Keywords" },
            ].map(({ val, lbl }) => (
              <div key={lbl} style={{ textAlign: "center", minWidth: 48 }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 900,
                  letterSpacing: "-.04em", color: scoreColor(val) }}>{val}</div>
                <div style={{ fontSize: ".6rem", color: "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace", marginTop: ".1rem" }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOADING BAR */}
      {loading && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: ".72rem", color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
            marginBottom: ".4rem" }}>
            <span>// sending to Groq AI...</span>
            <span>analyzing resume</span>
          </div>
          <div style={{ height: 4, background: "var(--ink3)", borderRadius: 2, overflow: "hidden" }}>
            <div className="shimmer" style={{ height: "100%", width: "70%" }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: "1rem", padding: ".8rem 1rem", borderRadius: 10,
          background: "var(--pinkbg)", border: "1px solid var(--pink)",
          fontSize: ".78rem", color: "var(--pink)", fontFamily: "'JetBrains Mono',monospace" }}>
          {error}
        </div>
      )}

      {/* RESULTS GRID */}
      {result && (
        <div className="g12">

          {/* LEFT — SUGGESTIONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            {result.verdict && (
              <div style={{
                padding: "1rem 1.2rem", borderRadius: 12,
                background: "var(--limebg)", border: "1px solid rgba(184,255,87,.2)"
              }}>
                <div style={{ fontSize: ".68rem", color: "var(--lime)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: ".3rem" }}>
                  // AI verdict
                </div>
                <div style={{ fontSize: ".85rem", color: "var(--muted2)", lineHeight: 1.6 }}>
                  {result.verdict}
                </div>
              </div>
            )}

            <div className="card card-p">
              <div className="card-title">💡 AI Suggestions</div>
              {suggestions.length > 0 ? suggestions.map((s, i) => (
                <div key={i} style={{
                  display: "flex", gap: ".8rem", alignItems: "flex-start",
                  padding: ".7rem", borderRadius: 8, marginBottom: ".5rem",
                  background: s.type === "warning" ? "var(--pinkbg)" : "var(--ink3)",
                  border: `1px solid ${s.type === "warning" ? "rgba(255,95,143,.15)" : "var(--border)"}`,
                }}>
                  <div style={{ fontSize: "1.1rem", marginTop: ".1rem" }}>
                    {s.type === "warning" ? "⚠️" : "✨"}
                  </div>
                  <div>
                    <div style={{ fontSize: ".8rem", fontWeight: 700, marginBottom: ".2rem" }}>{s.title}</div>
                    <div style={{ fontSize: ".73rem", color: "var(--muted2)", lineHeight: 1.6 }}>{s.description}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: "var(--muted)", fontSize: ".78rem", fontFamily: "'JetBrains Mono',monospace" }}>
                  // no suggestions
                </div>
              )}
            </div>

            {result.top_strengths?.length > 0 && (
              <div className="card card-p">
                <div className="card-title">💪 Top Strengths</div>
                {result.top_strengths.map((s, i) => (
                  <div key={i} style={{
                    padding: ".5rem .8rem", marginBottom: ".4rem", borderRadius: 8,
                    background: "var(--limebg)", border: "1px solid rgba(184,255,87,.15)",
                    fontSize: ".78rem", color: "var(--muted2)", display: "flex", gap: ".5rem"
                  }}>
                    <span style={{ color: "var(--lime)" }}>✓</span> {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — SCORES + ROLES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            <div className="card card-p">
              <div className="card-title">🎯 ATS Score Breakdown</div>
              <MiniBars items={[
                { label: "ATS",      val: analysis.ats_score,     color: scoreColor(analysis.ats_score)     },
                { label: "Format",   val: analysis.format_score,  color: scoreColor(analysis.format_score)  },
                { label: "Impact",   val: analysis.impact_score,  color: scoreColor(analysis.impact_score)  },
                { label: "Keywords", val: analysis.keyword_score, color: scoreColor(analysis.keyword_score) },
              ]} />
            </div>

            <div className="card card-p">
              <div className="card-title">📌 Role-Match Analysis</div>
              {roleMatches.map((r, i) => (
                <div key={i} style={{ marginBottom: ".8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    fontSize: ".78rem", marginBottom: ".3rem" }}>
                    <span style={{ fontWeight: 600 }}>{r.role}</span>
                    <span style={{ color: scoreColor(r.match_pct),
                      fontFamily: "'JetBrains Mono',monospace" }}>{r.match_pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--ink3)", borderRadius: 3 }}>
                    <div style={{ width: `${r.match_pct}%`, height: "100%",
                      background: scoreColor(r.match_pct), borderRadius: 3,
                      transition: "width .6s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {result.missing_keywords?.length > 0 && (
              <div className="card card-p">
                <div className="card-title">🔍 Missing Keywords</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".4rem" }}>
                  {result.missing_keywords.map((k) => (
                    <span key={k} style={{
                      padding: ".25rem .7rem", borderRadius: 20,
                      background: "var(--pinkbg)", border: "1px solid rgba(255,95,143,.3)",
                      fontSize: ".68rem", color: "var(--pink)", fontFamily: "'JetBrains Mono',monospace"
                    }}>{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE — no file yet */}
      {!file && !result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          {[
            { icon: "🎯", title: "ATS Score", desc: "See how well your resume passes automated screening systems" },
            { icon: "💡", title: "Smart Suggestions", desc: "Get specific fixes to improve your chances of getting interviews" },
            { icon: "🏢", title: "Role Matching", desc: "Find out which roles and companies your resume is best suited for" },
          ].map((f) => (
            <div key={f.title} className="card card-p" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: ".6rem" }}>{f.icon}</div>
              <div style={{ fontSize: ".85rem", fontWeight: 700, marginBottom: ".4rem" }}>{f.title}</div>
              <div style={{ fontSize: ".72rem", color: "var(--muted)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
