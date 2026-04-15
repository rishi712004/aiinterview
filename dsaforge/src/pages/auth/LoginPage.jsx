import { useState } from "react";
import { login, register } from "../../services/api";

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
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
      const { data } = await (isRegister ? register : login)(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", marginBottom: ".75rem", padding: ".75rem 1rem",
    background: "var(--ink3)", border: "1px solid var(--border)",
    borderRadius: 10, color: "var(--text)", fontSize: ".9rem",
    outline: "none", transition: "border .15s",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--ink2)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "2.5rem 2rem",
        boxShadow: "var(--shadow2)",
      }}>

        {/* Logo */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <div style={{
            fontSize: "2rem", fontWeight: 800,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            letterSpacing: "-.03em", color: "var(--text)",
          }}>
            DSA<em style={{ color: "var(--amber)", fontStyle: "normal" }}>forge</em>
          </div>
          <div style={{ fontSize: ".85rem", color: "var(--muted)", marginTop: ".3rem" }}>
            {isRegister ? "Create your account to get started" : "Welcome back — good to see you"}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "var(--pinkbg)", border: "1px solid var(--pink)",
            borderRadius: 8, padding: ".75rem 1rem", marginBottom: "1rem",
            fontSize: ".82rem", color: "var(--pink)",
          }}>{error}</div>
        )}

        {/* Fields */}
        {isRegister && (
          <input style={inputStyle} name="name" placeholder="Full name"
            value={form.name} onChange={handle} />
        )}

        <input style={inputStyle} name="email" placeholder="Email address"
          type="email" value={form.email} onChange={handle} />

        <input style={inputStyle} name="password" placeholder="Password"
          type="password" value={form.password} onChange={handle} />

        {isRegister && (
          <>
            <input style={inputStyle} name="target_role"
              placeholder="Target role (e.g. SDE-2)"
              value={form.target_role} onChange={handle} />
            <input style={{ ...inputStyle, marginBottom: "1.25rem" }}
              name="target_company"
              placeholder="Target company (e.g. Google)"
              value={form.target_company} onChange={handle} />
          </>
        )}

        {!isRegister && <div style={{ marginBottom: "1.25rem" }} />}

        {/* Submit */}
        <button onClick={submit} disabled={loading}
          style={{
            width: "100%", padding: ".8rem",
            background: "var(--amber)", border: "none",
            borderRadius: 10, color: "#000",
            fontWeight: 700, fontSize: ".92rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? .7 : 1,
            fontFamily: "inherit",
            transition: "opacity .15s",
          }}>
          {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
        </button>

        {/* Toggle */}
        <div style={{ textAlign: "center", fontSize: ".82rem", color: "var(--muted)", marginTop: "1.2rem" }}>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span style={{ color: "var(--amber)", cursor: "pointer", fontWeight: 600 }}
            onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Login" : "Register"}
          </span>
        </div>

      </div>
    </div>
  );
}
