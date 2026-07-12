import { useState } from "react";
import { Play, Square, Plus, Trash2, CheckCircle2, Circle, X } from "lucide-react";
import { fmtDuration, fmtDueDate, dueState } from "../utils/time";

const PRIORITIES = ["low", "medium", "high"];

function PriorityDot({ priority }) {
  const color =
    priority === "high" ? "var(--danger)" : priority === "low" ? "var(--text-muted)" : "var(--break)";
  return <span className="priority-dot" style={{ background: color }} title={`${priority} priority`} />;
}

function DueBadge({ dueDate }) {
  if (!dueDate) return null;
  const state = dueState(dueDate);
  return <span className={`due-badge is-${state}`}>{fmtDueDate(dueDate)}</span>;
}

function TagInput({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  function submit() {
    const v = value.trim();
    if (v) onAdd(v);
    setValue("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <button className="tag-add-btn" onClick={() => setAdding(true)}>
        <Plus size={10} /> tag
      </button>
    );
  }
  return (
    <input
      autoFocus
      className="tag-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      placeholder="tag…"
    />
  );
}

export default function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSetPriority,
  onSetDueDate,
  onAddTag,
  onRemoveTag,
  onStartFocus,
  onStop,
  activeTaskId,
  doneCount,
  focusRatio,
}) {
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");

  function handleAdd() {
    const text = newTask.trim();
    if (!text) return;
    onAddTask(text, newPriority, newDueDate || null);
    setNewTask("");
    setNewPriority("medium");
    setNewDueDate("");
  }

  return (
    <div>
      <div className="add-row">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task…"
          className="text-input"
        />
        <select
          className="priority-select"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="date-input"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />
        <button className="btn" onClick={handleAdd}>
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="panel task-panel">
        {tasks.length === 0 && (
          <p className="empty-hint" style={{ padding: "16px 4px" }}>
            No tasks yet. Add one above to start tracking focus time against it.
          </p>
        )}
        {tasks.map((t) => {
          const isActive = activeTaskId === t.id;
          const isDone = t.status === "done";
          return (
            <div className="task-row" key={t.id}>
              <button className="icon-btn" onClick={() => onToggleTask(t.id)} aria-label="Toggle done">
                {isDone ? <CheckCircle2 size={18} color="var(--work)" /> : <Circle size={18} />}
              </button>
              <div className="task-info">
                <div className="task-top-line">
                  <PriorityDot priority={t.priority || "medium"} />
                  <div className={`task-text ${isDone ? "is-done" : ""}`}>{t.text}</div>
                  <DueBadge dueDate={t.dueDate} />
                </div>
                <div className="task-meta-row">
                  {t.focusSec > 0 && (
                    <span className="mono task-focus">{fmtDuration(t.focusSec)} focused</span>
                  )}
                  {(t.tags || []).map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <X size={10} className="tag-remove" onClick={() => onRemoveTag(t.id, tag)} />
                    </span>
                  ))}
                  <TagInput onAdd={(tag) => onAddTag(t.id, tag)} />
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => (isActive ? onStop() : onStartFocus(t.id))}
                aria-label={isActive ? "Stop" : "Start focus"}
                style={isActive ? { color: "var(--work)" } : undefined}
              >
                {isActive ? <Square size={16} /> : <Play size={16} />}
              </button>
              <button className="icon-btn" onClick={() => onDeleteTask(t.id)} aria-label="Delete task">
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="stats-row">
        <div className="panel stat-card">
          <div className="panel-label">tasks done</div>
          <div className="display stat-value">
            {doneCount} / {tasks.length}
          </div>
        </div>
        <div className="panel stat-card">
          <div className="panel-label">focus ratio</div>
          <div className="display stat-value">{focusRatio === null ? "—" : `${focusRatio}%`}</div>
        </div>
      </div>
    </div>
  );
}
