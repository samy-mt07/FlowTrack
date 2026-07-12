import { useState } from "react";
import { Plus, X, Pencil } from "lucide-react";

export default function BoardSwitcher({ boards, activeBoardId, onSelect, onAdd, onRename, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  function submitAdd() {
    const name = newName.trim();
    if (name) onAdd(name);
    setNewName("");
    setAdding(false);
  }

  function startEdit(board) {
    setEditingId(board.id);
    setEditName(board.name);
  }

  function submitEdit() {
    const name = editName.trim();
    if (name) onRename(editingId, name);
    setEditingId(null);
  }

  return (
    <div className="board-switcher">
      {boards.map((b) =>
        editingId === b.id ? (
          <input
            key={b.id}
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={submitEdit}
            onKeyDown={(e) => e.key === "Enter" && submitEdit()}
            className="board-edit-input"
          />
        ) : (
          <button
            key={b.id}
            className={`board-pill ${b.id === activeBoardId ? "is-active" : ""}`}
            onClick={() => onSelect(b.id)}
            onDoubleClick={() => startEdit(b)}
          >
            <span>{b.name}</span>
            <span className="board-pill-actions">
              <Pencil
                size={12}
                className="board-pill-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(b);
                }}
              />
              {boards.length > 1 && (
                <X
                  size={12}
                  className="board-pill-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(b.id);
                  }}
                />
              )}
            </span>
          </button>
        )
      )}

      {adding ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={submitAdd}
          onKeyDown={(e) => e.key === "Enter" && submitAdd()}
          placeholder="Board name…"
          className="board-edit-input"
        />
      ) : (
        <button className="board-pill board-pill-add" onClick={() => setAdding(true)}>
          <Plus size={13} /> Board
        </button>
      )}
    </div>
  );
}
