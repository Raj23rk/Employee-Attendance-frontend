import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Tag,
  User,
  Users,
  RefreshCw,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Search,
  Filter,
  Check,
  Activity,
  Eye,
  Layers,
  History,
  RotateCcw,
  Play,
  Send,
  CheckCheck,
} from "lucide-react";
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

export interface KanbanColumnDef {
  key: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  label: string;
  level: number;
  percentage: number;
  bg: string;
  badge: string;
  borderActive: string;
  accentColor: string;
  nextKey: string | null;
  prevKey: string | null;
  nextActionLabel: string | null;
  nextBtnClass: string;
  icon: any;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    key: "TODO",
    label: "To Do",
    level: 1,
    percentage: 25,
    bg: "bg-slate-50/70",
    badge: "bg-slate-100 text-slate-700",
    borderActive: "border-slate-300",
    accentColor: "#64748B",
    nextKey: "IN_PROGRESS",
    prevKey: null,
    nextActionLabel: "Start Task",
    nextBtnClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200",
    icon: Play,
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    level: 2,
    percentage: 50,
    bg: "bg-blue-50/40",
    badge: "bg-blue-100 text-blue-700",
    borderActive: "border-blue-300",
    accentColor: "#2563EB",
    nextKey: "REVIEW",
    prevKey: "TODO",
    nextActionLabel: "Submit for Review",
    nextBtnClass: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200",
    icon: Send,
  },
  {
    key: "REVIEW",
    label: "In Review",
    level: 3,
    percentage: 75,
    bg: "bg-amber-50/40",
    badge: "bg-amber-100 text-amber-700",
    borderActive: "border-amber-300",
    accentColor: "#D97706",
    nextKey: "COMPLETED",
    prevKey: "IN_PROGRESS",
    nextActionLabel: "Approve & Complete",
    nextBtnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
    icon: CheckCheck,
  },
  {
    key: "COMPLETED",
    label: "Completed",
    level: 4,
    percentage: 100,
    bg: "bg-emerald-50/40",
    badge: "bg-emerald-100 text-emerald-700",
    borderActive: "border-emerald-300",
    accentColor: "#059669",
    nextKey: null,
    prevKey: "REVIEW",
    nextActionLabel: null,
    nextBtnClass: "",
    icon: CheckCircle2,
  },
];

function normalizeStatus(status: string): "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" {
  const s = (status || "").toUpperCase().replace(/\s+/g, "_");
  if (s === "BACKLOG") return "TODO";
  if (s === "INPROGRESS" || s === "IN_PROGRESS") return "IN_PROGRESS";
  if (s === "REVIEW" || s === "IN_REVIEW") return "REVIEW";
  if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
  return "TODO";
}

function TasksContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();
  const isManager = role === "manager" || role === "team_manager";
  const isHR = role === "hr" || role === "hr_manager" || role === "admin" || role === "system_admin" || role === "md" || role === "gm";
  const isCEO = role === "ceo" || role === "executive" || role === "md" || role === "gm";
  const isApprover = isManager || isHR || isCEO;

  // Board & Task Data
  const [tasks, setTasks] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>(DEFAULT_STAFF_FALLBACK);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking & Filtering Controls
  const [viewScope, setViewScope] = useState<"ALL" | "MY">(isApprover ? "ALL" : "MY");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Track & Audit Detail Modal
  const [selectedTrackTask, setSelectedTrackTask] = useState<any | null>(null);
  const [trackNote, setTrackNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // HTML5 Drag & Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // New Task Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    project: "HR Portal",
    priority: "MEDIUM",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    assigneeId: "",
  });

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const taskPromise =
        viewScope === "ALL" && isApprover
          ? tasksService.getKanbanTasks()
          : tasksService.getMyTasks();

      const [taskRes, staffRes, userRes, hrCeoRes] = await Promise.allSettled([
        taskPromise,
        usersService.getStaffList(),
        usersService.getAllUsers({ limit: 100 }),
        dashboardService.getHrCeoEmployees(),
      ]);

      if (taskRes.status === "fulfilled" && taskRes.value) {
        const data = taskRes.value?.data || taskRes.value;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.tasks)
          ? data.tasks
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setTasks(list);
      }

      let parsedUsers: any[] = [];
      if (staffRes.status === "fulfilled" && staffRes.value) {
        const staffData = staffRes.value?.data || staffRes.value;
        if (Array.isArray(staffData) && staffData.length > 0) {
          parsedUsers = staffData;
        }
      }

      if (parsedUsers.length === 0 && hrCeoRes.status === "fulfilled" && hrCeoRes.value) {
        const hrData = hrCeoRes.value?.data || hrCeoRes.value;
        if (Array.isArray(hrData) && hrData.length > 0) {
          parsedUsers = hrData;
        }
      }

      if (parsedUsers.length === 0 && userRes.status === "fulfilled" && userRes.value) {
        const uData = userRes.value?.data || userRes.value;
        const usersArray = Array.isArray(uData)
          ? uData
          : Array.isArray(uData?.users)
          ? uData.users
          : Array.isArray(uData?.data)
          ? uData.data
          : [];
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
  }, [viewScope, isApprover]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Unique Projects for filtering
  const projectList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.project) set.add(t.project);
    });
    return Array.from(set);
  }, [tasks]);

  // Status Level Progression Helper
  const getNextColumn = (currentStatus: string) => {
    const norm = normalizeStatus(currentStatus);
    const col = KANBAN_COLUMNS.find((c) => c.key === norm);
    if (!col || !col.nextKey) return null;
    return KANBAN_COLUMNS.find((c) => c.key === col.nextKey) || null;
  };

  const getPrevColumn = (currentStatus: string) => {
    const norm = normalizeStatus(currentStatus);
    const col = KANBAN_COLUMNS.find((c) => c.key === norm);
    if (!col || !col.prevKey) return null;
    return KANBAN_COLUMNS.find((c) => c.key === col.prevKey) || null;
  };

  // Move status handler (with tracking history)
  const handleMoveStatus = async (id: string, newStatus: string, note?: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await tasksService.updateTaskStatus(id, { status: newStatus, note });
      const targetCol = KANBAN_COLUMNS.find((c) => c.key === newStatus);
      const updatedTaskData = res?.data || res?.task;

      toast.success(
        `Task moved to ${targetCol?.label || newStatus} (Level ${targetCol?.level || 1} of 4) 🚀`
      );

      // Synchronize with Track Modal if open
      if (selectedTrackTask && (selectedTrackTask._id === id || selectedTrackTask.id === id)) {
        setSelectedTrackTask((prev: any) => {
          if (!prev) return null;
          const updatedHist = Array.isArray(updatedTaskData?.statusHistory)
            ? updatedTaskData.statusHistory
            : [
                ...(prev.statusHistory || []),
                {
                  status: newStatus,
                  changedByName: user?.name || "You",
                  changedAt: new Date().toISOString(),
                  note: note || `Status advanced to ${newStatus}`,
                },
              ];
          return {
            ...prev,
            status: newStatus,
            statusHistory: updatedHist,
          };
        });
      }

      await fetchTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update task status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Automatic "Next Level" progression
  const handleNextLevel = async (task: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const taskId = task._id || task.id;
    const nextCol = getNextColumn(task.status);
    if (!nextCol) return;
    await handleMoveStatus(
      taskId,
      nextCol.key,
      trackNote.trim() || `Advanced automatically to ${nextCol.label} (Level ${nextCol.level})`
    );
    setTrackNote("");
  };

  // Step back to Previous Level
  const handlePrevLevel = async (task: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const taskId = task._id || task.id;
    const prevCol = getPrevColumn(task.status);
    if (!prevCol) return;
    await handleMoveStatus(
      taskId,
      prevCol.key,
      trackNote.trim() || `Moved back to ${prevCol.label} (Level ${prevCol.level})`
    );
    setTrackNote("");
  };

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
      const assigneeObj = staffList.find(
        (s) => s._id === form.assigneeId || s.id === form.assigneeId || s.employeeId === form.assigneeId
      );
      const assigneeName = isAllStaff ? "ALL Staff Members" : (assigneeObj?.name || "Myself");

      toast.success(`Task created & assigned to ${assigneeName}! Initialized at Level 1 (To Do).`);
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

  // Filtered Tasks according to Search, Project, and Priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (t.title || "").toLowerCase().includes(q);
        const descMatch = (t.description || "").toLowerCase().includes(q);
        const assigneeMatch = (t.assignee?.name || t.assignedTo?.name || t.assigneeName || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !assigneeMatch) return false;
      }
      if (projectFilter !== "ALL" && t.project !== projectFilter) {
        return false;
      }
      if (priorityFilter !== "ALL" && (t.priority || "MEDIUM").toUpperCase() !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, projectFilter, priorityFilter]);

  // Due date indicator
  const getDueBadge = (dueDateStr?: string) => {
    if (!dueDateStr) return <span className="text-slate-400">No deadline</span>;
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return <span>{dueDateStr}</span>;
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-red-600 font-bold flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="text-amber-600 font-bold flex items-center gap-1">
          <Clock className="h-3 w-3" /> Due Today
        </span>
      );
    }
    return (
      <span className="text-slate-500 font-medium">
        Due: {due.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} ({diffDays}d)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2.5 py-0.5 text-xs font-bold text-[#F0834A]">
              <Sparkles className="h-3 w-3" />
              Automated Kanban Task Workflow
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A] mt-1">
            Tasks &amp; Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Track assignments, deliverables, departmental sprints, and institutional action items with automated status progression.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {/* Control Bar: Scope Switcher + Search + Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Scope Toggle: All Company Tasks vs My Tasks */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            {isApprover && (
              <button
                type="button"
                onClick={() => setViewScope("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewScope === "ALL"
                    ? "bg-white text-[#EA6118] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>All Company Tasks</span>
                <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold">
                  {tasks.length}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewScope("MY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewScope === "MY"
                  ? "bg-white text-[#EA6118] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>My Assigned Tasks</span>
            </button>
          </div>

          {/* Quick Tracking Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              To Do: <strong>{tasks.filter((t) => normalizeStatus(t.status) === "TODO").length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              In Progress: <strong>{tasks.filter((t) => normalizeStatus(t.status) === "IN_PROGRESS").length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              In Review: <strong>{tasks.filter((t) => normalizeStatus(t.status) === "REVIEW").length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Completed: <strong>{tasks.filter((t) => normalizeStatus(t.status) === "COMPLETED").length}</strong>
            </span>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, deliverables, or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#EA6118] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#EA6118]"
              >
                <option value="ALL">All Projects</option>
                {projectList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#EA6118]"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {(searchQuery || projectFilter !== "ALL" || priorityFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setProjectFilter("ALL");
                  setPriorityFilter("ALL");
                }}
                className="text-[11px] font-bold text-[#EA6118] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns with Drag & Drop */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => normalizeStatus(t.status) === col.key);
            const isDragOver = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(col.key);
                }}
                onDragLeave={() => {
                  if (dragOverColumn === col.key) setDragOverColumn(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const droppedId = e.dataTransfer.getData("text/plain") || draggedTaskId;
                  if (droppedId) {
                    handleMoveStatus(droppedId, col.key, `Dragged automatically to ${col.label}`);
                  }
                }}
                className={`rounded-3xl border ${col.bg} p-4 flex flex-col min-h-[560px] transition-all duration-200 ${
                  isDragOver
                    ? "ring-2 ring-[#EA6118] border-[#EA6118] bg-orange-50/50 shadow-md scale-[1.01]"
                    : "border-slate-200"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: col.accentColor }}
                    />
                    <span className="font-bold text-xs text-slate-900">{col.label}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      (Level {col.level})
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.map((task: any) => {
                    const taskId = task._id || task.id;
                    const nextCol = getNextColumn(task.status);
                    const prevCol = getPrevColumn(task.status);

                    return (
                      <div
                        key={taskId}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", taskId);
                          setDraggedTaskId(taskId);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => setSelectedTrackTask(task)}
                        className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-3 text-xs cursor-pointer active:cursor-grabbing"
                      >
                        {/* Card Header: Project + Priority + Level Badge */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded bg-orange-100 text-[#EA6118] px-2 py-0.5 text-[10px] font-bold">
                              {task.project || "Campus"}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                (task.priority || "MEDIUM").toUpperCase() === "URGENT"
                                  ? "bg-red-100 text-red-700"
                                  : (task.priority || "MEDIUM").toUpperCase() === "HIGH"
                                  ? "bg-orange-100 text-orange-700"
                                  : (task.priority || "MEDIUM").toUpperCase() === "LOW"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {task.priority || "MEDIUM"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              L{col.level}/4
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="font-bold text-slate-900 leading-snug group-hover:text-[#EA6118] transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Visual Progress Stepper (4 Levels) */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-500">
                              Stage: <strong className="text-slate-800">{col.label}</strong>
                            </span>
                            <span className="font-bold text-[#EA6118]">{col.percentage}%</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-full rounded-full transition-all ${
                                  step <= col.level
                                    ? col.level === 4
                                      ? "bg-emerald-500"
                                      : col.level === 3
                                      ? "bg-amber-500"
                                      : col.level === 2
                                      ? "bg-blue-500"
                                      : "bg-slate-700"
                                    : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Meta: Due Date & Assignee */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between gap-1 flex-wrap text-[10px]">
                            {getDueBadge(task.dueDate)}
                            {(task.assignee?.name || task.assignedTo?.name || task.assigneeName) && (
                              <span className="text-[#EA6118] font-bold flex items-center gap-1 max-w-[130px] truncate">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {task.assignee?.name || task.assignedTo?.name || task.assigneeName}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* AUTOMATIC NEXT LEVEL & TRACK BUTTONS */}
                        <div
                          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Track Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedTrackTask(task)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            title="View audit track & status timeline"
                          >
                            <Activity className="h-3 w-3 text-[#EA6118]" />
                            <span>Track</span>
                          </button>

                          {/* Next Level Progression Action */}
                          <div className="flex items-center gap-1 ml-auto">
                            {/* Step Back (Previous Level) */}
                            {prevCol && (
                              <button
                                type="button"
                                onClick={(e) => handlePrevLevel(task, e)}
                                title={`Step back to ${prevCol.label}`}
                                className="h-6 w-6 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold transition-colors"
                              >
                                ‹
                              </button>
                            )}

                            {/* Move to Next Level Automatically */}
                            {nextCol ? (
                              <button
                                type="button"
                                onClick={(e) => handleNextLevel(task, e)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${col.nextBtnClass}`}
                                title={`Advance automatically to ${nextCol.label} (Level ${nextCol.level})`}
                              >
                                <span>{col.nextActionLabel || "Next Level"}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                                <CheckCircle2 className="h-3 w-3" />
                                Done
                              </span>
                            )}

                            {/* Direct Dropdown Switcher */}
                            <select
                              value={col.key}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleMoveStatus(taskId, e.target.value);
                              }}
                              className="rounded border border-slate-200 px-1 py-0.5 text-[9px] bg-white text-slate-700 focus:outline-none cursor-pointer"
                              title="Direct jump to any status"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">Review</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <col.icon className="h-6 w-6 text-slate-300 mb-2 opacity-50" />
                      <p className="text-xs text-slate-400 font-medium">No tasks in {col.label}</p>
                      <span className="text-[10px] text-slate-300 mt-0.5">
                        Drag cards here or click Next Level
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRACK & AUDIT TIMELINE MODAL */}
      {selectedTrackTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#EA6118]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded bg-orange-100 text-[#EA6118] px-2 py-0.5 text-[10px] font-bold">
                      {selectedTrackTask.project || "Campus"}
                    </span>
                    <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {selectedTrackTask.priority || "MEDIUM"}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#12173A] mt-0.5">
                    Task Tracking &amp; Status Pipeline
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrackTask(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Task Title & Details */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm leading-snug">
                {selectedTrackTask.title}
              </h4>
              {selectedTrackTask.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedTrackTask.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assignee</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3 text-[#EA6118]" />
                    {selectedTrackTask.assignee?.name ||
                      selectedTrackTask.assignedTo?.name ||
                      selectedTrackTask.assigneeName ||
                      "Unassigned"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Deadline</span>
                  <div className="mt-0.5">{getDueBadge(selectedTrackTask.dueDate)}</div>
                </div>
              </div>
            </div>

            {/* 4-LEVEL VISUAL STEPPER TRACKER */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Automated Level Tracker
              </span>

              {(() => {
                const normCurrent = normalizeStatus(selectedTrackTask.status);
                const currentIdx = KANBAN_COLUMNS.findIndex((c) => c.key === normCurrent);
                const nextCol = getNextColumn(selectedTrackTask.status);
                const prevCol = getPrevColumn(selectedTrackTask.status);

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {KANBAN_COLUMNS.map((col, idx) => {
                        const isDone = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div
                            key={col.key}
                            onClick={() =>
                              handleMoveStatus(
                                selectedTrackTask._id || selectedTrackTask.id,
                                col.key,
                                `Moved directly to ${col.label}`
                              )
                            }
                            className={`rounded-2xl p-3 border text-center transition-all cursor-pointer ${
                              isCurrent
                                ? "border-[#EA6118] bg-orange-50/70 shadow-sm"
                                : isDone
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex justify-center mb-1">
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : isCurrent ? (
                                <span className="h-4 w-4 rounded-full bg-[#EA6118] text-white text-[10px] font-bold flex items-center justify-center">
                                  {col.level}
                                </span>
                              ) : (
                                <span className="h-4 w-4 rounded-full bg-slate-300 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                                  {col.level}
                                </span>
                              )}
                            </div>
                            <span
                              className={`block text-[11px] font-bold ${
                                isCurrent
                                  ? "text-[#EA6118]"
                                  : isDone
                                  ? "text-emerald-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {col.label}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {col.percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Progress Action Button */}
                    <div className="flex items-center gap-2 pt-1">
                      {prevCol && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdatingStatus}
                          onClick={() =>
                            handleMoveStatus(
                              selectedTrackTask._id || selectedTrackTask.id,
                              prevCol.key,
                              `Moved back to ${prevCol.label}`
                            )
                          }
                          className="text-xs"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Back to {prevCol.label}</span>
                        </Button>
                      )}

                      {nextCol ? (
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleNextLevel(selectedTrackTask)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#EA6118] hover:bg-[#d55210] text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          <span>Advance to Level {nextCol.level}: {nextCol.label}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Task Completed (100%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Optional Progress Note Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <span>Update / Progression Note (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Completed initial design, ready for review..."
                value={trackNote}
                onChange={(e) => setTrackNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-slate-50"
              />
            </div>

            {/* STATUS TRANSITION AUDIT TRAIL / TIMELINE */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-[#EA6118]" />
                  <span>Status History &amp; Audit Trail</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedTrackTask.statusHistory?.length || 1} logged action(s)
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {Array.isArray(selectedTrackTask.statusHistory) &&
                selectedTrackTask.statusHistory.length > 0 ? (
                  selectedTrackTask.statusHistory.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs p-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#EA6118] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-bold text-slate-800">
                            {item.status || "Status Update"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.changedAt
                              ? new Date(item.changedAt).toLocaleString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recently"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.note || "Automated status progression"}
                        </p>
                        {item.changedByName && (
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            By: {item.changedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-2.5 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="h-2 w-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">
                        Initialized in {selectedTrackTask.status || "TODO"}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Created on {selectedTrackTask.createdAt ? new Date(selectedTrackTask.createdAt).toLocaleDateString() : "Active Sprint"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedTrackTask(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW TASK MODAL */}
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
