import { useState, useEffect } from "react";

export default function MiniBars({ items }) {
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnim(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {items.map((it) => (
        <div key={it.label} className="mini-bar-row">
          
          <div className="mbl">
            {it.label}
          </div>

          <div className="mb-track">
            <div
              className="mb-fill"
              style={{
                width: anim ? `${it.val}%` : "0%",
                background: it.color
              }}
            />
          </div>

          <div
            className="mbv"
            style={{ color: it.color }}
          >
            {it.val}
          </div>

        </div>
      ))}
    </div>
  );
}