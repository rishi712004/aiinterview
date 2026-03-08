export default function StatCards() {

  const stats = [
    { label: "Problems Solved", value: 347 },
    { label: "Accuracy", value: "74%" },
    { label: "Day Streak", value: 23 },
    { label: "Weak Topics", value: 3 }
  ]

  return (
    <div className="stat-grid">

      {stats.map((s) => (

        <div key={s.label} className="stat-card">

          <div className="stat-label">
            {s.label}
          </div>

          <div className="stat-value">
            {s.value}
          </div>

        </div>

      ))}

    </div>
  )
}