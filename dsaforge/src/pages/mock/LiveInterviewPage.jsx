import { useState, useEffect, useRef } from "react";
import api from "../../services/api";

const RECOMMENDATION_CONFIG = {
  "Strong Yes": { color: "var(--lime)",  icon: "🌟" },
  "Yes":        { color: "var(--lime)",  icon: "✅" },
  "Maybe":      { color: "var(--amber)", icon: "🤔" },
  "No":         { color: "var(--pink)",  icon: "❌" },
};

export default function LiveInterviewPage({ type, targetCompany, targetRole, onBack }) {
  const [phase,          setPhase]          = useState("starting"); // starting | interview | finished
  const [sessionId,      setSessionId]      = useState(null);
  const [question,       setQuestion]       = useState("");
  const [questionNum,    setQuestionNum]    = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [tip,            setTip]            = useState(null);
  const [answer,         setAnswer]         = useState("");
  const [feedback,       setFeedback]       = useState(null);
  const [history,        setHistory]        = useState([]);
  const [scores,         setScores]         = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [report,         setReport]         = useState(null);
  const [transcript,     setTranscript]     = useState([]);
  const [timer,          setTimer]          = useState(0);
  const bottomRef = useRef(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, feedback]);

  // Start interview
  useEffect(() => {
    const start = async () => {
      setLoading(true);
      try {
        const { data } = await api.post("/interview/start", {
          type, target_company: targetCompany, target_role: targetRole,
        });
        setSessionId(data.session_id);
        setQuestion(data.question);
        setQuestionNum(data.question_number);
        setTotalQuestions(data.total_questions);
        setTip(data.tip);
        setHistory(data.history);
        setTranscript([{ role: "interviewer", content: data.question, tip: data.tip }]);
        setPhase("interview");
      } catch (err) {
        console.error("Start error:", err);
      } finally {
        setLoading(false);
      }
    };
    start();
  }, []);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || loading) return;
    const myAnswer = answer.trim();
    setAnswer("");
    setLoading(true);
    setFeedback(null);

    // Add to transcript
    setTranscript(prev => [...prev, { role: "candidate", content: myAnswer }]);

    try {
      const { data } = await api.post("/interview/answer", {
        session_id: sessionId, answer: myAnswer,
        history, question_number: questionNum,
        total_questions: totalQuestions, type,
      });

      setScores(prev => [...prev, data.score]);
      setHistory(data.history);

      // Add feedback to transcript
      setTranscript(prev => [...prev,
        { role: "feedback", content: data.feedback, score: data.score }
      ]);

      if (data.is_complete) {
        // Get final report
        const { data: finishData } = await api.post("/interview/finish", {
          session_id: sessionId,
          scores:     [...scores, data.score],
          type, history: data.history,
        });
        setReport(finishData);
        setPhase("finished");
      } else {
        setQuestion(data.next_question);
        setQuestionNum(data.question_number);
        setTip(data.tip);
        setTranscript(prev => [...prev,
          { role: "interviewer", content: data.next_question, tip: data.tip }
        ]);
      }
    } catch (err) {
      console.error("Answer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const scoreColor = (s) => s >= 70 ? "var(--lime)" : s >= 40 ? "var(--amber)" : "var(--pink)";

  // ── STARTING ─────────────────────────────────────────────────────────────
  if (phase === "starting") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "3rem" }}>🤖</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", color: "var(--lime)",
        fontSize: ".9rem" }}>// preparing your interview...</div>
      <div style={{ color: "var(--muted)", fontSize: ".78rem" }}>
        {targetCompany} · {targetRole}
      </div>
    </div>
  );

  // ── FINISHED ──────────────────────────────────────────────────────────────
  if (phase === "finished" && report) {
    const rec    = report.report?.recommendation || "Yes";
    const recCfg = RECOMMENDATION_CONFIG[rec] || RECOMMENDATION_CONFIG["Yes"];
    return (
      <div className="page fade-up">
        {/* SCORE BANNER */}
        <div style={{ background: "linear-gradient(135deg, var(--ink2), var(--ink3))",
          border: "1px solid var(--border)", borderRadius: 16,
          padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", fontWeight: 900,
            color: scoreColor(report.overall_score), letterSpacing: "-.04em",
            marginBottom: ".3rem" }}>{report.overall_score}</div>
          <div style={{ fontSize: ".8rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace", marginBottom: "1rem" }}>
            // overall score · {formatTime(timer)} · {scores.length} questions
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem",
            padding: ".5rem 1.2rem", borderRadius: 20,
            background: `${recCfg.color}15`,
            border: `1px solid ${recCfg.color}40` }}>
            <span>{recCfg.icon}</span>
            <span style={{ fontWeight: 700, color: recCfg.color }}>{rec}</span>
          </div>
        </div>

        <div className="g12">
          {/* REPORT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div className="card card-p">
              <div className="card-title">📋 Interview Summary</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted2)", lineHeight: 1.8 }}>
                {report.report?.summary}
              </div>
              {report.report?.recommendation_reason && (
                <div style={{ marginTop: ".8rem", padding: ".7rem",
                  background: `${recCfg.color}10`,
                  border: `1px solid ${recCfg.color}30`,
                  borderRadius: 8, fontSize: ".78rem", color: "var(--muted2)" }}>
                  {report.report.recommendation_reason}
                </div>
              )}
            </div>

            <div className="card card-p">
              <div className="card-title">💪 Strengths</div>
              {report.report?.strengths?.map((s, i) => (
                <div key={i} style={{ padding: ".4rem .8rem", marginBottom: ".4rem",
                  borderLeft: "2px solid var(--lime)", fontSize: ".8rem",
                  color: "var(--muted2)" }}>✓ {s}</div>
              ))}
            </div>

            <div className="card card-p">
              <div className="card-title">📈 Areas to Improve</div>
              {report.report?.improvements?.map((s, i) => (
                <div key={i} style={{ padding: ".4rem .8rem", marginBottom: ".4rem",
                  borderLeft: "2px solid var(--amber)", fontSize: ".8rem",
                  color: "var(--muted2)" }}>→ {s}</div>
              ))}
            </div>
          </div>

          {/* TRANSCRIPT */}
          <div className="card card-p">
            <div className="card-title">📜 Interview Transcript</div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {transcript.map((t, i) => (
                <div key={i} style={{ marginBottom: "1rem",
                  padding: ".7rem", borderRadius: 8,
                  background: t.role === "candidate" ? "var(--limebg)"
                            : t.role === "feedback"  ? "var(--bluebg)"
                            : "var(--ink3)",
                  border: `1px solid ${t.role === "candidate" ? "rgba(184,255,87,.15)"
                          : t.role === "feedback" ? "rgba(99,179,237,.15)"
                          : "var(--border)"}` }}>
                  <div style={{ fontSize: ".62rem", color: "var(--muted)",
                    fontFamily: "'JetBrains Mono',monospace", marginBottom: ".3rem" }}>
                    {t.role === "interviewer" ? "🤖 interviewer"
                   : t.role === "candidate"  ? "👤 you"
                   : `💬 feedback (score: ${t.score})`}
                  </div>
                  <div style={{ fontSize: ".78rem", color: "var(--muted2)", lineHeight: 1.6 }}>
                    {t.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <button className="btn btn-ghost" onClick={onBack}
            style={{ justifyContent: "center" }}>← Back to Mock</button>
          <button className="btn btn-lime" onClick={() => window.location.reload()}
            style={{ justifyContent: "center" }}>🔄 Start New Interview</button>
        </div>
      </div>
    );
  }

  // ── INTERVIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="page fade-up" style={{ maxWidth: 760, margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem",
        marginBottom: "1.2rem", flexWrap: "wrap" }}>
        <button className="btn btn-ghost" onClick={onBack}
          style={{ padding: ".3rem .7rem", fontSize: ".75rem" }}>← Exit</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: ".68rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace" }}>
            // {targetCompany} · {targetRole}
          </div>
        </div>
        <div style={{ display: "flex", gap: ".8rem", alignItems: "center" }}>
          {/* PROGRESS */}
          <div style={{ fontSize: ".72rem", color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace" }}>
            Q{questionNum}/{totalQuestions}
          </div>
          {/* TIMER */}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem",
            color: "var(--amber)" }}>⏱ {formatTime(timer)}</div>
          {/* AVG SCORE */}
          {scores.length > 0 && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem",
              color: scoreColor(avgScore) }}>★ {avgScore}</div>
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ height: 3, background: "var(--ink3)", borderRadius: 2,
        marginBottom: "1.5rem" }}>
        <div style={{ height: "100%", background: "var(--lime)", borderRadius: 2,
          width: `${((questionNum - 1) / totalQuestions) * 100}%`,
          transition: "width .5s ease" }} />
      </div>

      {/* TRANSCRIPT */}
      <div style={{ marginBottom: "1.2rem", display: "flex",
        flexDirection: "column", gap: ".8rem" }}>
        {transcript.map((t, i) => (
          <div key={i} style={{
            display: "flex", gap: ".8rem",
            flexDirection: t.role === "candidate" ? "row-reverse" : "row",
            alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: t.role === "candidate" ? "var(--limebg)"
                        : t.role === "feedback"  ? "var(--bluebg)" : "var(--ink3)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: ".9rem" }}>
              {t.role === "interviewer" ? "🤖"
             : t.role === "candidate"  ? "👤" : "💬"}
            </div>
            <div style={{ maxWidth: "75%", padding: ".8rem 1rem", borderRadius: 12,
              background: t.role === "candidate" ? "var(--limebg)"
                        : t.role === "feedback"  ? "var(--bluebg)" : "var(--ink2)",
              border: `1px solid ${t.role === "candidate" ? "rgba(184,255,87,.2)"
                      : t.role === "feedback" ? "rgba(99,179,237,.2)" : "var(--border)"}` }}>
              {t.role === "feedback" && (
                <div style={{ fontSize: ".62rem", color: "var(--blue)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: ".3rem" }}>
                  // feedback · score: {t.score}/100
                </div>
              )}
              {t.tip && (
                <div style={{ fontSize: ".65rem", color: "var(--amber)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem" }}>
                  💡 {t.tip}
                </div>
              )}
              <div style={{ fontSize: ".82rem", color: "var(--muted2)", lineHeight: 1.7 }}>
                {t.content}
              </div>
            </div>
          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div style={{ display: "flex", gap: ".8rem", alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: "var(--ink3)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
            <div style={{ padding: ".8rem 1rem", borderRadius: 12,
              background: "var(--ink2)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: ".3rem", alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%",
                    background: "var(--lime)", opacity: .5,
                    animation: `pulse ${0.8 + i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ANSWER BOX */}
      {phase === "interview" && !loading && (
        <div style={{ position: "sticky", bottom: 0, background: "var(--ink1)",
          paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here... (be specific and structured)"
            rows={4}
            onKeyDown={e => {
              if (e.key === "Enter" && e.metaKey) handleSubmitAnswer();
            }}
            style={{ width: "100%", boxSizing: "border-box", padding: ".8rem",
              background: "var(--ink2)", border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--fg)", fontSize: ".82rem",
              fontFamily: "'Cabinet Grotesk',sans-serif", resize: "none",
              lineHeight: 1.6, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "var(--lime)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginTop: ".5rem" }}>
            <div style={{ fontSize: ".65rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace" }}>
              ⌘+Enter to submit · {answer.length} chars
            </div>
            <button className="btn btn-lime" onClick={handleSubmitAnswer}
              disabled={!answer.trim() || loading}
              style={{ justifyContent: "center", padding: ".5rem 1.2rem",
                opacity: !answer.trim() ? .5 : 1 }}>
              {questionNum === totalQuestions ? "🏁 Finish Interview" : "Submit Answer →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
