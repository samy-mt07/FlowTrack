import { Play, Square, Coffee } from "lucide-react";
import { fmtDuration } from "../utils/time";

export default function TimerPanel({ session, elapsed, onStartFocus, onStartBreak, onStop }) {
  return (
    <div className="panel timer-panel">
      <div className="panel-label">{session ? session.taskName : "No active session"}</div>
      <div
        className="mono timer-display"
        style={{ color: session ? (session.type === "work" ? "var(--work)" : "var(--break)") : "var(--text)" }}
      >
        {fmtDuration(elapsed)}
      </div>
      <div className="timer-controls">
        {!session && (
          <>
            <button className="btn btn-work" onClick={() => onStartFocus(null)}>
              <Play size={14} /> Start focus
            </button>
            <button className="btn btn-break" onClick={onStartBreak}>
              <Coffee size={14} /> Start break
            </button>
          </>
        )}
        {session && session.type === "work" && (
          <>
            <button className="btn btn-stop" onClick={onStop}>
              <Square size={14} /> Stop
            </button>
            <button className="btn btn-break" onClick={onStartBreak}>
              <Coffee size={14} /> Take a break
            </button>
          </>
        )}
        {session && session.type === "break" && (
          <button className="btn btn-stop" onClick={onStop}>
            <Square size={14} /> End break
          </button>
        )}
      </div>
    </div>
  );
}
