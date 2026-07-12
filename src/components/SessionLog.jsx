import { fmtDuration } from "../utils/time";

export default function SessionLog({ sessions }) {
  const recentSessions = [...sessions].reverse();

  return (
    <div className="panel log-panel">
      <div className="panel-label">Session log</div>
      {recentSessions.length === 0 && <p className="empty-hint">Nothing logged yet today.</p>}
      {recentSessions.map((s, i) => (
        <div
          key={s.id || i}
          className="log-row"
          style={{ borderBottom: i < recentSessions.length - 1 ? "1px solid var(--border)" : "none" }}
        >
          <span className={`log-dot ${s.type === "work" ? "is-work" : "is-break"}`} />
          <div className="log-name">{s.taskName}</div>
          <div className="mono log-duration">{fmtDuration(s.duration)}</div>
        </div>
      ))}
    </div>
  );
}
