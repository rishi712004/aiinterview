import { useState, useEffect } from "react";
import { NAV } from "./constants/navigation";
import DashboardPage from "./pages/dashboard/DashboardPage";
import LeaderboardPage from "./pages/leaderboard/LeaderboardPage";
import QuestionsPage from "./pages/questions/QuestionsPage";
import ResumePage from "./pages/resume/ResumePage";
import MockPage from "./pages/mock/MockPage";
import LoginPage from "./pages/auth/LoginPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import HistoryPage from "./pages/history/HistoryPage";
import DailyChallengePage from "./pages/daily/DailyChallengePage";

const MOBILE_NAV = [
  { id: "dashboard",   icon: "⚡", label: "Home"     },
  { id: "questions",   icon: "📝", label: "Problems" },
  { id: "mock",        icon: "🎯", label: "Mock"     },
  { id: "analytics",   icon: "📊", label: "Stats"    },
  { id: "leaderboard", icon: "🏆", label: "Rank"     },
];

const VALID_PAGES = ["dashboard","questions","resume","mock","analytics",
                     "leaderboard","profile","history","daily"];

export default function App() {
  const [page,        setPage]        = useState("dashboard");
  const [user,        setUser]        = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme,       setTheme]       = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ── Browser back/forward support ──────────────────────────────────────────
  useEffect(() => {
    const hash    = window.location.hash.replace("#", "");
    const initial = VALID_PAGES.includes(hash) ? hash : "dashboard";
    window.history.replaceState({ page: initial }, "", `#${initial}`);
    setPage(initial);

    const handlePop = (e) => {
      const pg = e.state?.page;
      if (pg && VALID_PAGES.includes(pg)) {
        setPage(pg);
        setSidebarOpen(false);
      } else {
        setPage("dashboard");
      }
    };

    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const handleLogin  = (u) => { setUser(u); navigate("dashboard"); };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.history.replaceState({ page: "dashboard" }, "", "#dashboard");
  };
  const handleUserUpdate = (u) => setUser(prev => ({ ...prev, ...u }));

  const navigate = (id) => {
    window.history.pushState({ page: id }, "", `#${id}`);
    setPage(id);
    setSidebarOpen(false);
  };

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const pageMap = {
    dashboard:   <DashboardPage user={user} />,
    questions:   <QuestionsPage />,
    resume:      <ResumePage />,
    mock:        <MockPage />,
    analytics:   <AnalyticsPage user={user} />,
    leaderboard: <LeaderboardPage user={user} />,
    profile:     <ProfilePage user={user} onUpdate={handleUserUpdate} />,
    history:     <HistoryPage onOpenQuestion={() => navigate("questions")} />,
    daily:       <DailyChallengePage onSolve={() => navigate("questions")} />,
  };

  const titleMap = {
    dashboard:   { title: "Dashboard",         sub: "// your preparation overview"               },
    questions:   { title: "DSA Questions",      sub: "// company-specific · AI-curated"          },
    resume:      { title: "Resume AI",          sub: "// upload → analyze → optimize"            },
    mock:        { title: "Mock Interview",      sub: "// schedule · practice · improve"          },
    analytics:   { title: "Analytics",          sub: "// deep-dive into your performance"         },
    leaderboard: { title: "Leaderboard",        sub: "// compete with peers"                     },
    profile:     { title: "Profile",            sub: "// manage your account"                    },
    history:     { title: "Submission History", sub: "// all your past attempts"                 },
    daily:       { title: "Daily Challenge",    sub: "// one problem a day keeps rejections away" },
  };

  const initials = user.name?.split(" ").map(w => w[0]).join("").toUpperCase() || "U";

  return (
    <div className="shell">

      {/* SIDEBAR OVERLAY (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sb-logo">
          <div className="sb-logo-text">DSA<em>forge</em></div>
          <div className="sb-logo-sub">// AI-powered prep platform</div>
        </div>

        <div className="sb-section">Main</div>
        {NAV.map((n) => (
          <button key={n.id}
            className={`sb-item ${page === n.id ? "active" : ""}`}
            onClick={() => navigate(n.id)}>
            <span className="icon">{n.icon}</span>
            {n.label}
            {n.badge && <span className="badge">{n.badge}</span>}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div className="sb-section">Settings</div>
        <button className={`sb-item ${page === "profile" ? "active" : ""}`}
          onClick={() => navigate("profile")}>
          <span className="icon">⚙️</span>Settings
        </button>
        <button className="sb-item" onClick={toggleTheme}>
          <span className="icon">{theme === "dark" ? "☀️" : "🌙"}</span>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button className="sb-item">
          <span className="icon">📦</span>Upgrade Pro
        </button>

        <div className="sb-footer">
          <div className="sb-user" onClick={() => navigate("profile")}
            style={{ cursor: "pointer" }}>
            <div className="sb-avatar">{initials}</div>
            <div>
              <div className="sb-uname">{user.name}</div>
              <div className="sb-uemail">{user.email}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              style={{ marginLeft: "auto", background: "none", border: "none",
                color: "var(--muted)", cursor: "pointer", fontSize: ".75rem" }}>
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div>
            <div className="topbar-title">{titleMap[page]?.title}</div>
            <div className="topbar-sub">{titleMap[page]?.sub}</div>
          </div>
          <div className="topbar-right">
            <button onClick={toggleTheme}
              style={{ background: "var(--ink3)", border: "1px solid var(--border)",
                borderRadius: 8, padding: ".35rem .6rem", cursor: "pointer",
                fontSize: ".9rem" }}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <div className="topbar-streak">🔥 {user.streak || 0}</div>
            <button className="btn btn-ghost" onClick={() => navigate("profile")}>
              🎯 {user.target_company || "FAANG"} · {user.target_role || "SDE"}
            </button>
            <button className="btn btn-lime" onClick={() => navigate("questions")}>
              + Practice
            </button>
          </div>
        </div>

        {pageMap[page]}
      </main>

      {/* BOTTOM NAV — mobile only */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map(n => (
          <button key={n.id}
            className={`mobile-nav-item ${page === n.id ? "active" : ""}`}
            onClick={() => navigate(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
