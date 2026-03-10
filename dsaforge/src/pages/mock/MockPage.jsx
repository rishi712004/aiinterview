import { useState, useEffect } from "react";
import MiniBars from "../../components/charts/MiniBars";
import { getMockUpcoming, getMockStats, scheduleMock, cancelMock } from "../../services/api";
import LiveInterviewPage from "./LiveInterviewPage";

const TYPES = [
  { icon: "💻", label: "DSA Coding",    sub: "LeetCode style",    value: "dsa" },
  { icon: "🧠", label: "Behavioral",    sub: "STAR method",       value: "behavioral" },
  { icon: "🏗️", label: "System Design", sub: "Architecture",      value: "system_design" },
  { icon: "📋", label: "HR Round",      sub: "Offer negotiation", value: "hr" },
];

const SLOTS = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

const toISO = (dayIndex, slot) => {
  const [time, meridiem] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  const d = new Date();
  d.setDate(d.getDate() + dayIndex);
  d.setHours(h + 1, m, 0, 0);
  return d.toISOString();
};

const isPastSlot = (dayIndex, slot) => {
  if (dayIndex > 0) return false;
  const [time, mer] = slot.split(" ");
  let [h] = time.split(":").map(Number);
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return new Date().getHours() >= h;
};

export default function MockPage() {
  const [selectedDay,  setSelectedDay]  = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedType, setSelectedType] = useState("dsa");
  const [upcoming,     setUpcoming]     = useState([]);
  const [stats,        setStats]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [booking,      setBooking]      = useState(false);
  const [message,      setMessage]      = useState("");
  const [liveInterview, setLiveInterview] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date:  d.getDate(),
      full:  d.toDateString(),
    };
  });

  const load = async () => {
    setLoading(true);
    try {
      const [upRes, stRes] = await Promise.all([getMockUpcoming(), getMockStats()]);
      setUpcoming(upRes.data.sessions || []);
      setStats(stRes.data.stats || []);
    } catch (err) {
      console.error("Mock load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleBook = async () => {
    if (selectedSlot === null) return setMessage("⚠️ Please select a time slot.");
    setBooking(true);
    setMessage("");
    try {
      const scheduled_at = toISO(selectedDay, SLOTS[selectedSlot]);
      await scheduleMock({ type: selectedType, scheduled_at, duration_min: 45 });
      setMessage("✅ Session booked successfully!");
      setSelectedSlot(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelMock(id);
      setMessage("✅ Session cancelled.");
      load();
    } catch (err) {
      setMessage("❌ Could not cancel session.");
    }
  };

  const statBars     = stats.map((s) => ({ label: s.type, val: parseInt(s.avg_score) || 0, color: "var(--lime)" }));
  const totalSessions = stats.reduce((a, s) => a + parseInt(s.completed || 0), 0);
  const avgScore      = stats.length
    ? Math.round(stats.reduce((a, s) => a + (parseInt(s.avg_score) || 0), 0) / stats.length) : 0;

  // ── LIVE INTERVIEW MODE ───────────────────────────────────────────────────
  if (liveInterview) return (
    <LiveInterviewPage
      type={selectedType}
      targetCompany="Google"
      targetRole="Software Engineer"
      onBack={() => setLiveInterview(false)}
    />
  );

  // ── SCHEDULE MODE ─────────────────────────────────────────────────────────
  return (
    <div className="page fade-up">
      <div className="g21">

        <div>
          <div className="card card-p" style={{ marginBottom: "1.2rem" }}>
            <div className="card-title">📅 Schedule Mock Interview</div>

            <div className="schedule-grid">
              {days.map((d, i) => (
                <div key={i} className={`day-cell ${selectedDay === i ? "active" : ""}`}
                  onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}>
                  <div className="day-name">{d.label}</div>
                  <div className="day-num">{d.date}</div>
                </div>
              ))}
            </div>

            <div className="card-title" style={{ marginTop: ".8rem" }}>
              Available Slots — {days[selectedDay]?.full}
            </div>

            <div className="slot-grid">
              {SLOTS.map((s, i) => {
                const past = isPastSlot(selectedDay, s);
                return (
                  <div key={s}
                    className={`slot ${selectedSlot === i && !past ? "booked" : ""}`}
                    onClick={() => !past && setSelectedSlot(i)}
                    style={{ opacity: past ? 0.4 : 1, cursor: past ? "not-allowed" : "pointer" }}>
                    {past ? "🔴 " : selectedSlot === i ? "✅ " : ""}{s}
                  </div>
                );
              })}
            </div>

            {message && (
              <div style={{ marginTop: ".8rem", padding: ".6rem .8rem", borderRadius: 8,
                fontSize: ".78rem", fontFamily: "'JetBrains Mono',monospace",
                background: message.includes("✅") ? "var(--limebg)" : "var(--pinkbg)",
                color: message.includes("✅") ? "var(--lime)" : "var(--pink)" }}>
                {message}
              </div>
            )}

            <button className="btn btn-lime" onClick={handleBook} disabled={booking}
              style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
              {booking ? "Booking..." : "⚡ Book Selected Slot"}
            </button>

            {/* LIVE INTERVIEW BUTTON */}
            <button onClick={() => setLiveInterview(true)}
              style={{ width: "100%", marginTop: ".6rem", padding: ".7rem",
                background: "var(--bluebg)", color: "var(--blue)",
                border: "1px solid rgba(99,179,237,.3)", borderRadius: 8,
                cursor: "pointer", fontWeight: 700, fontSize: ".85rem",
                fontFamily: "'Cabinet Grotesk',sans-serif" }}>
              🤖 Start Live AI Interview Now
            </button>
          </div>

          <div className="card card-p">
            <div className="card-title">🎯 Interview Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
              {TYPES.map((t) => (
                <div key={t.value} className="card" onClick={() => setSelectedType(t.value)}
                  style={{ padding: ".8rem", cursor: "pointer", transition: "border-color .2s",
                    borderColor: selectedType === t.value ? "var(--lime)" : "var(--border)" }}>
                  <div style={{ fontSize: "1.3rem", marginBottom: ".3rem" }}>{t.icon}</div>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, marginBottom: ".15rem" }}>{t.label}</div>
                  <div style={{ fontSize: ".68rem", color: "var(--muted)",
                    fontFamily: "'JetBrains Mono',monospace" }}>{t.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card card-p" style={{ marginBottom: "1.2rem" }}>
            <div className="card-title">⏰ Upcoming Sessions</div>
            {loading ? (
              <div style={{ color: "var(--muted)", fontSize: ".8rem",
                fontFamily: "'JetBrains Mono',monospace" }}>// loading...</div>
            ) : upcoming.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: ".8rem",
                fontFamily: "'JetBrains Mono',monospace", padding: "1rem 0" }}>
                // no upcoming sessions — book one!
              </div>
            ) : (
              upcoming.map((u, i) => (
                <div key={u.id} className="upcoming-session">
                  <div className="us-avatar"
                    style={{ background: ["var(--bluebg)","var(--limebg)","var(--pinkbg)"][i % 3] }}>
                    {u.type === "dsa" ? "💻" : u.type === "behavioral" ? "🧠" : u.type === "system_design" ? "🏗️" : "📋"}
                  </div>
                  <div className="us-info">
                    <div className="us-name">{TYPES.find(t => t.value === u.type)?.label || u.type}</div>
                    <div className="us-meta">{u.duration_min} min · {u.status}</div>
                  </div>
                  <div className="us-time">
                    {new Date(u.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                    {new Date(u.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <button onClick={() => handleCancel(u.id)}
                    style={{ background: "none", border: "none", color: "var(--pink)",
                      cursor: "pointer", fontSize: ".7rem", marginLeft: ".5rem" }}>✕</button>
                </div>
              ))
            )}
          </div>

          <div className="card card-p">
            <div className="card-title">📊 Mock Interview Stats</div>
            {statBars.length > 0 ? <MiniBars items={statBars} /> : (
              <div style={{ color: "var(--muted)", fontSize: ".78rem",
                fontFamily: "'JetBrains Mono',monospace", padding: ".5rem 0" }}>
                // complete sessions to see stats
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", padding: ".8rem",
              background: "var(--ink3)", borderRadius: 10 }}>
              {[[totalSessions, "Sessions"], [`${avgScore}%`, "Avg Score"], [upcoming.length, "Upcoming"]].map(([v, l]) => (
                <div key={l} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900,
                    letterSpacing: "-.04em", color: "var(--lime)" }}>{v}</div>
                  <div style={{ fontSize: ".62rem", color: "var(--muted)",
                    fontFamily: "'JetBrains Mono',monospace" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
