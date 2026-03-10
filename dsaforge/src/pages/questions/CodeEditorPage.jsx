import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import api from "../../services/api";
import Discussion from "../../components/Discussion";

const LANGUAGES = ["javascript", "python", "java", "cpp", "typescript"];

const STARTER_CODE = {
  javascript: `/**
 * Write your solution here
 */
function solution(nums, target) {
  // your code
}`,
  python: `class Solution:
    def solution(self, nums, target):
        # your code
        pass`,
  java: `class Solution {
    public int[] solution(int[] nums, int target) {
        // your code
        return new int[]{};
    }
}`,
  cpp: `class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // your code
        return {};
    }
};`,
  typescript: `function solution(nums: number[], target: number): number[] {
    // your code
    return [];
}`,
};

export default function CodeEditorPage({ questionId, onBack }) {
  const [question, setQuestion]       = useState(null);
  const [language, setLanguage]       = useState("javascript");
  const [code, setCode]               = useState(STARTER_CODE.javascript);
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState("description");
  const [timer, setTimer]             = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/questions/${questionId}`);
        setQuestion(data.question);
      } catch (err) {
        console.error("Failed to load question:", err);
      }
    };
    if (questionId) load();
  }, [questionId]);

  useEffect(() => {
    let interval;
    if (timerActive) interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang]);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return setError("Please write some code first.");
    setSubmitting(true);
    setTimerActive(false);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/sessions/submit", {
        question_id: question.slug,
        code, language,
        time_taken: timer,
      });
      setResult(data);
      setActiveTab("result");
    } catch (err) {
      setError(err.response?.data?.error || "❌ Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = (s) => s >= 70 ? "var(--lime)" : s >= 40 ? "var(--amber)" : "var(--pink)";
  const diffColor  = (d) => d === "easy" ? "var(--lime)" : d === "medium" ? "var(--amber)" : "var(--pink)";

  if (!question) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace" }}>
      // loading question...
    </div>
  );

  const exec = result?.execution;
  const fb   = result?.feedback;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem",
        padding: ".7rem 1.2rem", background: "var(--ink2)",
        borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none",
          border: "1px solid var(--border)", borderRadius: 6,
          color: "var(--muted)", cursor: "pointer", padding: ".3rem .7rem", fontSize: ".75rem" }}>
          ← Back
        </button>
        <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{question.title}</div>
        <span style={{ fontSize: ".72rem", fontWeight: 700, padding: ".2rem .6rem",
          borderRadius: 20, background: "var(--ink3)", color: diffColor(question.difficulty) }}>
          {question.difficulty}
        </span>
        <span style={{ fontSize: ".72rem", color: "var(--muted)",
          fontFamily: "'JetBrains Mono',monospace", background: "var(--ink3)",
          padding: ".2rem .6rem", borderRadius: 6 }}>
          {question.topic}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".85rem",
            color: timer > 1800 ? "var(--pink)" : "var(--muted)" }}>
            ⏱ {formatTime(timer)}
          </div>
          <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}
            style={{ background: "var(--ink3)", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--fg)", padding: ".3rem .6rem",
              fontSize: ".78rem", cursor: "pointer" }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button className="btn btn-lime" onClick={handleSubmit} disabled={submitting}
            style={{ justifyContent: "center", padding: ".4rem 1.2rem" }}>
            {submitting ? "⏳ Running..." : "▶ Run & Submit"}
          </button>
        </div>
      </div>

      {/* MAIN SPLIT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT PANEL */}
        <div style={{ width: "45%", borderRight: "1px solid var(--border)",
          overflow: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>

          {/* TABS */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)",
            background: "var(--ink2)", flexShrink: 0, overflowX: "auto" }}>
            {["desc", "hints", "result", "discuss"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: ".6rem .5rem", background: "none", border: "none",
                  borderBottom: activeTab === t ? "2px solid var(--lime)" : "2px solid transparent",
                  color: activeTab === t ? "var(--lime)" : "var(--muted)",
                  cursor: "pointer", fontSize: ".65rem",
                  fontFamily: "'JetBrains Mono',monospace",
                  letterSpacing: "0" }}>
                {t}
                {t === "result" && result && (
                  <span style={{ marginLeft: ".3rem", padding: ".1rem .35rem",
                    borderRadius: 10, fontSize: ".6rem",
                    background: scoreColor(result.score),
                    color: "var(--ink1)", fontWeight: 800 }}>
                    {result.score}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ padding: "1.2rem", flex: 1, overflow: "auto" }}>

            {/* DESCRIPTION */}
            {activeTab === "description" && (
              <div>
                <div style={{ fontSize: ".85rem", lineHeight: 1.8,
                  color: "var(--muted2)", marginBottom: "1.2rem" }}>
                  {question.description}
                </div>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  {question.tags?.map(tag => (
                    <span key={tag} style={{ padding: ".2rem .6rem", borderRadius: 20,
                      background: "var(--ink3)", border: "1px solid var(--border)",
                      fontSize: ".65rem", color: "var(--muted)",
                      fontFamily: "'JetBrains Mono',monospace" }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "1rem", padding: ".8rem",
                  background: "var(--ink3)", borderRadius: 8, fontSize: ".75rem" }}>
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: ".2rem" }}>Frequency</div>
                    <div style={{ color: "var(--blue)", fontWeight: 700 }}>{question.frequency}%</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: ".2rem" }}>Acceptance</div>
                    <div style={{ color: "var(--lime)", fontWeight: 700 }}>{question.acceptance}%</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: ".2rem" }}>Asked by</div>
                    <div style={{ color: "var(--amber)", fontWeight: 700 }}>
                      {question.companies?.slice(0, 2).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HINTS */}
            {activeTab === "hints" && (
              <div>
                {question.hints?.length > 0 ? question.hints.map((h, i) => (
                  <div key={i} style={{ padding: ".8rem 1rem", marginBottom: ".6rem",
                    background: "var(--limebg)", border: "1px solid rgba(184,255,87,.15)",
                    borderRadius: 8, fontSize: ".8rem", color: "var(--muted2)", lineHeight: 1.6 }}>
                    <span style={{ color: "var(--lime)", fontFamily: "'JetBrains Mono',monospace",
                      fontSize: ".7rem", marginRight: ".5rem" }}>// hint {i + 1}</span>
                    {h}
                  </div>
                )) : (
                  <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".8rem" }}>// no hints available for this problem</div>
                )}
              </div>
            )}

            {/* RESULT */}
            {activeTab === "result" && (
              <div>
                {error && (
                  <div style={{ padding: ".8rem", borderRadius: 8, marginBottom: "1rem",
                    background: "var(--pinkbg)", border: "1px solid var(--pink)",
                    fontSize: ".78rem", color: "var(--pink)",
                    fontFamily: "'JetBrains Mono',monospace" }}>{error}</div>
                )}
                {!result && !error && (
                  <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".8rem" }}>// click "Run & Submit" to see results</div>
                )}
                {result && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem",
                      padding: "1rem", borderRadius: 10, marginBottom: "1rem",
                      background: result.score >= 70 ? "var(--limebg)"
                               : result.score >= 40 ? "rgba(255,181,71,.1)" : "var(--pinkbg)",
                      border: `1px solid ${scoreColor(result.score)}30` }}>
                      <div style={{ fontSize: "2.5rem", fontWeight: 900,
                        color: scoreColor(result.score), letterSpacing: "-.04em" }}>
                        {result.score}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: ".2rem",
                          color: scoreColor(result.score) }}>
                          {result.status === "solved" ? "✅ Solved!"
                         : result.status === "attempted" ? "🟡 Attempted" : "❌ Needs Work"}
                        </div>
                        <div style={{ fontSize: ".72rem", color: "var(--muted)",
                          fontFamily: "'JetBrains Mono',monospace" }}>
                          ⏱ {formatTime(timer)} · {language}
                        </div>
                      </div>
                    </div>

                    {exec?.test_cases?.length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: ".7rem", color: "var(--muted)",
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: ".5rem",
                          display: "flex", justifyContent: "space-between" }}>
                          <span>// test cases</span>
                          <span style={{ color: exec.tests_passed === exec.tests_total
                            ? "var(--lime)" : "var(--amber)" }}>
                            {exec.tests_passed}/{exec.tests_total} passed
                          </span>
                        </div>
                        {exec.test_cases.map((tc, i) => (
                          <div key={i} style={{ marginBottom: ".5rem", borderRadius: 8,
                            border: `1px solid ${tc.passed ? "rgba(184,255,87,.2)" : "rgba(255,95,143,.2)"}`,
                            overflow: "hidden" }}>
                            <div style={{ padding: ".4rem .8rem",
                              background: tc.passed ? "var(--limebg)" : "var(--pinkbg)",
                              display: "flex", justifyContent: "space-between",
                              fontSize: ".7rem", fontFamily: "'JetBrains Mono',monospace" }}>
                              <span>Test {i + 1}</span>
                              <span style={{ color: tc.passed ? "var(--lime)" : "var(--pink)" }}>
                                {tc.passed ? "✓ PASS" : "✗ FAIL"}
                              </span>
                            </div>
                            <div style={{ padding: ".6rem .8rem", background: "var(--ink3)",
                              fontSize: ".7rem", fontFamily: "'JetBrains Mono',monospace",
                              color: "var(--muted2)", lineHeight: 1.8 }}>
                              <div>Input: <span style={{ color: "var(--fg)" }}>{tc.input}</span></div>
                              <div>Expected: <span style={{ color: "var(--lime)" }}>{tc.expected}</span></div>
                              {!tc.passed && (
                                <div>Got: <span style={{ color: "var(--pink)" }}>{tc.actual}</span></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {exec?.stderr && (
                      <div style={{ marginBottom: "1rem", padding: ".8rem",
                        background: "var(--pinkbg)", borderRadius: 8,
                        border: "1px solid rgba(255,95,143,.2)" }}>
                        <div style={{ fontSize: ".65rem", color: "var(--pink)",
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: ".3rem" }}>
                          // {exec.error_type || "error"}
                          {exec.error_line ? ` on line ${exec.error_line}` : ""}
                        </div>
                        <div style={{ fontSize: ".75rem", color: "var(--pink)",
                          fontFamily: "'JetBrains Mono',monospace" }}>{exec.stderr}</div>
                      </div>
                    )}

                    {fb?.time_complexity && (
                      <div style={{ display: "flex", gap: ".8rem", marginBottom: "1rem" }}>
                        {[
                          { label: "Time",  val: fb.time_complexity  },
                          { label: "Space", val: fb.space_complexity },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ flex: 1, padding: ".6rem .8rem",
                            background: "var(--ink3)", borderRadius: 8, textAlign: "center" }}>
                            <div style={{ fontSize: ".65rem", color: "var(--muted)",
                              fontFamily: "'JetBrains Mono',monospace", marginBottom: ".2rem" }}>
                              {label} Complexity
                            </div>
                            <div style={{ fontSize: ".85rem", fontWeight: 700,
                              color: "var(--blue)", fontFamily: "'JetBrains Mono',monospace" }}>
                              {val}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {fb?.summary && (
                      <div style={{ fontSize: ".78rem", color: "var(--muted2)", lineHeight: 1.7,
                        marginBottom: "1rem", padding: ".8rem", background: "var(--ink3)",
                        borderRadius: 8 }}>{fb.summary}</div>
                    )}

                    {fb?.strengths?.length > 0 && (
                      <div style={{ marginBottom: ".8rem" }}>
                        <div style={{ fontSize: ".7rem", color: "var(--lime)",
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem" }}>
                          // strengths
                        </div>
                        {fb.strengths.map((s, i) => (
                          <div key={i} style={{ fontSize: ".76rem", color: "var(--muted2)",
                            padding: ".4rem .8rem", marginBottom: ".3rem",
                            borderLeft: "2px solid var(--lime)" }}>✓ {s}</div>
                        ))}
                      </div>
                    )}

                    {fb?.improvements?.length > 0 && (
                      <div style={{ marginBottom: ".8rem" }}>
                        <div style={{ fontSize: ".7rem", color: "var(--amber)",
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem" }}>
                          // improvements
                        </div>
                        {fb.improvements.map((s, i) => (
                          <div key={i} style={{ fontSize: ".76rem", color: "var(--muted2)",
                            padding: ".4rem .8rem", marginBottom: ".3rem",
                            borderLeft: "2px solid var(--amber)" }}>→ {s}</div>
                        ))}
                      </div>
                    )}

                    {fb?.optimal_approach && (
                      <div style={{ padding: ".8rem", borderRadius: 8,
                        background: "var(--bluebg)", border: "1px solid rgba(99,179,237,.2)" }}>
                        <div style={{ fontSize: ".65rem", color: "var(--blue)",
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: ".3rem" }}>
                          // optimal approach
                        </div>
                        <div style={{ fontSize: ".76rem", color: "var(--muted2)", lineHeight: 1.6 }}>
                          {fb.optimal_approach}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DISCUSS */}
            {activeTab === "discuss" && (
              <Discussion questionId={question?.id} currentUser={currentUser} />
            )}

          </div>
        </div>

        {/* RIGHT — EDITOR */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderLineHighlight: "all",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
