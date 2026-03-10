import { useState, useEffect } from "react";
import MiniBars from "../../components/charts/MiniBars";
import { getQuestions, getCompanyPattern } from "../../services/api";
import CodeEditorPage from "./CodeEditorPage";

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Flipkart"];

const TOPICS = [
  "All", "Arrays", "Two Pointers", "Sliding Window", "Stack", "Binary Search",
  "Linked List", "Trees", "Graphs", "DP", "Heap", "Tries", "Greedy", "Bit Manipulation"
];

export default function QuestionsPage() {
  const [activeCompany, setActiveCompany] = useState("Google");
  const [tab,           setTab]           = useState("All");
  const [topic,         setTopic]         = useState("All");
  const [search,        setSearch]        = useState("");
  const [questions,     setQuestions]     = useState([]);
  const [pattern,       setPattern]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [openQuestion,  setOpenQuestion]  = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (topic !== "All") params.topic = topic;
        const { data } = await getQuestions(params);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error("Questions load error:", err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, topic]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCompanyPattern(activeCompany);
        setPattern(data.pattern || []);
      } catch (err) {
        console.error("Pattern load error:", err);
      }
    };
    load();
  }, [activeCompany]);

  if (openQuestion) {
    return <CodeEditorPage questionId={openQuestion} onBack={() => setOpenQuestion(null)} />;
  }

  const filtered = questions.filter((q) => {
    if (tab === "Easy")   return q.difficulty === "easy";
    if (tab === "Medium") return q.difficulty === "medium";
    if (tab === "Hard")   return q.difficulty === "hard";
    return true;
  });

  const patternBars = pattern.slice(0, 5).map((p) => ({
    label: p.topic, val: parseInt(p.pct) || 0, color: "var(--lime)",
  }));

  return (
    <div className="page fade-up">

      <div className="g21" style={{ marginBottom: "1.2rem", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: ".7rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase",
            letterSpacing: ".1em", marginBottom: ".6rem" }}>
            🏢 Company-Specific Question Patterns
          </div>
          <div className="company-grid">
            {COMPANIES.map((c) => (
              <div key={c} className={`company-pill ${activeCompany === c ? "active" : ""}`}
                onClick={() => setActiveCompany(c)}>{c}</div>
            ))}
          </div>
        </div>

        <div className="card card-p" style={{ background: "var(--limebg)", borderColor: "rgba(184,255,87,.2)" }}>
          <div style={{ fontSize: ".68rem", color: "var(--lime)",
            fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem" }}>
            // {activeCompany} pattern analysis
          </div>
          {patternBars.length > 0 ? <MiniBars items={patternBars} /> : (
            <div style={{ fontSize: ".75rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace", padding: "1rem 0" }}>
              // no pattern data yet
            </div>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: ".8rem" }}>
        <input placeholder="🔍 Search questions..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: ".65rem 1rem", boxSizing: "border-box",
            background: "var(--ink3)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--fg)", fontSize: ".85rem",
            outline: "none" }} />
      </div>

      {/* TOPIC FILTER CHIPS */}
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {TOPICS.map((t) => (
          <button key={t} onClick={() => setTopic(t)}
            style={{ padding: ".3rem .8rem", borderRadius: 20, cursor: "pointer",
              fontSize: ".72rem", fontFamily: "'JetBrains Mono',monospace",
              border: `1px solid ${topic === t ? "var(--lime)" : "var(--border)"}`,
              background: topic === t ? "var(--limebg)" : "var(--ink3)",
              color: topic === t ? "var(--lime)" : "var(--muted)",
              fontWeight: topic === t ? 700 : 400,
              transition: "all .15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="card">
        <div style={{ padding: "1rem 1.3rem", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {["All", "Easy", "Medium", "Hard"].map((t) => (
              <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: ".72rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace" }}>
            {filtered.length} questions
            {topic !== "All" && (
              <span style={{ marginLeft: ".5rem", color: "var(--lime)" }}>
                · {topic}
                <button onClick={() => setTopic("All")}
                  style={{ background: "none", border: "none", color: "var(--pink)",
                    cursor: "pointer", marginLeft: ".3rem", fontSize: ".7rem" }}>✕</button>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem" }}>
            // loading questions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem" }}>
            // no questions found — try a different filter
          </div>
        ) : (
          <table className="q-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Topic</th>
                <th>Companies</th>
                <th>Frequency</th>
                <th>Solve</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".7rem" }}>{q.id}</td>
                  <td>
                    <span className="q-link" onClick={() => setOpenQuestion(q.slug)}
                      style={{ cursor: "pointer" }}>{q.title}</span>
                  </td>
                  <td><span className={`diff-pill ${q.difficulty}`}>{q.difficulty}</span></td>
                  <td>
                    <span className="q-tag" onClick={() => setTopic(q.topic)}
                      style={{ cursor: "pointer" }}
                      title={`Filter by ${q.topic}`}>
                      {q.topic}
                    </span>
                  </td>
                  <td style={{ fontSize: ".72rem", color: "var(--muted2)" }}>
                    {q.companies?.slice(0, 2).join(", ")}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                      <div style={{ flex: 1, maxWidth: 60, height: 4,
                        background: "var(--ink3)", borderRadius: 2 }}>
                        <div style={{ width: `${q.frequency}%`, height: "100%",
                          background: "var(--blue)", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: ".65rem", color: "var(--muted)",
                        fontFamily: "'JetBrains Mono',monospace" }}>{q.frequency}%</span>
                    </div>
                  </td>
                  <td>
                    <button onClick={() => setOpenQuestion(q.slug)}
                      style={{ background: "var(--limebg)", border: "1px solid rgba(184,255,87,.3)",
                        borderRadius: 6, color: "var(--lime)", cursor: "pointer",
                        padding: ".25rem .7rem", fontSize: ".7rem",
                        fontFamily: "'JetBrains Mono',monospace" }}>
                      Solve →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
