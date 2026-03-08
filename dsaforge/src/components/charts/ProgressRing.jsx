import { useState, useEffect } from "react";

export default function ProgressRing({ pct, color, size = 90, label }) {

  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;

  const [dash, setDash] = useState(circ);

  useEffect(() => {
    setTimeout(() => {
      setDash(circ - (pct / 100) * circ);
    }, 300);
  }, [pct, circ]);

  return (
    <div className="pr-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ink3)"
          strokeWidth={8}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition:
              "stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)"
          }}
        />
      </svg>

      <div className="pr-label">
        <div className="pr-val" style={{ color }}>
          {pct}%
        </div>

        <div className="pr-lbl">
          {label}
        </div>
      </div>
    </div>
  );
}