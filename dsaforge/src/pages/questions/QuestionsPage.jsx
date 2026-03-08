import { useState } from "react";
import MiniBars from "../../components/charts/MiniBars";
import { QUESTIONS_DATA, COMPANIES } from "../../data/questions";

export default function QuestionsPage() {
  const [activeCompany, setActiveCompany] = useState("Google");
  const [tab, setTab] = useState("All");

  const filtered = QUESTIONS_DATA.filter((q) =>
    tab === "All" ? true : tab === "Unsolved" ? !q.solved : q.solved
  );

  return (
    <div className="page fade-up">
      
      {/* COMPANY SECTION */}
      <div
        className="g21"
        style={{ marginBottom: "1.2rem", alignItems: "flex-start" }}
      >
        <div>
          <div
            style={{
              fontSize: ".7rem",
              color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              marginBottom: ".6rem",
            }}
          >
            🏢 Company-Specific Question Patterns
          </div>

          <div className="company-grid">
            {COMPANIES.map((c) => (
              <div
                key={c}
                className={`company-pill ${
                  activeCompany === c ? "active" : ""
                }`}
                onClick={() => setActiveCompany(c)}
              >
                {c}
                <span className="cp-count">
                  {Math.floor(Math.random() * 200 + 50)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COMPANY ANALYSIS */}
        <div
          className="card card-p"
          style={{
            background: "var(--limebg)",
            borderColor: "rgba(184,255,87,.2)",
          }}
        >
          <div
            style={{
              fontSize: ".68rem",
              color: "var(--lime)",
              fontFamily: "'JetBrains Mono',monospace",
              marginBottom: ".4rem",
            }}
          >
            // {activeCompany} pattern analysis
          </div>

          <MiniBars
            items={[
              { label: "Arrays/Hash", val: 72, color: "var(--lime)" },
              { label: "Trees/BST", val: 68, color: "var(--amber)" },
              { label: "Graphs", val: 55, color: "var(--blue)" },
              { label: "DP", val: 40, color: "var(--pink)" },
            ]}
          />
        </div>
      </div>

      {/* QUESTIONS TABLE */}
      <div className="card">
        <div
          style={{
            padding: "1rem 1.3rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* FILTER TABS */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            {["All", "Unsolved", "Solved"].map((t) => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* SOLVED COUNT */}
          <div
            style={{
              marginLeft: "auto",
              fontSize: ".72rem",
              color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {filtered.filter((q) => q.solved).length}/{filtered.length} solved
          </div>
        </div>

        <table className="q-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Problem</th>
              <th>Difficulty</th>
              <th>Topic</th>
              <th>Company</th>
              <th>Frequency</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((q) => (
              <tr key={q.id}>
                <td
                  style={{
                    color: "var(--muted)",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".7rem",
                  }}
                >
                  {q.id}
                </td>

                <td>
                  <span className="q-link">{q.title}</span>
                </td>

                <td>
                  <span className={`diff-pill ${q.diff}`}>{q.diff}</span>
                </td>

                <td>
                  <span className="q-tag">{q.topic}</span>
                </td>

                <td style={{ fontSize: ".75rem", color: "var(--muted2)" }}>
                  {q.company}
                </td>

                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".4rem",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        maxWidth: 60,
                        height: 4,
                        background: "var(--ink3)",
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          width: `${q.freq}%`,
                          height: "100%",
                          background: "var(--blue)",
                          borderRadius: 2,
                        }}
                      />
                    </div>

                    <span
                      style={{
                        fontSize: ".65rem",
                        color: "var(--muted)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {q.freq}%
                    </span>
                  </div>
                </td>

                <td>
                  <span
                    className={`solved-dot ${q.solved ? "yes" : "no"}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}