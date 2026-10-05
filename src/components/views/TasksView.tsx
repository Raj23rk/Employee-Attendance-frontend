import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Target, Plus, CheckCircle2, Clock, AlertCircle, Sparkles, Tag, User, Users, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users.service";
import { dashboardService } from "@/services/dashboard.service";
import { useToast } from "@/context/ToastContext";
import { formatRoleLabel } from "@/lib/constants";

const DEFAULT_STAFF_FALLBACK: any[] = [
  { _id: "st-1", id: "st-1", name: "Dr. Thavabalan", email: "dr.thavabalan@gmail.com", employeeId: "WG26001", role: "md", department: "Executive Board / MD" },
  { _id: "st-2", id: "st-2", name: "Rajesh Varma", email: "rajesh.v@wegrow.edu.in", employeeId: "WG26002", role: "gm", department: "Campus Administration / GM" },
  { _id: "st-3", id: "st-3", name: "Priya Sharma", email: "priya.sharma@wegrow.edu.in", employeeId: "WG-FAC-014", role: "hr_manager", department: "Human Resources" },
  { _id: "st-4", id: "st-4", name: "Vijay Kumaran", email: "vijay.k@wegrow.edu.in", employeeId: "WG-FAC-028", role: "manager", department: "Computer Applications" },
  { _id: "st-5", id: "st-5", name: "Sneha Reddy", email: "sneha.r@wegrow.edu.in", employeeId: "WG-ENG-042", role: "employee", department: "Computer Applications" },
  { _id: "st-6", id: "st-6", name: "Karthik Sundaram", email: "karthik.s@wegrow.edu.in", employeeId: "WG-AI-019", role: "employee", department: "Artificial Intelligence" },
  { _id: "st-7", id: "st-7", name: "Ananya Iyer", email: "ananya.i@wegrow.edu.in", employeeId: "WG-ADM-008", role: "employee", department: "Academic Compliance" },
  { _id: "st-8", id: "st-8", name: "Deepa Mohan", email: "deepa.m@wegrow.edu.in", employeeId: "WG-FIN-005", role: "accountant", department: "Finance & Accounts" },
];

function TasksContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>(DEFAULT_STAFF_FALLBACK);
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
      const [taskRes, staffRes, userRes, hrCeoRes] = await Promise.allSettled([
        tasksService.getMyTasks(),
        usersService.getStaffList(),
        usersService.getAllUsers({ limit: 100 }),
        dashboardService.getHrCeoEmployees(),
      ]);

      if (taskRes.status === "fulfilled" && taskRes.value) {
        const data = taskRes.value?.data || taskRes.value;
        setTasks(Array.isArray(data) ? data : (Array.isArray(data?.tasks) ? data.tasks : []));
      }

      let parsedUsers: any[] = [];
      
      // 1. Prioritize /users/staff-list
      if (staffRes.status === "fulfilled" && staffRes.value) {
        const staffData = staffRes.value?.data || staffRes.value;
        if (Array.isArray(staffData) && staffData.length > 0) {
          parsedUsers = staffData;
        }
      }

      // 2. Secondary fallback to HR/CEO employee roster
      if (parsedUsers.length === 0 && hrCeoRes.status === "fulfilled" && hrCeoRes.value) {
        const hrData = hrCeoRes.value?.data || hrCeoRes.value;
        if (Array.isArray(hrData) && hrData.length > 0) {
          parsedUsers = hrData;
        }
      }

      // 3. Fallback to /users
      if (parsedUsers.length === 0 && userRes.status === "fulfilled" && userRes.value) {
        const uData = userRes.value?.data || userRes.value;
        const usersArray = Array.isArray(uData)
          ? uData
          : (Array.isArray(uData?.users) ? uData.users : (Array.isArray(uData?.data) ? uData.data : []));
        if (usersArray.length > 0) {
          parsedUsers = usersArray;
        }
      }

      if (parsedUsers.length === 0) {
        setStaffList(DEFAULT_STAFF_FALLBACK);
      } else {
        const map = new Map<string, any>();
        parsedUsers.forEach((u) => {
          const key = (u.employeeId || u._id || u.id || u.email || "").toLowerCase();
          if (key) map.set(key, u);
        });
        DEFAULT_STAFF_FALLBACK.forEach((u) => {
          const key = (u.employeeId || u._id || u.id || u.email || "").toLowerCase();
          if (!map.has(key)) map.set(key, u);
        });
        setStaffList(Array.from(map.values()));
      }
    } catch (err) {
      console.error("Failed to load tasks/users:", err);
      setStaffList(DEFAULT_STAFF_FALLBACK);
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
      const isAllStaff = form.assigneeId === "ALL_STAFF";
      const payload = {
        title: form.title,
        description: form.description,
        project: form.project,
        priority: form.priority,
        dueDate: form.dueDate,
        assigneeId: isAllStaff ? "ALL_STAFF" : (form.assigneeId || undefined),
        assignedTo: isAllStaff ? "ALL_STAFF" : (form.assigneeId || undefined),
      };

      await tasksService.createTask(payload);
      const assigneeObj = staffList.find((s) => s._id === form.assigneeId || s.id === form.assigneeId || s.employeeId === form.assigneeId);
      const assigneeName = isAllStaff ? "ALL Staff Members" : (assigneeObj?.name || "Myself");

      toast.success(`Task created & assigned to ${assigneeName}!`);
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
                          <div className="flex flex-col gap-0.5">
                            <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Upcoming"}</span>
                            {(task.assignee?.name || task.assignedTo?.name || task.assigneeName) && (
                              <span className="text-[#EA6118] font-bold flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{task.assignee?.name || task.assignedTo?.name || task.assigneeName}</span>
                              </span>
                            )}
                          </div>
                          
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#12173A]">
                  Create New Task
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign deliverables to staff members with automated status tracking.
                </p>
              </div>
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

              {/* Staff / Assignee Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#EA6118]" />
                    <span>Assign To (Staff Member)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Assign to Myself / Unassigned --</option>
                  <option value="ALL_STAFF">👥 ALL Staff Members (Broadcast Task to Everyone)</option>
                  <optgroup label="── Institutional Staff &amp; Faculty Roster ──">
                    {staffList.map((st: any) => {
                      const stId = st._id || st.id || st.employeeId || st.email;
                      const roleLabel = formatRoleLabel(st.role || st.designation);
                      const dept = st.department || st.designation || "General";
                      return (
                        <option key={stId} value={stId}>
                          {st.name} ({st.employeeId || "STAFF"}) • {roleLabel} - {dept}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold"
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
    <AppShell>
      <TasksContent />
    </AppShell>
  );
}
export default TasksView;
