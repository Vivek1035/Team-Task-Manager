import { useState } from "react";
import { updateTask } from "../api/taskApi";
import { getDefaultProgressForStatus } from "../utils/statusUtils";
import ProgressBar from "./ProgressBar";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

const STATUSES = ["PENDING", "IN_PROGRESS", "DONE"];

export default function TaskCard({ task, isAdmin, currentUserId, onUpdated, onDelete }) {
  const isAssigned = task.assignedToId === currentUserId;
  const canEdit    = isAdmin || isAssigned;

  const [localTitle, setLocalTitle]       = useState(task.title);
  const [localDesc, setLocalDesc]         = useState(task.description || "");
  const [localStatus, setLocalStatus]     = useState(task.status);
  const [localProgress, setLocalProgress] = useState(task.progress);
  const [editingTitle, setEditingTitle]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  const handleStatusChange = (newStatus) => {
    const adjustedProgress = getDefaultProgressForStatus(newStatus, localProgress);
    setLocalStatus(newStatus);
    setLocalProgress(adjustedProgress);
  };

  const handleProgressChange = (val) => {
    const num = Number(val);
    setLocalProgress(num);
    // Auto-upgrade status when progress is manually changed
    if (num === 100) setLocalStatus("DONE");
    else if (num === 0) setLocalStatus("PENDING");
    else setLocalStatus("IN_PROGRESS");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateTask(task.id, {
        status:      localStatus,
        progress:    localProgress,
        title:       isAdmin ? localTitle : undefined,
        description: isAdmin ? localDesc  : undefined,
      });
      onUpdated(updated.data);
      setEditingTitle(false);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    localStatus   !== task.status   ||
    localProgress !== task.progress ||
    (isAdmin && localTitle !== task.title) ||
    (isAdmin && localDesc  !== (task.description || ""));

  return (
    <div className="card group flex flex-col gap-4 animate-slide-up">

      {/* Header — editable title for admins */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isAdmin && editingTitle ? (
            <input
              autoFocus
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => !localTitle.trim() && setLocalTitle(task.title)}
              onKeyDown={(e) => e.key === "Escape" && setEditingTitle(false)}
              className="input text-sm font-semibold py-1 px-2 w-full"
              placeholder="Task title…"
            />
          ) : (
            <h3
              className={`font-semibold text-gray-100 truncate ${isAdmin ? "cursor-pointer hover:text-white" : ""}`}
              title={isAdmin ? "Click to edit title" : task.title}
              onClick={() => isAdmin && setEditingTitle(true)}
            >
              {localTitle}
              {isAdmin && (
                <span className="ml-1.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✏️</span>
              )}
            </h3>
          )}

          {/* Description — editable for admins */}
          {isAdmin ? (
            <textarea
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              rows={2}
              placeholder="Add description…"
              className="mt-1 w-full bg-transparent text-xs text-gray-500 resize-none focus:outline-none focus:text-gray-300 transition-colors placeholder-gray-700"
            />
          ) : (
            task.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Progress slider — available whenever in-progress OR user manually drags */}
      {canEdit ? (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span className="text-gray-300 font-semibold">{localProgress}%</span>
          </div>
          <input
            type="range"
            min={0} max={100}
            value={localProgress}
            onChange={(e) => handleProgressChange(e.target.value)}
            className="w-full cursor-pointer"
            style={{ accentColor: "#6366f1" }}
          />
          <div className="flex justify-between text-xs text-gray-700 mt-0.5">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      ) : (
        <ProgressBar value={localProgress} />
      )}

      {/* Status selector */}
      {canEdit ? (
        <select
          value={localStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="select text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      ) : (
        <StatusBadge status={task.status} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="text-xs text-gray-500">
          Assigned to{" "}
          <span className="text-gray-400 font-medium">{task.assignedToName}</span>
        </div>
        <div className="flex gap-2">
          {canEdit && isDirty && (
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          {canEdit && isDirty && (
            <button
              onClick={() => {
                setLocalTitle(task.title);
                setLocalDesc(task.description || "");
                setLocalStatus(task.status);
                setLocalProgress(task.progress);
                setEditingTitle(false);
              }}
              className="btn btn-ghost btn-sm"
            >
              Reset
            </button>
          )}
          {isAdmin && !isDirty && (
            <button onClick={() => onDelete(task.id)} className="btn btn-danger btn-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">⚠️ {error}</p>}
    </div>
  );
}
