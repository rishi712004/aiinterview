import { useState } from "react";
import { login, register } from "../../services/api";

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    target_role: "Full Stack Developer",
    target_company: "Google"
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const fn = isRegister ? register : login;
      const { data } = await fn(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--ink1)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div className="card card-p" style={{ width: 400 }}>
        <div className="sb-logo-text" style={{ marginBottom: "1.5rem" }}>
          DSA<em>forge</em>
        </div>

        {error && (
          <div style={{
            background: "var(--pinkbg)", border: "1px solid var(--pink)",
            borderRadius: 8, padding: ".8rem", marginBottom: "1rem",
            fontSize: ".8rem", color: "var(--pink)"
          }}>{error}</div>
        )}

        {isRegister && (
          <input className="input" name="name" placeholder="Full name"
            value={form.name} onChange={handle}
            style={{ width: "100%", marginBottom: ".8rem", padding: ".7rem", background: "var(--ink3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)", fontSize: ".85rem" }}
          />
        )}

        <input className="input" name="email" placeholder="Email" type="email"
          value={form.email} onChange={handle}
          style={{ width: "100%", marginBottom: ".8rem", padding: ".7rem", background: "var(--ink3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)", fontSize: ".85rem" }}
        />

        <input className="input" name="password" placeholder="Password" type="password"
          value={form.password} onChange={handle}
          style={{ width: "100%", marginBottom: ".8rem", padding: ".7rem", background: "var(--ink3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)", fontSize: ".85rem" }}
        />

        {isRegister && (
          <>
            <input className="input" name="target_role" placeholder="Target role (e.g. SDE-2)"
              value={form.target_role} onChange={handle}
              style={{ width: "100%", marginBottom: ".8rem", padding: ".7rem", background: "var(--ink3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)", fontSize: ".85rem" }}
            />
            <input className="input" name="target_company" placeholder="Target company (e.g. Google)"
              value={form.target_company} onChange={handle}
              style={{ width: "100%", marginBottom: ".8rem", padding: ".7rem", background: "var(--ink3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)", fontSize: ".85rem" }}
            />
          </>
        )}

        <button className="btn btn-lime" onClick={submit} disabled={loading}
          style={{ width: "100%", justifyContent: "center", marginBottom: ".8rem" }}>
          {loading ? "Loading..." : isRegister ? "Create Account" : "Login"}
        </button>

        <div style={{ textAlign: "center", fontSize: ".8rem", color: "var(--muted)" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span style={{ color: "var(--lime)", cursor: "pointer" }}
            onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Register"}
          </span>
        </div>
      </div>
    </div>
  );
}
