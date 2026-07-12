import { useState, useEffect, useRef } from "react";
import { List, LayoutGrid } from "lucide-react";
import Timeline from "./components/Timeline";
import TaskList from "./components/TaskList";
import KanbanBoard from "./components/KanbanBoard";
import TimerPanel from "./components/TimerPanel";
import SessionLog from "./components/SessionLog";
import BoardSwitcher from "./components/BoardSwitcher";
import { todayKey, todayLabel, uid, fmtDuration } from "./utils/time";
import "./Flowlog.css";

function migrateTask(t) {
  return {
    id: t.id,
    text: t.text,
    focusSec: t.focusSec || 0,
    priority: t.priority || "medium",
    dueDate: t.dueDate || null,
    tags: t.tags || [],
    status: t.status || (t.done ? "done" : "todo"),
  };
}

function defaultBoards() {
  try {
    const old = localStorage.getItem("flowlog:tasks");
    if (old) {
      const tasks = JSON.parse(old).map(migrateTask);
      return [{ id: uid(), name: "My tasks", tasks }];
    }
  } catch (e) {}
  return [{ id: uid(), name: "My tasks", tasks: [] }];
}

export default function Flowlog() {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [view, setView] = useState("list");
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);
  const tickRef = useRef(null);
  const dateKey = todayKey();

  useEffect(() => {
    let loadedBoards = null;
    try {
      const b = localStorage.getItem("flowlog:boards");
      if (b) {
        loadedBoards = JSON.parse(b).map((board) => ({
          ...board,
          tasks: board.tasks.map(migrateTask),
        }));
      }
    } catch (e) {}
    if (!loadedBoards || !loadedBoards.length) loadedBoards = defaultBoards();
    setBoards(loadedBoards);

    let activeId = null;
    try {
      activeId = localStorage.getItem("flowlog:activeBoard");
    } catch (e) {}
    if (!activeId || !loadedBoards.some((b) => b.id === activeId)) {
      activeId = loadedBoards[0].id;
    }
    setActiveBoardId(activeId);

    try {
      const s = localStorage.getItem(`flowlog:sessions:${dateKey}`);
      if (s) setSessions(JSON.parse(s));
    } catch (e) {}

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("flowlog:boards", JSON.stringify(boards));
  }, [boards, loaded]);

  useEffect(() => {
    if (!loaded || !activeBoardId) return;
    localStorage.setItem("flowlog:activeBoard", activeBoardId);
  }, [activeBoardId, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`flowlog:sessions:${dateKey}`, JSON.stringify(sessions));
  }, [sessions, loaded]);

  useEffect(() => {
    if (session) {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(tickRef.current);
    }
  }, [session]);

  const elapsed = session ? Math.floor((now - session.start) / 1000) : 0;
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];
  const tasks = activeBoard ? activeBoard.tasks : [];

  function updateActiveBoardTasks(updater) {
    setBoards((prev) =>
      prev.map((b) => (b.id === activeBoardId ? { ...b, tasks: updater(b.tasks) } : b))
    );
  }

  function updateTask(id, patch) {
    updateActiveBoardTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTask(text, priority, dueDate) {
    updateActiveBoardTasks((prev) => [
      ...prev,
      { id: uid(), text, focusSec: 0, priority: priority || "medium", dueDate: dueDate || null, tags: [], status: "todo" },
    ]);
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, { status: task.status === "done" ? "todo" : "done" });
  }

  function setTaskStatus(id, status) {
    updateTask(id, { status });
  }

  function setTaskPriority(id, priority) {
    updateTask(id, { priority });
  }

  function setTaskDueDate(id, dueDate) {
    updateTask(id, { dueDate });
  }

  function addTag(id, tag) {
    const task = tasks.find((t) => t.id === id);
    if (!task || (task.tags || []).includes(tag)) return;
    updateTask(id, { tags: [...(task.tags || []), tag] });
  }

  function removeTag(id, tag) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, { tags: (task.tags || []).filter((tg) => tg !== tag) });
  }

  function deleteTask(id) {
    updateActiveBoardTasks((prev) => prev.filter((t) => t.id !== id));
    if (session && session.taskId === id) stopSession();
  }

  function addBoard(name) {
    const newBoard = { id: uid(), name, tasks: [] };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  }

  function renameBoard(id, name) {
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
  }

  function deleteBoard(id) {
    if (boards.length <= 1) return;
    setBoards((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (activeBoardId === id) setActiveBoardId(next[0].id);
      return next;
    });
    if (session && session.boardId === id) stopSession();
  }

  function startSession(type, taskId) {
    if (session) stopSession();
    const task = tasks.find((t) => t.id === taskId);
    setSession({
      type,
      taskId: taskId || null,
      boardId: activeBoardId,
      taskName: task ? task.text : type === "break" ? "Break" : "General focus",
      start: Date.now(),
    });
    setNow(Date.now());
  }

  function stopSession() {
    setSession((current) => {
      if (!current) return null;
      const end = Date.now();
      const duration = Math.floor((end - current.start) / 1000);
      if (duration >= 5) {
        const record = { ...current, id: uid(), end, duration };
        setSessions((prev) => [...prev, record]);
        if (current.type === "work" && current.taskId && current.boardId) {
          setBoards((prev) =>
            prev.map((b) =>
              b.id === current.boardId
                ? {
                    ...b,
                    tasks: b.tasks.map((t) =>
                      t.id === current.taskId ? { ...t, focusSec: t.focusSec + duration } : t
                    ),
                  }
                : b
            )
          );
        }
      }
      return null;
    });
  }

  const totalFocus =
    sessions.filter((s) => s.type === "work").reduce((a, s) => a + s.duration, 0) +
    (session && session.type === "work" ? elapsed : 0);
  const totalBreak =
    sessions.filter((s) => s.type === "break").reduce((a, s) => a + s.duration, 0) +
    (session && session.type === "break" ? elapsed : 0);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const focusRatio =
    totalFocus + totalBreak > 0 ? Math.round((totalFocus / (totalFocus + totalBreak)) * 100) : null;

  const allSessions = session ? [...sessions, { ...session, end: now, duration: elapsed }] : sessions;
  let rangeStart, rangeEnd;
  if (allSessions.length) {
    rangeStart = Math.min(...allSessions.map((s) => s.start));
    rangeEnd = Math.max(...allSessions.map((s) => s.end));
    const padMs = 20 * 60 * 1000;
    rangeStart -= padMs;
    rangeEnd += padMs;
  } else {
    const d = new Date();
    rangeStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8).getTime();
    rangeEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18).getTime();
  }
  const rangeSpan = Math.max(rangeEnd - rangeStart, 3600000);

  const hourMarks = [];
  const firstHour = new Date(rangeStart);
  firstHour.setMinutes(0, 0, 0);
  if (firstHour.getTime() < rangeStart) firstHour.setHours(firstHour.getHours() + 1);
  for (let t = firstHour.getTime(); t <= rangeEnd; t += 3600000) {
    hourMarks.push(t);
  }

  if (!loaded || !activeBoard) return null;

  return (
    <div className="flowlog">
      <div className="header-row">
        <div>
          <h1 className="display app-title">Flowlog</h1>
          <p className="app-subtitle">{todayLabel()}</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <div className="mono header-stat-value" style={{ color: "var(--work)" }}>
              {fmtDuration(totalFocus)}
            </div>
            <div className="header-stat-label">focus today</div>
          </div>
          <div className="header-stat">
            <div className="mono header-stat-value" style={{ color: "var(--break)" }}>
              {fmtDuration(totalBreak)}
            </div>
            <div className="header-stat-label">break today</div>
          </div>
        </div>
      </div>

      <div className="board-toolbar">
        <BoardSwitcher
          boards={boards}
          activeBoardId={activeBoardId}
          onSelect={setActiveBoardId}
          onAdd={addBoard}
          onRename={renameBoard}
          onDelete={deleteBoard}
        />
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${view === "list" ? "is-active" : ""}`}
            onClick={() => setView("list")}
          >
            <List size={14} /> List
          </button>
          <button
            className={`view-toggle-btn ${view === "kanban" ? "is-active" : ""}`}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid size={14} /> Kanban
          </button>
        </div>
      </div>

      <Timeline
        allSessions={allSessions}
        rangeStart={rangeStart}
        rangeSpan={rangeSpan}
        hourMarks={hourMarks}
        activeSession={session}
      />

      {view === "list" ? (
        <div className="main-grid">
          <TaskList
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onSetPriority={setTaskPriority}
            onSetDueDate={setTaskDueDate}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onStartFocus={(taskId) => startSession("work", taskId)}
            onStop={stopSession}
            activeTaskId={session ? session.taskId : null}
            doneCount={doneCount}
            focusRatio={focusRatio}
          />

          <div>
            <TimerPanel
              session={session}
              elapsed={elapsed}
              onStartFocus={(taskId) => startSession("work", taskId)}
              onStartBreak={() => startSession("break", null)}
              onStop={stopSession}
            />
            <SessionLog sessions={sessions} />
          </div>
        </div>
      ) : (
        <div className="kanban-layout">
          <KanbanBoard
            tasks={tasks}
            activeTaskId={session ? session.taskId : null}
            onSetStatus={setTaskStatus}
            onStartFocus={(taskId) => startSession("work", taskId)}
            onStop={stopSession}
            onDeleteTask={deleteTask}
          />
          <div className="kanban-side">
            <TimerPanel
              session={session}
              elapsed={elapsed}
              onStartFocus={(taskId) => startSession("work", taskId)}
              onStartBreak={() => startSession("break", null)}
              onStop={stopSession}
            />
            <SessionLog sessions={sessions} />
          </div>
        </div>
      )}
    </div>
  );
}
