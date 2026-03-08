import { useState } from "react";
import MiniBars from "../../components/charts/MiniBars";
import { UPCOMING } from "../../data/mock";

export default function MockPage() {
  const [selectedDay, setSelectedDay] = useState(2);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [10, 11, 12, 13, 14, 15, 16];

  const slots = [
    "9:00 AM",
    "10:30 AM",
    "12:00 PM",
    "2:00 PM",
    "4:00 PM",
    "6:00 PM",
  ];

  const booked = [1, 4];

  return (
    <div className="page fade-up">
      <div className="g21">

        {/* LEFT SIDE */}
        <div>
          <div className="card card-p" style={{ marginBottom: "1.2rem" }}>
            <div className="card-title">📅 Schedule Mock Interview</div>

            <div className="schedule-grid">
              {days.map((d, i) => (
                <div
                  key={d}
                  className={`day-cell ${
                    selectedDay === i ? "active" : ""
                  } ${i === 1 || i === 4 ? "has-slot" : ""}`}
                  onClick={() => setSelectedDay(i)}
                >
                  <div className="day-name">{d}</div>
                  <div className="day-num">{dates[i]}</div>
                </div>
              ))}
            </div>

            <div className="card-title" style={{ marginTop: ".8rem" }}>
              Available Slots — Mar {dates[selectedDay]}
            </div>

            <div className="slot-grid">
              {slots.map((s, i) => (
                <div
                  key={s}
                  className={`slot ${booked.includes(i) ? "booked" : ""}`}
                >
                  {booked.includes(i) ? "🔴 " : ""}
                  {s}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: ".8rem", marginTop: "1rem" }}>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
              >
                ⚡ Book Selected Slot
              </button>
            </div>
          </div>

          {/* INTERVIEW TYPES */}
          <div className="card card-p">
            <div className="card-title">🎯 Interview Type Selection</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: ".7rem",
              }}
            >
              {[
                { icon: "💻", label: "DSA Coding", sub: "LeetCode style" },
                { icon: "🧠", label: "Behavioral", sub: "STAR method" },
                { icon: "🏗️", label: "System Design", sub: "Architecture" },
                { icon: "📋", label: "HR Round", sub: "Offer negotiation" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="card"
                  style={{
                    padding: ".8rem",
                    cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--lime)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: ".3rem" }}>
                    {t.icon}
                  </div>

                  <div
                    style={{
                      fontSize: ".82rem",
                      fontWeight: 700,
                      marginBottom: ".15rem",
                    }}
                  >
                    {t.label}
                  </div>

                  <div
                    style={{
                      fontSize: ".68rem",
                      color: "var(--muted)",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {t.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <div className="card card-p" style={{ marginBottom: "1.2rem" }}>
            <div className="card-title">⏰ Upcoming Sessions</div>

            {UPCOMING.map((u, i) => (
              <div key={i} className="upcoming-session">
                <div
                  className="us-avatar"
                  style={{
                    background: [
                      "var(--bluebg)",
                      "var(--limebg)",
                      "var(--pinkbg)",
                    ][i],
                  }}
                >
                  {u.emoji}
                </div>

                <div className="us-info">
                  <div className="us-name">{u.name}</div>
                  <div className="us-meta">{u.meta}</div>
                </div>

                <div className="us-time">{u.time}</div>
              </div>
            ))}
          </div>

          {/* STATS */}
          <div className="card card-p">
            <div className="card-title">📊 Mock Interview Stats</div>

            <MiniBars
              items={[
                { label: "DSA", val: 74, color: "var(--lime)" },
                { label: "Behavioral", val: 82, color: "var(--blue)" },
                { label: "Sys Design", val: 55, color: "var(--amber)" },
                { label: "HR Round", val: 91, color: "var(--lime)" },
              ]}
            />

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem",
                padding: ".8rem",
                background: "var(--ink3)",
                borderRadius: 10,
              }}
            >
              {[["12", "Sessions"], ["78%", "Avg Score"], ["4", "Offers"]].map(
                ([v, l]) => (
                  <div key={l} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 900,
                        letterSpacing: "-.04em",
                        color: "var(--lime)",
                      }}
                    >
                      {v}
                    </div>

                    <div
                      style={{
                        fontSize: ".62rem",
                        color: "var(--muted)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {l}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}