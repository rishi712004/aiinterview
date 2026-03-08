import { useMemo } from "react";

export default function ActivityHeatmap() {

  const cells = useMemo(() => {
    return Array.from({ length: 182 }, () => {
      const v = Math.random();
      return v < 0.4 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : v < 0.92 ? 3 : 4;
    });
  }, []);

  const colors = [
    "var(--ink3)",
    "rgba(184,255,87,.2)",
    "rgba(184,255,87,.45)",
    "rgba(184,255,87,.7)",
    "var(--lime)"
  ];

  return (
    <div className="cal-wrap">

      <div className="cal-grid">
        {cells.map((v, i) => (
          <div
            key={i}
            className="cal-cell"
            style={{ background: colors[v] }}
            title={`${v} problems`}
          />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".4rem",
          marginTop: ".8rem",
          justifyContent: "flex-end"
        }}
      >
        <span
          style={{
            fontSize: ".62rem",
            color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace"
          }}
        >
          Less
        </span>

        {colors.map((c, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: c
            }}
          />
        ))}

        <span
          style={{
            fontSize: ".62rem",
            color: "var(--muted)",
            fontFamily: "'JetBrains Mono',monospace"
          }}
        >
          More
        </span>

      </div>

    </div>
  );
}