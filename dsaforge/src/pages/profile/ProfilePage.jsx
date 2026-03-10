import { useState } from "react";
import api from "../../services/api";

const ROLES = [
  "Full Stack Developer", "Frontend Engineer", "Backend Engineer",
  "SDE-1", "SDE-2", "SDE-3", "Staff Engineer", "Data Engineer",
  "ML Engineer", "DevOps Engineer", "Mobile Engineer"
];

const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix",
  "Flipkart", "Razorpay", "Swiggy", "Zomato", "CRED", "Stripe",
  "Uber", "Airbnb", "Goldman Sachs", "Morgan Stanley"
];

export default function ProfilePage({ user, onUpdate }) {
  const [form, setForm] = useState({
    name:           user?.name           || "",
    target_role:    user?.target_role    || "Full Stack Developer",
    target_company: user?.target_company || "Google",
  });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { data } = await api.put("/auth/profile", form);
      localStorage.setItem("user", JSON.stringify({ ...user, ...data.user }));
      onUpdate(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase() || "U";

  const stats = [
    { label: "Plan",          val: user?.plan === "pro" ? "⭐ Pro" : "Free", color: user?.plan === "pro" ? "var(--lime)" : "var(--muted)" },
    { label: "Streak",        val: `🔥 ${user?.streak || 0} days`,           color: "var(--amber)" },
    { label: "Target Role",   val: user?.target_role || "—",                 color: "var(--blue)"  },
    { label: "Target Company",val: user?.target_company || "—",              color: "var(--pink)"  },
  ];

  return (
    <div className="page fade-up">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* PROFILE HEADER CARD */}
        <div style={{
          background: "linear-gradient(135deg, var(--ink2) 0%, var(--ink3) 100%)",
          border: "1px solid var(--border)", borderRadius: 16,
          padding: "2rem", marginBottom: "1.5rem",
          display: "flex", alignItems: "center", gap: "1.5rem"
        }}>
          {/* AVATAR */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--limebg)", border: "3px solid var(--lime)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem", fontWeight: 900, color: "var(--lime)",
            flexShrink: 0
          }}>
            {initials}
          </div>

          {/* INFO */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: ".2rem" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: ".78rem", color: "var(--muted)",
              fontFamily: "'JetBrains Mono',monospace", marginBottom: ".8rem" }}>
              {user?.email}
            </div>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {stats.map(s => (
                <span key={s.label} style={{
                  padding: ".25rem .7rem", borderRadius: 20,
                  background: "var(--ink1)", border: "1px solid var(--border)",
                  fontSize: ".7rem", fontFamily: "'JetBrains Mono',monospace",
                  color: s.color
                }}>
                  {s.label}: {s.val}
                </span>
              ))}
            </div>
          </div>

          {/* UPGRADE BADGE */}
          {user?.plan !== "pro" && (
            <div style={{
              padding: ".8rem 1.2rem", borderRadius: 12, textAlign: "center",
              background: "var(--limebg)", border: "1px solid rgba(184,255,87,.3)",
              flexShrink: 0
            }}>
              <div style={{ fontSize: "1.2rem", marginBottom: ".3rem" }}>⭐</div>
              <div style={{ fontSize: ".72rem", fontWeight: 700,
                color: "var(--lime)", marginBottom: ".4rem" }}>Upgrade Pro</div>
              <div style={{ fontSize: ".65rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace" }}>₹0 / forever</div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)",
          marginBottom: "1.5rem" }}>
          {[
            { key: "profile",   label: "👤 Profile"   },
            { key: "goals",     label: "🎯 Goals"     },
            { key: "account",   label: "🔒 Account"   },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: ".7rem 1.2rem", background: "none", border: "none",
                borderBottom: activeTab === t.key ? "2px solid var(--lime)" : "2px solid transparent",
                color: activeTab === t.key ? "var(--lime)" : "var(--muted)",
                cursor: "pointer", fontSize: ".82rem", fontWeight: activeTab === t.key ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="card card-p">
            <div className="card-title">👤 Personal Info</div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: ".4rem" }}>
                // full name
              </label>
              <input name="name" value={form.name} onChange={handle}
                placeholder="Your full name"
                style={{ width: "100%", padding: ".7rem 1rem", boxSizing: "border-box",
                  background: "var(--ink3)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--fg)", fontSize: ".85rem" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: ".4rem" }}>
                // email (cannot change)
              </label>
              <input value={user?.email} disabled
                style={{ width: "100%", padding: ".7rem 1rem", boxSizing: "border-box",
                  background: "var(--ink2)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--muted)", fontSize: ".85rem", cursor: "not-allowed" }} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: ".4rem" }}>
                // member since
              </label>
              <input value={new Date(user?.created_at || Date.now()).toLocaleDateString("en-US",
                { year: "numeric", month: "long", day: "numeric" })} disabled
                style={{ width: "100%", padding: ".7rem 1rem", boxSizing: "border-box",
                  background: "var(--ink2)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--muted)", fontSize: ".85rem", cursor: "not-allowed" }} />
            </div>

            {renderSaveButton()}
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <div className="card card-p">
            <div className="card-title">🎯 Interview Goals</div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: ".4rem" }}>
                // target role
              </label>
              <select name="target_role" value={form.target_role} onChange={handle}
                style={{ width: "100%", padding: ".7rem 1rem", boxSizing: "border-box",
                  background: "var(--ink3)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--fg)", fontSize: ".85rem", cursor: "pointer" }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", display: "block", marginBottom: ".4rem" }}>
                // target company
              </label>
              <select name="target_company" value={form.target_company} onChange={handle}
                style={{ width: "100%", padding: ".7rem 1rem", boxSizing: "border-box",
                  background: "var(--ink3)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--fg)", fontSize: ".85rem", cursor: "pointer" }}>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* GOAL PREVIEW */}
            <div style={{ padding: "1rem", borderRadius: 10, marginBottom: "1rem",
              background: "var(--limebg)", border: "1px solid rgba(184,255,87,.2)" }}>
              <div style={{ fontSize: ".68rem", color: "var(--lime)",
                fontFamily: "'JetBrains Mono',monospace", marginBottom: ".4rem" }}>
                // your goal
              </div>
              <div style={{ fontSize: ".9rem", fontWeight: 700 }}>
                {form.target_role} @ {form.target_company}
              </div>
              <div style={{ fontSize: ".72rem", color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace", marginTop: ".3rem" }}>
                AI will personalise your study plan and recommendations for this goal
              </div>
            </div>

            {renderSaveButton()}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div className="card card-p">
              <div className="card-title">📊 Account Stats</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem" }}>
                {[
                  { icon: "🎯", label: "Problems Solved",  val: "Check Dashboard" },
                  { icon: "🔥", label: "Current Streak",   val: `${user?.streak || 0} days` },
                  { icon: "📋", label: "Plan",             val: user?.plan === "pro" ? "Pro ⭐" : "Free" },
                  { icon: "🏢", label: "Target Company",   val: user?.target_company || "Not set" },
                ].map(s => (
                  <div key={s.label} style={{ padding: ".8rem", background: "var(--ink3)",
                    borderRadius: 8, display: "flex", gap: ".6rem", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: ".65rem", color: "var(--muted)",
                        fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
                      <div style={{ fontSize: ".8rem", fontWeight: 700 }}>{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-p">
              <div className="card-title">⚠️ Danger Zone</div>
              <div style={{ fontSize: ".78rem", color: "var(--muted)", marginBottom: "1rem",
                fontFamily: "'JetBrains Mono',monospace" }}>
                // these actions cannot be undone
              </div>
              <button style={{ background: "var(--pinkbg)", border: "1px solid var(--pink)",
                borderRadius: 8, color: "var(--pink)", cursor: "pointer",
                padding: ".6rem 1.2rem", fontSize: ".78rem", fontFamily: "'JetBrains Mono',monospace" }}
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.reload();
                }}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderSaveButton() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
        <button className="btn btn-lime" onClick={handleSave} disabled={saving}
          style={{ justifyContent: "center" }}>
          {saving ? "Saving..." : "💾 Save Changes"}
        </button>
        {saved && (
          <div style={{ fontSize: ".78rem", color: "var(--lime)",
            fontFamily: "'JetBrains Mono',monospace" }}>
            ✅ Saved successfully!
          </div>
        )}
        {error && (
          <div style={{ fontSize: ".78rem", color: "var(--pink)",
            fontFamily: "'JetBrains Mono',monospace" }}>
            ❌ {error}
          </div>
        )}
      </div>
    );
  }
}
