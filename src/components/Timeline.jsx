import { fmtDuration, fmtClock } from "../utils/time";

export default function Timeline({ allSessions, rangeStart, rangeSpan, hourMarks, activeSession }) {
  return (
    <div className="panel timeline-panel">
      <div className="panel-label">Today's timeline</div>
      <div className="timeline-track">
        {allSessions.map((s, i) => {
          const left = Math.max(0, ((s.start - rangeStart) / rangeSpan) * 100);
          const width = Math.max(0.6, ((s.end - rangeStart) / rangeSpan) * 100 - left);
          const isCurrent =
            activeSession && s.taskId === activeSession.taskId && s.start === activeSession.start;
          return (
            <div
              key={s.id || i}
              title={`${s.taskName} · ${fmtDuration(s.duration)} · ${fmtClock(s.start)}–${fmtClock(s.end)}`}
              className={`timeline-block ${s.type === "work" ? "is-work" : "is-break"}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                opacity: isCurrent ? 0.75 : 0.9,
              }}
            />
          );
        })}
      </div>
      <div className="timeline-hours">
        {hourMarks.map((t, i) => (
          <span key={i} className="mono hour-mark">
            {i === 0 || i === hourMarks.length - 1 || i % 2 === 0 ? fmtClock(t).replace(":00", "") : ""}
          </span>
        ))}
      </div>
      {allSessions.length === 0 && (
        <p className="empty-hint">Start a focus or break session below and it'll show up here.</p>
      )}
    </div>
  );
}
