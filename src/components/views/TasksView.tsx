import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Target, Plus, CheckCircle2, Clock, AlertCircle, Sparkles, Tag, User, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { tasksService } from "@/services/tasks.service";
import { useToast } from "@/context/ToastContext";

function TasksContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    project: "HR Portal",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    assigneeId: "",
  });

  const columns = [
    { key: "TODO", label: "To Do", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-700" },
    { key: "IN_PROGRESS", label: "In Progress", bg: "bg-blue-50/50", badge: "bg-blue-100 text-blue-700" },
    { key: "REVIEW", label: "In Review", bg: "bg-amber-50/50", badge: "bg-amber-100 text-amber-700" },
    { key: "COMPLETED", label: "Completed", bg: "bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-700" },
  ];

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await tasksService.getMyTasks();
      const data = res?.data || res;
      setTasks(Array.isArray(data) ? data : (Array.isArray(data?.tasks) ? data.tasks : []));
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await tasksService.createTask(form);
      toast.success("Task created successfully!");
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        project: "HR Portal",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        assigneeId: "",
      });
      await fetchTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveStatus = async (id: string, newStatus: string) => {
    try {
      await tasksService.updateTaskStatus(id, { status: newStatus });
      toast.success("Task status updated!");
      await fetchTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update task status.");
    }
  };

  const normalizeStatus = (status: string) => {
    const s = (status || "").toUpperCase().replace(/\s+/g, "_");
    if (s === "BACKLOG") return "TODO";
    if (s === "INPROGRESS" || s === "IN_PROGRESS") return "IN_PROGRESS";
    if (s === "REVIEW" || s === "IN_REVIEW") return "REVIEW";
    if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
    return "TODO";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Tasks &amp; Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Track assignments, deliverables, departmental sprints, and institutional action items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => normalizeStatus(t.status) === col.key);
            return (
              <div key={col.key} className={`rounded-3xl border border-slate-200 ${col.bg} p-4 flex flex-col min-h-[500px]`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-900">{col.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task: any) => {
                    const taskId = task._id || task.id;
                    return (
                      <div
                        key={taskId}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">
                            {task.project || "Campus"}
                          </span>
                          <span className="text-[10px] font-bold text-red-600">
                            {task.priority || "MEDIUM"}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 leading-snug">{task.title}</h4>
                          {task.description && (
                            <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Upcoming"}</span>
                          
                          {/* Quick Move Trigger */}
                          <select
                            value={col.key}
                            onChange={(e) => handleMoveStatus(taskId, e.target.value)}
                            className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] bg-white text-slate-700 focus:outline-none"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-12">No tasks in {col.label}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Create New Task
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build Attendance Report Export"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Project / Tag</label>
                  <input
                    type="text"
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Task details and expectations..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function TasksView() {
  return (
    <AuthProvider>
      <AppShell>
        <TasksContent />
      </AppShell>
    </AuthProvider>
  );
}
export default TasksView;
