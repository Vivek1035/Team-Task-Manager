import { useState } from "react";
import { createTask } from "../api/taskApi";
import ErrorMessage from "./ErrorMessage";

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

export default function TaskModal({ projectId, projectMembers, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignedToId: projectMembers[0]?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required");
    if (!form.assignedToId) return setError("Please select an assignee");

    setLoading(true);
    setError("");
    try {
      const res = await createTask({
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        projectId,
        assignedToId: form.assignedToId,
      });
      onCreated(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Create Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="label">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Implement login page"
              className="input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional details…"
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="select">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Assign To</label>
              <select name="assignedToId" value={form.assignedToId} onChange={handleChange} className="select">
                {projectMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <ErrorMessage message={error} />

          <div className="flex gap-3 justify-end mt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
