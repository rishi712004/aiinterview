import { useState } from "react";
import MiniBars from "../../components/charts/MiniBars";
import { AI_SUGGESTIONS } from "../../data/resume";

export default function ResumePage() {
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 2200);
  };

  return (
    <div className="page fade-up">
      <div className="g12">
        {/* LEFT PANEL */}
        <div>
          {!uploaded ? (
            <div className="resume-upload" onClick={handleUpload}>
              <div className="resume-upload-icon">📄</div>
              <div className="resume-upload-text">Drop your resume here</div>
              <div className="resume-upload-sub">
                PDF or DOCX · Max 5MB · AI analysis in seconds
              </div>
            </div>
          ) : (
            <div
              className="card card-p"
              style={{ textAlign: "center", padding: "2rem" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>✅</div>

              <div style={{ fontWeight: 700, marginBottom: ".3rem" }}>
                resume_arjun_2025.pdf
              </div>

              <div
                style={{
                  fontSize: ".72rem",
                  color: "var(--muted)",
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {loading ? "Analyzing with AI..." : "Analysis complete"}
              </div>

              {loading && (
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      height: 3,
                      background: "var(--ink3)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="shimmer"
                      style={{ height: "100%", width: "60%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI FEEDBACK */}
          {done && (
            <div className="ai-feedback-card fade-up">
              <div className="ai-chip">
                <div className="ai-pulse" /> AI Analysis Complete
              </div>

              <div className="feedback-section">
                <div className="fs-label">Overall Scores</div>

                <div className="score-ring-row">
                  <div className="score-ring">
                    <div
                      className="score-ring-val"
                      style={{ color: "var(--amber)" }}
                    >
                      71
                    </div>
                    <div className="score-ring-lbl">Overall</div>
                  </div>

                  <div className="score-ring">
                    <div
                      className="score-ring-val"
                      style={{ color: "var(--lime)" }}
                    >
                      85
                    </div>
                    <div className="score-ring-lbl">Format</div>
                  </div>

                  <div className="score-ring">
                    <div
                      className="score-ring-val"
                      style={{ color: "var(--pink)" }}
                    >
                      58
                    </div>
                    <div className="score-ring-lbl">Impact</div>
                  </div>

                  <div className="score-ring">
                    <div
                      className="score-ring-val"
                      style={{ color: "var(--blue)" }}
                    >
                      69
                    </div>
                    <div className="score-ring-lbl">Keywords</div>
                  </div>
                </div>
              </div>

              <div className="fs-label" style={{ marginTop: ".8rem" }}>
                Suggestions
              </div>

              {AI_SUGGESTIONS.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <div className="sug-icon">{s.icon}</div>

                  <div
                    className="sug-text"
                    dangerouslySetInnerHTML={{ __html: s.text }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div className="card card-p">
            <div className="card-title">🎯 ATS Score Breakdown</div>

            <MiniBars
              items={[
                { label: "Keywords", val: 69, color: "var(--amber)" },
                { label: "Formatting", val: 85, color: "var(--lime)" },
                { label: "Sections", val: 90, color: "var(--lime)" },
                { label: "Quantified", val: 40, color: "var(--pink)" },
                { label: "Action Verbs", val: 55, color: "var(--amber)" },
              ]}
            />
          </div>

          <div className="card card-p">
            <div className="card-title">📌 Role-Match Analysis</div>

            {[
              "SDE-2 @ Google",
              "Backend Engineer @ Stripe",
              "Full Stack @ Razorpay",
            ].map((role, i) => (
              <div
                key={role}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".8rem",
                  marginBottom: ".7rem",
                }}
              >
                <div style={{ flex: 1, fontSize: ".78rem", fontWeight: 600 }}>
                  {role}
                </div>

                <div
                  style={{
                    fontSize: ".72rem",
                    fontFamily: "'JetBrains Mono',monospace",
                    color: ["var(--lime)", "var(--amber)", "var(--pink)"][i],
                  }}
                >
                  {["Match: 81%", "Match: 67%", "Match: 54%"][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}