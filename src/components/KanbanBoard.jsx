import { useState } from "react";
import { Play, Square, Trash2 } from "lucide-react";
import { fmtDuration, fmtDueDate, dueState } from "../utils/time";

const COLUMNS = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
];

function priorityColor(priority) {
  return priority === "high" ? "var(--danger)" : priority === "low" ? "var(--text-muted)" : "var(--break)";
}

function KanbanCard({ task, isActive, onStartFocus, onStop, onDeleteTask, onDragStart }) {
  return (
    <div className="kanban-card" draggable onDragStart={(e) => onDragStart(e, task.id)}>
      <div className="kanban-card-top">
        <span className="priority-dot" style={{ background: priorityColor(task.priority || "medium") }} />
        <div className="kanban-card-text">{task.text}</div>
      </div>
      <div className="kanban-card-meta">
        {task.dueDate && (
          <span className={`due-badge is-${dueState(task.dueDate)}`}>{fmtDueDate(task.dueDate)}</span>
        )}
        {task.focusSec > 0 && <span className="mono kanban-card-focus">{fmtDuration(task.focusSec)}</span>}
      </div>
      {(task.tags || []).length > 0 && (
        <div className="kanban-card-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="kanban-card-actions">
        <button
          className="icon-btn"
          onClick={() => (isActive ? onStop() : onStartFocus(task.id))}
          aria-label={isActive ? "Stop" : "Start focus"}
          style={isActive ? { color: "var(--work)" } : undefined}
        >
          {isActive ? <Square size={14} /> : <Play size={14} />}
        </button>
        <button className="icon-btn" onClick={() => onDeleteTask(task.id)} aria-label="Delete task">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, activeTaskId, onSetStatus, onStartFocus, onStop, onDeleteTask }) {
  const [dragOverCol, setDragOverCol] = useState(null);

  function handleDragStart(e, taskId) {
    e.dataTransfer.setData("text/plain", taskId);
  }

  function handleDrop(e, colKey) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onSetStatus(taskId, colKey);
    setDragOverCol(null);
  }

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || "todo") === col.key);
        return (
          <div
            key={col.key}
            className={`kanban-column ${dragOverCol === col.key ? "is-drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="kanban-column-header">
              <span>{col.label}</span>
              <span className="kanban-column-count">{colTasks.length}</span>
            </div>
            <div className="kanban-column-body">
              {colTasks.length === 0 && <p className="empty-hint kanban-empty">Drop tasks here</p>}
              {colTasks.map((t) => (
                <KanbanCard
                  key={t.id}
                  task={t}
                  isActive={activeTaskId === t.id}
                  onStartFocus={onStartFocus}
                  onStop={onStop}
                  onDeleteTask={onDeleteTask}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
