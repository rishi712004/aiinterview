import { NAV } from "../../constants/navigation";

export default function Sidebar({ page, setPage }) {
  return (
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
        </button>
      ))}
    </aside>
  );
}