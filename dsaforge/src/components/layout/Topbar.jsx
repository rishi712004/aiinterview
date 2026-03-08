import { TITLE_MAP } from "../../constants/navigation";

export default function Topbar({ page }) {
  const data = TITLE_MAP[page] || TITLE_MAP.dashboard;

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{data.title}</div>
        <div className="topbar-sub">{data.sub}</div>
      </div>

      <div className="topbar-right">
        <div className="topbar-streak">🔥 23 day streak</div>

        <button className="btn btn-ghost">
          🎯 Target: Google SDE
        </button>

        <button className="btn btn-lime">
          + Practice Now
        </button>
      </div>
    </div>
  );
}