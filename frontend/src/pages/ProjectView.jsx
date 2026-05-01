import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTasks, deleteTask } from "../api/taskApi";
import { addMember, getMyRole, updateProject } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";

export default function ProjectView() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [tasks, setTasks]             = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [showModal, setShowModal]     = useState(false);

  // ── Project name (editable for admins) ─────────────────────────────────────
  const [projectName, setProjectName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editNameVal, setEditNameVal] = useState("");
  const [savingName, setSavingName]   = useState(false);
  const [nameError, setNameError]     = useState("");

  // ── Role: fetched from backend ──────────────────────────────────────────────
  const [myRole, setMyRole]           = useState(null);  // "ADMIN" | "MEMBER" | null
  const isAdmin                       = myRole === "ADMIN";
  const roleLoaded                    = myRole !== null;

  // ── Members list (for Task creation dropdown) ───────────────────────────────
  const [members, setMembers]         = useState([]);

  // ── Add-member form ─────────────────────────────────────────────────────────
  const [memberEmail, setMemberEmail]     = useState("");
  const [memberError, setMemberError]     = useState("");
  const [addingMember, setAddingMember]   = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSuccess, setMemberSuccess] = useState("");

  // ── Fetch tasks ─────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (pg = 0) => {
    setLoading(true);
    setError("");
    try {
      const res  = await getTasks(id, pg, 20);
      const data = res.data;
      setTasks(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
      setPage(pg);

      // Build unique members list from task assignees (for TaskModal dropdown)
      const seen  = new Set();
      const mList = [];
      (data.content ?? []).forEach((t) => {
        if (t.assignedToId && !seen.has(t.assignedToId)) {
          seen.add(t.assignedToId);
          mList.push({ id: t.assignedToId, name: t.assignedToName });
        }
      });
      // Always include self so admin can assign to themselves too
      if (user?.id && !seen.has(user.id)) {
        mList.push({ id: user.id, name: user.name });
      }
      setMembers(mList);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  // ── Fetch role + project name on mount ─────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem(`project_${id}`);
    if (stored) {
      setProjectName(stored);
      setEditNameVal(stored);
    }

    getMyRole(id)
      .then((r) => setMyRole(r.data.role))
      .catch(() => setMyRole("MEMBER"));

    fetchTasks(0);
  }, [fetchTasks, id]);

  // ── Project name editing ────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!editNameVal.trim()) return;
    setSavingName(true);
    setNameError("");
    try {
      const res = await updateProject(id, {
        name: editNameVal.trim(),
        // description omitted → backend keeps existing value
      });
      const newName = res.data.name;
      setProjectName(newName);
      setEditNameVal(newName);
      sessionStorage.setItem(`project_${id}`, newName);
      setEditingName(false);
    } catch (e) {
      setNameError(e.response?.data?.message || "Failed to update project name");
    } finally {
      setSavingName(false);
    }
  };

  // ── Task handlers ───────────────────────────────────────────────────────────
  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTaskDeleted = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete task");
    }
  };

  // ── Add-member handler ──────────────────────────────────────────────────────
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return setMemberError("Email is required");
    setAddingMember(true);
    setMemberError("");
    setMemberSuccess("");
    try {
      await addMember(id, { email: memberEmail.trim() });
      setMemberSuccess(`✅ ${memberEmail.trim()} added to project!`);
      setMemberEmail("");
      // Refresh tasks to pick up newly added member in dropdown
      fetchTasks(page);
    } catch (e) {
      setMemberError(e.response?.data?.message || "Failed to add member — make sure the user is registered.");
    } finally {
      setAddingMember(false);
    }
  };

  return (
    <div className="min-h-screen">

      {/* Navbar */}
      <nav className="border-b border-white/8 bg-surface-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 shrink-0"
          >
            ← Dashboard
          </button>
          <span className="text-white/20">/</span>

          {/* Editable project name */}
          {isAdmin && editingName ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                autoFocus
                value={editNameVal}
                onChange={(e) => setEditNameVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="input text-sm font-semibold py-1 flex-1"
                placeholder="Project name…"
              />
              <button onClick={handleSaveName} disabled={savingName} className="btn btn-primary btn-sm shrink-0">
                {savingName ? "…" : "Save"}
              </button>
              <button onClick={() => setEditingName(false)} className="btn btn-ghost btn-sm shrink-0">
                Cancel
              </button>
              {nameError && <span className="text-xs text-red-400">{nameError}</span>}
            </div>
          ) : (
            <span
              className={`font-semibold text-gray-200 truncate flex items-center gap-1.5 ${isAdmin ? "cursor-pointer hover:text-white group/name" : ""}`}
              onClick={() => isAdmin && (setEditingName(true), setEditNameVal(projectName))}
              title={isAdmin ? "Click to rename project" : undefined}
            >
              {projectName || "Project"}
              {isAdmin && <span className="text-gray-600 opacity-0 group-hover/name:opacity-100 transition-opacity text-xs">✏️</span>}
            </span>
          )}

          {/* Role badge */}
          {roleLoaded && (
            <span className={`ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isAdmin
                ? "bg-brand-500/15 border-brand-500/40 text-brand-400"
                : "bg-white/5 border-white/15 text-gray-400"
            }`}>
              {isAdmin ? "👑 Admin" : "👤 Member"}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">
              {!roleLoaded
                ? "Loading…"
                : isAdmin
                  ? "Showing all project tasks"
                  : "Showing your assigned tasks"}
            </p>
          </div>
          {/* Only show action buttons once role is confirmed */}
          {roleLoaded && isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddMember(true); setMemberSuccess(""); setMemberError(""); }}
                className="btn btn-ghost"
              >
                👥 Add Member
              </button>
              <button
                id="create-task-btn"
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                + New Task
              </button>
            </div>
          )}
        </div>

        <ErrorMessage message={error} />

        {/* ── Add-member panel ─────────────────────────────────────────────── */}
        {showAddMember && (
          <div className="card mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-200">Add Team Member</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-600 hover:text-gray-300 text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              The user must already be registered in the system. Enter their exact email address.
            </p>
            <form onSubmit={handleAddMember} className="flex gap-3 items-end">
              <div className="flex-1 form-group">
                <label className="label">Member Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => { setMemberEmail(e.target.value); setMemberError(""); setMemberSuccess(""); }}
                  placeholder="colleague@company.com"
                  className="input"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={addingMember || !memberEmail.trim()} className="btn btn-primary">
                {addingMember ? "Adding…" : "Add"}
              </button>
            </form>
            {memberError && (
              <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ⚠️ {memberError}
              </p>
            )}
            {memberSuccess && (
              <p className="mt-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {memberSuccess}
              </p>
            )}
          </div>
        )}

        {/* ── Tasks grid ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-full mb-4" />
                <div className="h-2 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No tasks yet"
            message={
              isAdmin
                ? "Create your first task using the \"+ New Task\" button above."
                : "No tasks have been assigned to you yet."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                currentUserId={user?.id}
                onUpdated={handleTaskUpdated}
                onDelete={handleTaskDeleted}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => fetchTasks(page - 1)}
              disabled={page === 0}
              className="btn btn-ghost btn-sm"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-400">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => fetchTasks(page + 1)}
              disabled={page >= totalPages - 1}
              className="btn btn-ghost btn-sm"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Task creation modal */}
      {showModal && (
        <TaskModal
          projectId={id}
          projectMembers={members}
          onClose={() => setShowModal(false)}
          onCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
          }}
        />
      )}
    </div>
  );
}
