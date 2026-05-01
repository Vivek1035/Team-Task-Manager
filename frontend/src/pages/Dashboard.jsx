import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getProjects, createProject, deleteProject } from "../api/projectApi";
import { getStats } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import PriorityBadge from "../components/PriorityBadge";

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

// ── Custom tooltip for charts ─────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 border border-white/15 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill ?? payload[0].fill }}>
        {payload[0].value} task{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className={`card flex items-center gap-4 border-l-4 ${color}`}>
      <span className="text-3xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-0.5">{value ?? "—"}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
      <div className="h-3 bg-white/5 rounded w-full mb-2" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  );
}

export default function Dashboard() {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ name: "", description: "", priority: "MEDIUM" });
  const [formError, setFormError] = useState("");

  // Stats
  const [stats, setStats]         = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then((r) => setProjects(r.data))
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoading(false));

    getStats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Project name is required");
    setCreating(true);
    setFormError("");
    try {
      const r = await createProject(form);
      setProjects((p) => [r.data, ...p]);
      setShowCreate(false);
      setForm({ name: "", description: "", priority: "MEDIUM" });
    } catch (e) {
      setFormError(e.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await deleteProject(id);
      setProjects((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete project");
    }
  };

  // Chart data
  const total      = stats?.total      ?? 0;
  const done       = stats?.done       ?? 0;
  const pending    = stats?.pending    ?? 0;
  const inProgress = stats?.inProgress ?? 0;

  const pieData = [
    { name: "Completed",   value: done,       fill: "#10b981" },
    { name: "In Progress", value: inProgress,  fill: "#6366f1" },
    { name: "Pending",     value: pending,     fill: "#6b7280" },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "High",   count: stats?.high   ?? 0, fill: "#f87171" },
    { name: "Medium", count: stats?.medium ?? 0, fill: "#fbbf24" },
    { name: "Low",    count: stats?.low    ?? 0, fill: "#34d399" },
  ];

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-white/8 bg-surface-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="font-bold text-white">TaskFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              👋 <span className="text-gray-200">{user?.name}</span>
            </span>
            <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Section: Stats Overview ─────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Overview
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="card animate-pulse h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="📋" label="Total Tasks" value={total}
                color="border-brand-500"
                sub={`across ${projects.length} project${projects.length !== 1 ? "s" : ""}`}
              />
              <StatCard
                icon="✅" label="Completed" value={done}
                color="border-emerald-500"
                sub={total > 0 ? `${completionRate}% completion rate` : "No tasks yet"}
              />
              <StatCard
                icon="⏳" label="In Progress" value={inProgress}
                color="border-indigo-500"
              />
              <StatCard
                icon="🔴" label="Pending" value={pending}
                color="border-gray-600"
              />
            </div>
          )}
        </section>

        {/* ── Section: Charts ─────────────────────────────────────────────── */}
        {!statsLoading && total > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Pie — task status */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">Task Status</h3>
              <p className="text-xs text-gray-600 mb-5">Distribution by completion state</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Completion ring label */}
              <div className="flex justify-center mt-2">
                <span className="text-xs text-gray-500">
                  <span className="text-emerald-400 font-bold text-sm">{completionRate}%</span> completed
                </span>
              </div>
            </div>

            {/* Bar — task priority */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-300 mb-1">Priority Breakdown</h3>
              <p className="text-xs text-gray-600 mb-5">Number of tasks per priority level</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {barData.map((d) => (
                  <span key={d.name} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    {d.name}: <span className="text-gray-300 font-medium">{d.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Section: Projects ────────────────────────────────────────────── */}
        <section>
          <div className="page-header">
            <div>
              <h1 className="page-title">My Projects</h1>
              <p className="text-sm text-gray-500 mt-1">
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              id="create-project-btn"
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
            >
              + New Project
            </button>
          </div>

          <ErrorMessage message={error} />

          {/* Create project modal */}
          {showCreate && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
              <div className="modal-box">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">New Project</h2>
                  <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300 text-xl">&times;</button>
                </div>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="form-group">
                    <label className="label">Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Backend Refactor"
                      className="input"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="input resize-none"
                      placeholder="Optional…"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      className="select"
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <ErrorMessage message={formError} />
                  <div className="flex gap-3 justify-end mt-1">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost">Cancel</button>
                    <button type="submit" disabled={creating} className="btn btn-primary">
                      {creating ? "Creating…" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Projects grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <ProjectSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              message="Create your first project to start managing tasks."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    sessionStorage.setItem(`project_${p.id}`, p.name);
                    navigate(`/projects/${p.id}`);
                  }}
                  className="card-hover group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                      {p.name}
                    </h2>
                    <PriorityBadge priority={p.priority} />
                  </div>
                  {p.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-600">
                      by {p.createdByName}
                      {p.createdById === user?.id && (
                        <span className="ml-1.5 text-brand-400 font-medium">(you · Admin)</span>
                      )}
                    </span>
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="btn btn-danger btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
