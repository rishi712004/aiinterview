import { useState } from "react";

import { NAV } from "./constants/navigation";

import DashboardPage from "./pages/dashboard/DashboardPage";
import QuestionsPage from "./pages/questions/QuestionsPage";
import ResumePage from "./pages/resume/ResumePage";
import MockPage from "./pages/mock/MockPage";

export default function App() {

  const [page, setPage] = useState("dashboard");

  const pageMap = {
    dashboard: <DashboardPage />,
    questions: <QuestionsPage />,
    resume: <ResumePage />,
    mock: <MockPage />,
    analytics: <DashboardPage />,
    leaderboard: <DashboardPage />,
  };

  const titleMap = {
    dashboard: {
      title: "Dashboard",
      sub: "// your preparation overview"
    },
    questions: {
      title: "DSA Questions",
      sub: "// company-specific · AI-curated · weakness-targeted"
    },
    resume: {
      title: "Resume AI Feedback",
      sub: "// upload → analyze → optimize"
    },
    mock: {
      title: "Mock Interview",
      sub: "// schedule · practice · improve"
    },
    analytics: {
      title: "Analytics",
      sub: "// deep-dive into your performance"
    },
    leaderboard: {
      title: "Leaderboard",
      sub: "// compete with peers"
    }
  };

  return (
    <div className="shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sb-logo">
          <div className="sb-logo-text">
            DSA<em>forge</em>
          </div>
          <div className="sb-logo-sub">
            // AI-powered prep platform
          </div>
        </div>

        <div className="sb-section">Main</div>

        {NAV.map((n) => (
          <button
            key={n.id}
            className={`sb-item ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            <span className="icon">{n.icon}</span>

            {n.label}

            {n.badge && (
              <span className="badge">{n.badge}</span>
            )}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div className="sb-section">Settings</div>

        <button className="sb-item">
          <span className="icon">⚙️</span>
          Settings
        </button>

        <button className="sb-item">
          <span className="icon">📦</span>
          Upgrade Pro
        </button>

        <div className="sb-footer">
          <div className="sb-user">

            <div className="sb-avatar">
              AK
            </div>

            <div>
              <div className="sb-uname">
                Arjun Kumar
              </div>

              <div className="sb-uemail">
                arjun@gmail.com
              </div>
            </div>

            <div
              className="notif-dot"
              style={{ marginLeft: "auto" }}
            />

          </div>
        </div>

      </aside>


      {/* MAIN */}
      <main className="main">

        <div className="topbar">

          <div>
            <div className="topbar-title">
              {titleMap[page].title}
            </div>

            <div className="topbar-sub">
              {titleMap[page].sub}
            </div>
          </div>

          <div className="topbar-right">

            <div className="topbar-streak">
              🔥 23 day streak
            </div>

            <button className="btn btn-ghost">
              🎯 Target: Google SDE-2
            </button>

            <button className="btn btn-lime">
              + Practice Now
            </button>

          </div>

        </div>

        {pageMap[page]}

      </main>

    </div>
  );
}