import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Check,
  X,
  Sparkles,
  Shield,
  Heart,
  Baby,
  RefreshCw,
  AlertTriangle,
  Bell,
  Send,
  UserCheck,
  Crown,
  Briefcase,
  Calendar,
  Award,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { leavesService } from "@/services/leaves.service";
import { attendanceService } from "@/services/attendance.service";
import { useToast } from "@/context/ToastContext";
import { DEFAULT_PUBLIC_HOLIDAYS_2026, type PublicHoliday } from "@/lib/constants";

function LeaveContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();
  const isManager = role === "manager" || role === "team_manager";
  const isHR = role === "hr" || role === "hr_manager" || role === "admin" || role === "system_admin" || role === "md" || role === "gm";
  const isCEO = role === "ceo" || role === "executive" || role === "md" || role === "gm";
  const isApprover = isManager || isHR || isCEO;
  const isFemale = user?.gender?.toLowerCase() === "female";

  const defaultTab = isApprover ? "team_approvals" : "my_leaves";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);

  // Live Data States
  const [balances, setBalances] = useState<any>(null);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [myPermissions, setMyPermissions] = useState<any[]>([]);
  const [permissionQuota, setPermissionQuota] = useState<{
    allowedHours: number;
    usedHours: number;
    remainingHours: number;
    exceeded: boolean;
  }>({
    allowedHours: 2,
    usedHours: 0,
    remainingHours: 2,
    exceeded: false,
  });
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [teamPermissions, setTeamPermissions] = useState<any[]>([]);
  const [teamSubTab, setTeamSubTab] = useState<"permissions" | "leaves">("permissions");
  const [permissionFilter, setPermissionFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [calendarLeaves, setCalendarLeaves] = useState<any[]>([]);

  // Permission Form State (Max 2 permissions / month, each 1 hour)
  const [permissionForm, setPermissionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    fromTime: "09:40",
    toTime: "10:40",
    slotPreset: "morning" as "morning" | "evening" | "custom",
    reason: "",
  });

  // Form State
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [halfDaySession, setHalfDaySession] = useState<"FIRST_HALF" | "SECOND_HALF">("FIRST_HALF");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<string[]>(["HR", "MD", "GM", "MANAGER"]);
  const [sendNotification, setSendNotification] = useState<boolean>(true);

  const [permissionAssignedRoles, setPermissionAssignedRoles] = useState<string[]>(["HR", "MD", "GM", "MANAGER"]);
  const [permissionSendNotification, setPermissionSendNotification] = useState<boolean>(true);

  const toggleAssignedRole = (roleKey: string) => {
    setAssignedRoles((prev) =>
      prev.includes(roleKey)
        ? prev.length > 1
          ? prev.filter((r) => r !== roleKey)
          : prev // Keep at least one role selected
        : [...prev, roleKey]
    );
  };

  const togglePermissionAssignedRole = (roleKey: string) => {
    setPermissionAssignedRoles((prev) =>
      prev.includes(roleKey)
        ? prev.length > 1
          ? prev.filter((r) => r !== roleKey)
          : prev // Keep at least one role selected
        : [...prev, roleKey]
    );
  };

  // Public Holidays State
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wegrow_public_holidays");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_PUBLIC_HOLIDAYS_2026;
  });
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidaySearch, setHolidaySearch] = useState("");
  const [holidayCategoryFilter, setHolidayCategoryFilter] = useState("ALL");
  const [holidayForm, setHolidayForm] = useState<{
    name: string;
    date: string;
    type: "NATIONAL" | "FESTIVAL" | "INSTITUTIONAL" | "GAZETTED";
    description: string;
  }>({
    name: "",
    date: new Date().toISOString().split("T")[0],
    type: "FESTIVAL",
    description: "",
  });

  const handleAddPublicHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.date) return;
    const dateObj = new Date(holidayForm.date);
    const dayOfWeek = isNaN(dateObj.getTime())
      ? "Official"
      : dateObj.toLocaleDateString("en-US", { weekday: "long" });

    const newHoliday: PublicHoliday = {
      id: `hol-${Date.now()}`,
      name: holidayForm.name.trim(),
      date: holidayForm.date,
      dayOfWeek,
      type: holidayForm.type,
      description: holidayForm.description.trim() || "Official Campus Public Holiday",
    };

    const updated = [...publicHolidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
    setPublicHolidays(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("wegrow_public_holidays", JSON.stringify(updated));
    }
    toast.success(`Public Holiday "${newHoliday.name}" added to the calendar!`);
    setShowAddHolidayModal(false);
    setHolidayForm({
      name: "",
      date: new Date().toISOString().split("T")[0],
      type: "FESTIVAL",
      description: "",
    });
  };

  const fetchLeaveData = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    try {
      const [balRes, histRes, teamRes, calRes, myPermRes, teamPermRes] = await Promise.allSettled([
        leavesService.getBalances(),
        leavesService.getMyHistory(),
        isApprover ? leavesService.getTeamRequests() : Promise.resolve(null),
        leavesService.getCalendar(now.getMonth() + 1, now.getFullYear()),
        attendanceService.getMyPermissions({ month: now.getMonth() + 1, year: now.getFullYear() }),
        isApprover ? attendanceService.getTeamPermissions({ status: "ALL" }) : Promise.resolve(null),
      ]);

      if (balRes.status === "fulfilled" && balRes.value) {
        setBalances(balRes.value.data || balRes.value);
      }
      if (histRes.status === "fulfilled" && histRes.value) {
        const data = histRes.value.data || histRes.value;
        setMyLeaves(Array.isArray(data) ? data : []);
      }
      if (teamRes.status === "fulfilled" && teamRes.value) {
        const data = teamRes.value.data || teamRes.value;
        setTeamRequests(Array.isArray(data) ? data : []);
      }
      if (calRes.status === "fulfilled" && calRes.value) {
        const data = calRes.value.data || calRes.value;
        setCalendarLeaves(Array.isArray(data) ? data : []);
      }
      if (myPermRes.status === "fulfilled" && myPermRes.value) {
        const resData = myPermRes.value;
        const payload = resData?.data || resData?.permissions || resData;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.permissions)
          ? payload.permissions
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setMyPermissions(list);

        const usedFromList = list
          .filter((p: any) => p.status === "APPROVED" || p.status === "PENDING" || !p.status)
          .reduce((sum: number, p: any) => sum + (Number(p.durationHours) || Number(p.duration) || 1), 0);

        if (resData?.quota && typeof resData.quota.usedHours === "number") {
          setPermissionQuota(resData.quota);
        } else {
          setPermissionQuota({
            allowedHours: 2,
            usedHours: usedFromList,
            remainingHours: Math.max(0, 2 - usedFromList),
            exceeded: usedFromList > 2,
          });
        }
      }
      if (teamPermRes.status === "fulfilled" && teamPermRes.value) {
        const payload = teamPermRes.value?.data || teamPermRes.value?.permissions || teamPermRes.value;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.permissions)
          ? payload.permissions
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setTeamPermissions(list);
      }
    } catch (err) {
      console.error("Failed to load leave data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isApprover]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  // Calculations for KPI Cards
  const casualLeavesUsed =
    balances?.casualLeavesUsed ??
    balances?.casualUsed ??
    user?.monthlyStats?.casualLeavesUsed ??
    myLeaves
      .filter((l) => (l.leaveType === "CASUAL" || l.type === "CASUAL") && (l.status === "APPROVED" || l.status === "Approved"))
      .reduce((acc, curr) => acc + (curr.paidDays !== undefined ? curr.paidDays : curr.days || 1), 0);

  const myMonthlyActivePermissions = myPermissions.filter(
    (p: any) => p.status === "APPROVED" || p.status === "PENDING" || !p.status
  );

  const calculatedActivePermHours = myMonthlyActivePermissions.reduce(
    (acc, p) => acc + (Number(p.durationHours) || Number(p.duration) || 1),
    0
  );

  const permissionHoursUsed =
    typeof permissionQuota?.usedHours === "number" && permissionQuota.usedHours > 0
      ? permissionQuota.usedHours
      : calculatedActivePermHours > 0
      ? calculatedActivePermHours
      : (balances?.permissionHoursUsed ?? balances?.permissionHours ?? user?.monthlyStats?.permissionHoursUsed ?? 0);

  // Rule: Permission exceeding 2 hours triggers 0.5 day (Half-Day) LOP deduction
  const permissionDeductionDays = permissionHoursUsed > 2 ? 0.5 : 0;

  // Total LOP days from approved leaves + user monthly stats
  const leaveLopDays =
    balances?.lopDays ??
    user?.monthlyStats?.lopDays ??
    myLeaves
      .filter((l) => (l.status === "APPROVED" || l.status === "Approved") && (l.isLop || l.lopDays || l.leaveType === "UNPAID"))
      .reduce((acc, curr) => acc + (curr.lopDays !== undefined ? curr.lopDays : (curr.isLop || curr.leaveType === "UNPAID" ? curr.days || 1 : 0)), 0);

  const lateCount = user?.monthlyStats?.lateCount ?? balances?.lateCount ?? 0;
  // Late deduction: >= 4 late check-ins -> 0.5 day deduction
  const lateDeductionDays = lateCount >= 4 ? 0.5 : 0;

  const totalLopAndDeductions = leaveLopDays + permissionDeductionDays + lateDeductionDays;

  // Month total working days (excluding Sundays)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const totalDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let standardWorkingDaysInMonth = 0;
  for (let d = 1; d <= totalDaysInCurrentMonth; d++) {
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
    if (dayOfWeek !== 0) standardWorkingDaysInMonth++;
  }
  const baseWorkingDays = balances?.totalWorkingDays ?? balances?.workingDays ?? standardWorkingDaysInMonth;
  const effectiveWorkingDays = Math.max(0, baseWorkingDays - totalLopAndDeductions);

  // Permission Quota calculations (Max 2 permissions / month, each 1 hour)
  const permissionCountUsed =
    myMonthlyActivePermissions.length > 0
      ? myMonthlyActivePermissions.length
      : Math.min(2, Math.floor(permissionHoursUsed));
  const permissionsRemaining = Math.max(0, 2 - permissionCountUsed);

  const handleSlotPresetChange = (preset: "morning" | "evening" | "custom") => {
    if (preset === "morning") {
      setPermissionForm((prev) => ({ ...prev, slotPreset: "morning", fromTime: "09:40", toTime: "10:40" }));
    } else if (preset === "evening") {
      setPermissionForm((prev) => ({ ...prev, slotPreset: "evening", fromTime: "18:00", toTime: "19:00" }));
    } else {
      setPermissionForm((prev) => ({ ...prev, slotPreset: "custom" }));
    }
  };

  const handleApplyPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPermission(true);
    try {
      await attendanceService.submitPermissionRequest({
        date: permissionForm.date,
        fromTime: permissionForm.fromTime,
        toTime: permissionForm.toTime,
        startTime: permissionForm.fromTime,
        endTime: permissionForm.toTime,
        durationHours: 1.0, // 1 hour standard permission
        duration: 1.0,
        reason: permissionForm.reason,
        approvers: permissionAssignedRoles,
        assignedRoles: permissionAssignedRoles,
        approverRole: permissionAssignedRoles.join(", "),
        sendNotification: permissionSendNotification,
      });
      toast.success(
        permissionSendNotification
          ? `1-Hour Permission submitted & notifications sent to ${permissionAssignedRoles.join(", ")}!`
          : "1-Hour Permission request submitted successfully!"
      );
      setShowPermissionModal(false);
      setPermissionForm({
        date: new Date().toISOString().split("T")[0],
        fromTime: "09:40",
        toTime: "10:40",
        slotPreset: "morning",
        reason: "",
      });
      await fetchLeaveData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit permission request.");
    } finally {
      setIsSubmittingPermission(false);
    }
  };

  const isHalfDay = leaveType === "HALF_DAY";
  const calculatedDays = isHalfDay
    ? 0.5
    : fromDate && toDate
    ? Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const effectiveToDate = isHalfDay ? fromDate : toDate;
      await leavesService.applyLeave({
        leaveType,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : undefined,
        fromDate,
        toDate: effectiveToDate,
        days: isHalfDay ? 0.5 : calculatedDays,
        reason,
        assignedRoles,
        approverRole: assignedRoles.join(", "),
        sendNotification,
      });
      toast.success(
        sendNotification
          ? `Leave submitted (${isHalfDay ? `Half Day - ${halfDaySession === "FIRST_HALF" ? "Morning" : "Afternoon"}` : `${calculatedDays} Day(s)`}) & notifications sent to ${assignedRoles.join(", ")}!`
          : "Leave application submitted successfully!"
      );
      setShowModal(false);
      setFromDate("");
      setToDate("");
      setReason("");
      setLeaveType("CASUAL");
      setHalfDaySession("FIRST_HALF");
      await fetchLeaveData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit leave application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave application?")) return;
    try {
      await leavesService.cancelLeave(id);
      toast.info("Leave cancelled successfully.");
      await fetchLeaveData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel leave.");
    }
  };

  const handleReviewLeave = async (
    id: string,
    action: "APPROVE" | "REJECT",
    markAsLop?: boolean,
    customPayload?: { paidDays?: number; lopDays?: number }
  ) => {
    try {
      const isSplit = customPayload?.paidDays !== undefined && customPayload?.lopDays !== undefined && customPayload.paidDays > 0 && customPayload.lopDays > 0;
      const comments =
        action === "APPROVE"
          ? isSplit
            ? `Approved as Split: ${customPayload.paidDays} Day Paid Casual + ${customPayload.lopDays} Day Loss of Pay`
            : markAsLop === true
            ? "Approved as Loss of Pay (LOP)"
            : "Approved as Paid Leave"
          : "Rejected by reviewer";

      await leavesService.reviewLeave(id, {
        action,
        comments,
        markAsLop: markAsLop ?? (customPayload?.lopDays ? true : false),
        ...(customPayload || {}),
      });
      toast.success(
        action === "APPROVE"
          ? isSplit
            ? `Leave approved with 1 Paid & 1 LOP split preserved.`
            : `Leave request approved.`
          : `Leave request rejected.`
      );
      await fetchLeaveData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to review leave.");
    }
  };

  const handleReviewPermission = async (
    id: string,
    action: "APPROVE" | "REJECT",
    remarks?: string
  ) => {
    try {
      await attendanceService.reviewPermission(id, {
        action,
        remarks: remarks || (action === "APPROVE" ? "Approved standard 1-hour permission request" : "Rejected by reviewer"),
      });
      toast.success(
        action === "APPROVE"
          ? "Permission request APPROVED successfully!"
          : "Permission request REJECTED."
      );
      await fetchLeaveData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action.toLowerCase()} permission.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2.5 py-0.5 text-xs font-bold text-[#F0834A]">
              <Sparkles className="h-3 w-3" />
              {isManager ? "Team Manager Approvals" : isHR ? "HR Directorate" : "Employee Leave Portal"}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A] mt-1">
            Leave &amp; Absence Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Casual Leave: <strong>1 Day / Month</strong> • Monthly Permission: <strong>Max 2 Hours</strong> (&gt;2h triggers Half-Day deduction).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={fetchLeaveData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            className={`gap-2 font-bold ${
              permissionsRemaining === 0
                ? "border-red-400 bg-red-50/50 text-red-700 hover:bg-red-100/60"
                : "border-[#EA6118] text-[#EA6118] hover:bg-orange-50"
            }`}
            onClick={() => setShowPermissionModal(true)}
          >
            <Clock className="h-4 w-4" />
            <span>
              {permissionsRemaining === 0
                ? `Apply Permission (2/2 Used - LOP)`
                : `Apply Permission (${permissionsRemaining}/2 Left)`}
            </span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="gap-2 shadow-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </Button>
        </div>
      </div>

      {/* Leave & Attendance Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Card 1: Monthly Casual Leave Quota */}
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Casual Leave</span>
          <p className="font-heading text-2xl font-bold text-slate-900 mt-1">
            1 <span className="text-xs text-slate-400 font-normal">Day / Month</span>
          </p>
          <span className="text-[10px] text-slate-500">Monthly Standard Quota</span>
        </div>

        {/* Card 2: Total Casual Leave Used */}
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Casual Leave</span>
          <p className="font-heading text-2xl font-bold text-slate-900 mt-1">
            {casualLeavesUsed} <span className="text-xs text-slate-400 font-normal">Day(s)</span>
          </p>
          <span className={`text-[10px] font-semibold ${casualLeavesUsed >= 1 ? "text-amber-600" : "text-emerald-600"}`}>
            {casualLeavesUsed >= 1 ? "Monthly Quota Utilized (Next -> LOP)" : "1 Day Available This Month"}
          </span>
        </div>

        {/* Card 3: Total Permission */}
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Permission</span>
          <p className="font-heading text-2xl font-bold text-slate-900 mt-1">
            {permissionHoursUsed} <span className="text-xs text-slate-400 font-normal">/ 2 Hours</span>
          </p>
          <span className={`text-[10px] font-semibold ${permissionHoursUsed > 2 ? "text-red-600" : "text-slate-500"}`}>
            {permissionHoursUsed > 2 ? "⚠️ Exceeded 2h (-0.5d Half-Day LOP)" : "Max 2h / Month Allowance"}
          </span>
        </div>

        {/* Card 4: This Month Working Days */}
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">This Month Working Days</span>
          <p className="font-heading text-2xl font-bold text-[#EA6118] mt-1">
            {effectiveWorkingDays} <span className="text-xs text-slate-400 font-normal">/ {baseWorkingDays} Days</span>
          </p>
          <span className={`text-[10px] font-semibold ${totalLopAndDeductions > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {totalLopAndDeductions > 0
              ? `-${totalLopAndDeductions}d Deduction (${leaveLopDays}d LOP${permissionDeductionDays > 0 ? " + 0.5d Perm" : ""}${lateDeductionDays > 0 ? " + 0.5d Late" : ""})`
              : "100% Full Attendance"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("my_leaves")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "my_leaves"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          My Applications ({myLeaves.length + myPermissions.length})
        </button>

        {isApprover && (
          <button
            onClick={() => setActiveTab("team_approvals")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "team_approvals"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>Team Approvals</span>
            {(teamRequests.length > 0 || teamPermissions.length > 0) && (
              <span className="rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2">
                {teamRequests.length + teamPermissions.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "calendar"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Public Campus Leave Calendar
        </button>
      </div>

      {/* Tab 1: My Personal Applications (Leaves & Permissions) */}
      {activeTab === "my_leaves" && (
        <div className="space-y-6">
          {/* Section A: My Submitted Leaves */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-[#12173A]">
                My Submitted Leave Applications ({myLeaves.length})
              </h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : myLeaves.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 px-3">Days</th>
                    <th className="pb-3 px-3">Reason</th>
                    <th className="pb-3 px-3">Medical Proof</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myLeaves.map((row: any, i) => (
                    <tr key={row._id || row.id || i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.leaveType || row.type}</td>
                      <td className="py-3 px-3">{row.fromDate || row.from} → {row.toDate || row.to}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900">{row.days || 1} day(s)</span>
                        {row.paidDays !== undefined && row.lopDays !== undefined && row.lopDays > 0 ? (
                          <span className="block text-[10px] text-amber-700 font-bold">
                            {row.paidDays} Paid • {row.lopDays} LOP
                          </span>
                        ) : row.isLop ? (
                          <span className="block text-[10px] text-red-600 font-bold">Loss of Pay</span>
                        ) : null}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{row.reason}</td>
                      <td className="py-3 px-3">
                        {row.leaveType === "SICK" || row.leaveType === "Sick" ? (
                          row.medicalCertificateUrl || row.medicalCertificateName ? (
                            <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                              Attached
                            </span>
                          ) : (
                            <span className="rounded bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                              Missing (LOP)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[10px]">--</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${
                          row.status === "APPROVED" || row.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.status === "REJECTED" || row.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {row.status || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {(row.status === "PENDING" || row.status === "Pending") && (
                          <button
                            onClick={() => handleCancelLeave(row._id || row.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-[11px]"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No leave requests applied yet.</p>
            )}
          </div>

          {/* Section B: My Submitted 1-Hour Permissions */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  My 1-Hour Permission Applications ({myPermissions.length})
                </h3>
                <p className="text-[11px] text-slate-400">Monthly quota: 2 Hours per month. Excess permissions trigger 0.5 Day Loss of Pay.</p>
              </div>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : myPermissions.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Permission Date</th>
                    <th className="pb-3 px-3">Time Slot</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 px-3">Reason</th>
                    <th className="pb-3 px-3">Target Approvers</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Review Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myPermissions.map((perm: any, idx: number) => {
                    const fromTime = perm.startTime || perm.fromTime || "09:40 AM";
                    const toTime = perm.endTime || perm.toTime || "10:40 AM";
                    return (
                      <tr key={perm._id || perm.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-900">{perm.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {fromTime} → {toTime}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900">{perm.durationHours || 1} Hour</span>
                          {perm.exceedsMonthlyLimit && (
                            <span className="block text-[10px] text-red-600 font-bold">
                              ⚠️ Exceeded 2h (-0.5d LOP)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{perm.reason || "--"}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-[#EA6118] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                            {Array.isArray(perm.approvers) && perm.approvers.length > 0
                              ? perm.approvers.join(", ")
                              : "HR, MD, GM, MANAGER"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-bold ${
                            perm.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : perm.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {perm.status || "PENDING"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {perm.reviewRemarks || (perm.reviewedBy?.name ? `Reviewed by ${perm.reviewedBy.name}` : "--")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No permission requests applied yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Team Approvals (Permissions & Leaves for HR, MD, GM, Admin, Manager) */}
      {activeTab === "team_approvals" && (
        <div className="space-y-4">
          {/* Sub-Tabs: Permission Requests vs Leave Requests */}
          <div className="flex items-center justify-between gap-3 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeamSubTab("permissions")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  teamSubTab === "permissions"
                    ? "bg-white text-[#EA6118] shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>1-Hour Permission Requests</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  teamPermissions.filter((p) => p.status === "PENDING" || !p.status).length > 0
                    ? "bg-[#EA6118] text-white"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {teamPermissions.filter((p) => p.status === "PENDING" || !p.status).length} Pending / {teamPermissions.length}
                </span>
              </button>

              <button
                onClick={() => setTeamSubTab("leaves")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  teamSubTab === "leaves"
                    ? "bg-white text-[#EA6118] shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Leave Applications</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  teamRequests.length > 0 ? "bg-[#EA6118] text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {teamRequests.length} Pending
                </span>
              </button>
            </div>

            {teamSubTab === "permissions" && (
              <div className="flex items-center gap-1.5 text-xs">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPermissionFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      permissionFilter === st
                        ? "bg-[#EA6118] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Tab 1 Content: Permission Requests */}
          {teamSubTab === "permissions" && (
            <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-[#12173A]">
                    Employee Permission Requests ({teamPermissions.filter((p) => permissionFilter === "ALL" || (p.status || "PENDING") === permissionFilter).length})
                  </h3>
                  <p className="text-[11px] text-slate-400">Review and approve 1-hour permission slots assigned to HR, MD, GM, and Manager.</p>
                </div>
              </div>

              {(() => {
                const filteredPermissions = teamPermissions.filter(
                  (p) => permissionFilter === "ALL" || (p.status || "PENDING") === permissionFilter
                );

                if (filteredPermissions.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="text-xs text-slate-500 font-medium">No permission requests found for status &quot;{permissionFilter}&quot;.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredPermissions.map((perm: any) => {
                      const empName =
                        (typeof perm.userId === "object" ? perm.userId?.name : null) ||
                        perm.employeeName ||
                        perm.userName ||
                        perm.name ||
                        (typeof perm.userId === "string" ? perm.userId : "Employee");
                      const empId =
                        (typeof perm.userId === "object" ? perm.userId?.employeeId : null) ||
                        perm.employeeId;
                      const empDept =
                        (typeof perm.userId === "object" ? perm.userId?.department : null) ||
                        perm.department;
                      const empBranch =
                        (typeof perm.userId === "object" ? perm.userId?.branch : null) ||
                        perm.branch;
                      const empDesignation =
                        (typeof perm.userId === "object" ? perm.userId?.designation : null) ||
                        perm.designation;

                      const startTime = perm.startTime || perm.fromTime || "09:40 AM";
                      const endTime = perm.endTime || perm.toTime || "10:40 AM";
                      const isPending = !perm.status || perm.status === "PENDING";

                      return (
                        <div
                          key={perm._id || perm.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border text-xs gap-3 transition-colors ${
                            isPending
                              ? "bg-orange-50/30 border-orange-200/80 hover:border-orange-300"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm">{empName}</p>
                              {empId && (
                                <span className="text-slate-400 font-medium text-xs font-mono">
                                  ({empId})
                                </span>
                              )}
                              <span className="rounded bg-orange-100 text-[#EA6118] px-2 py-0.5 text-[10px] font-bold uppercase">
                                1-Hr Permission
                              </span>
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                perm.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : perm.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {perm.status || "PENDING"}
                              </span>
                              {perm.exceedsMonthlyLimit && (
                                <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                                  ⚠️ Exceeds 2h (-0.5d LOP)
                                </span>
                              )}
                            </div>

                            {(empDesignation || empDept || empBranch) && (
                              <p className="text-slate-400 text-[11px] font-medium">
                                {[empDesignation, empDept, empBranch].filter(Boolean).join(" • ")}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-slate-600 pt-0.5">
                              <span>
                                Date: <strong className="text-slate-800">{perm.date}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Time Slot: <strong className="text-slate-800">{startTime} → {endTime}</strong> ({perm.durationHours || 1} Hour)
                              </span>
                            </div>

                            <p className="text-slate-600 text-[11px]">
                              <strong>Reason:</strong> {perm.reason || "Personal permission"}
                            </p>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>Routed to:</span>
                              <span className="font-bold text-[#EA6118]">
                                {Array.isArray(perm.approvers) && perm.approvers.length > 0
                                  ? perm.approvers.join(", ")
                                  : "HR, MD, GM, MANAGER"}
                              </span>
                              {perm.reviewedBy?.name && (
                                <>
                                  <span>•</span>
                                  <span>Reviewed by: <strong>{perm.reviewedBy.name}</strong></span>
                                </>
                              )}
                              {perm.reviewRemarks && (
                                <>
                                  <span>•</span>
                                  <span className="italic">&quot;{perm.reviewRemarks}&quot;</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleReviewPermission(perm._id || perm.id, "APPROVE")}
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Approve Permission</span>
                                </button>
                                <button
                                  onClick={() => handleReviewPermission(perm._id || perm.id, "REJECT")}
                                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold italic">
                                Action Completed ({perm.status})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub-Tab 2 Content: Leave Applications */}
          {teamSubTab === "leaves" && (
            <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
              <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
                Team Member Leave Approvals ({teamRequests.length})
              </h3>
              {teamRequests.length > 0 ? (
                <div className="space-y-3">
                  {teamRequests.map((req: any) => {
                    const empName =
                      (typeof req.userId === "object" ? req.userId?.name : null) ||
                      req.employeeName ||
                      req.userName ||
                      req.name ||
                      (typeof req.userId === "string" ? req.userId : "Staff Member");
                    const empId =
                      (typeof req.userId === "object" ? req.userId?.employeeId : null) ||
                      req.employeeId;
                    const empDept =
                      (typeof req.userId === "object" ? req.userId?.department : null) ||
                      req.department;
                    const empBranch =
                      (typeof req.userId === "object" ? req.userId?.branch : null) ||
                      req.branch;
                    const empDesignation =
                      (typeof req.userId === "object" ? req.userId?.designation : null) ||
                      req.designation;

                    return (
                      <div
                        key={req._id || req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{empName}</p>
                            {empId && (
                              <span className="text-slate-400 font-medium text-xs font-mono">
                                ({empId})
                              </span>
                            )}
                            <span className="rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                              {req.leaveType || req.type}
                            </span>
                            {req.isLop && (
                              <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                                LOP ({req.lopDays || 0}d)
                              </span>
                            )}
                            {req.leaveType === "SICK" && !req.medicalCertificateUrl && (
                              <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                                No Medical Cert (Mark as LOP)
                              </span>
                            )}
                          </div>

                          {(empDesignation || empDept || empBranch) && (
                            <p className="text-slate-400 text-[11px] mt-0.5 font-medium">
                              {[empDesignation, empDept, empBranch].filter(Boolean).join(" • ")}
                            </p>
                          )}

                          <p className="text-slate-500 mt-1">
                            Dates:{" "}
                            <strong className="text-slate-700">
                              {req.fromDate || req.from} to {req.toDate || req.to}
                            </strong>{" "}
                            ({req.days} days
                            {req.paidDays !== undefined && req.lopDays !== undefined
                              ? ` • ${req.paidDays} Paid, ${req.lopDays} LOP`
                              : ""}
                            )
                          </p>

                          {req.lopReason && (
                            <p className="text-amber-700 text-[11px] mt-0.5 font-medium">
                              ⚠️ {req.lopReason}
                            </p>
                          )}

                          <p className="text-slate-500 text-[11px]">
                            Reason: {req.reason}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                          {req.paidDays !== undefined && req.lopDays !== undefined && req.paidDays > 0 && req.lopDays > 0 ? (
                            <>
                              <button
                                onClick={() => handleReviewLeave(req._id || req.id, "APPROVE", undefined, { paidDays: req.paidDays, lopDays: req.lopDays })}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap"
                                title={`Approve split as applied: ${req.paidDays} Day Casual (Paid) + ${req.lopDays} Day Loss of Pay (LOP)`}
                              >
                                Approve ({req.paidDays} Paid, {req.lopDays} LOP)
                              </button>
                              <button
                                onClick={() => handleReviewLeave(req._id || req.id, "APPROVE", true, { paidDays: 0, lopDays: req.days || 2 })}
                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap"
                                title="Mark all days as Loss of Pay (LOP)"
                              >
                                Approve (All {req.days}d LOP)
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleReviewLeave(req._id || req.id, "APPROVE", false, { paidDays: req.days || 1, lopDays: 0 })}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap"
                              >
                                Approve (Paid)
                              </button>
                              <button
                                onClick={() => handleReviewLeave(req._id || req.id, "APPROVE", true, { paidDays: 0, lopDays: req.days || 1 })}
                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap"
                              >
                                Approve (LOP)
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleReviewLeave(req._id || req.id, "REJECT")}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 text-xs transition-colors shadow-sm whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No pending team leave requests at this time.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Public Holidays & Campus Calendar */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2.5 py-0.5 text-xs font-bold text-[#F0834A]">
                    <Sparkles className="h-3 w-3" />
                    Official Academic &amp; Public Calendar
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[#12173A] mt-1">
                  Public &amp; Festival Holidays Calendar
                </h3>
                <p className="text-xs text-[#5B6180] mt-0.5">
                  Official gazetted holidays, cultural festivals, institutional off-days, and campus absence roster.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {(isHR || isCEO) && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-2 shadow-sm"
                    onClick={() => setShowAddHolidayModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Add Public Holiday</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-orange-50/60 p-3.5 border border-orange-100">
                <span className="text-orange-700 font-bold uppercase text-[10px]">Total Public Holidays</span>
                <p className="font-bold text-[#12173A] text-lg mt-0.5">{publicHolidays.length} Days</p>
                <span className="text-[10px] text-slate-400">Year 2026</span>
              </div>
              <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-100">
                <span className="text-emerald-700 font-bold uppercase text-[10px]">National Holidays</span>
                <p className="font-bold text-emerald-800 text-lg mt-0.5">
                  {publicHolidays.filter((h) => h.type === "NATIONAL").length} Days
                </p>
                <span className="text-[10px] text-slate-400">Mandatory Paid</span>
              </div>
              <div className="rounded-2xl bg-purple-50/60 p-3.5 border border-purple-100">
                <span className="text-purple-700 font-bold uppercase text-[10px]">Festivals &amp; Culture</span>
                <p className="font-bold text-purple-800 text-lg mt-0.5">
                  {publicHolidays.filter((h) => h.type === "FESTIVAL").length} Days
                </p>
                <span className="text-[10px] text-slate-400">State &amp; Regional</span>
              </div>
              <div className="rounded-2xl bg-blue-50/60 p-3.5 border border-blue-100">
                <span className="text-blue-700 font-bold uppercase text-[10px]">Staff Leaves Logged</span>
                <p className="font-bold text-blue-800 text-lg mt-0.5">{calendarLeaves.length} Approved</p>
                <span className="text-[10px] text-slate-400">Campus Roster</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search holiday name, month, festival..."
                  value={holidaySearch}
                  onChange={(e) => setHolidaySearch(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
                {["ALL", "NATIONAL", "FESTIVAL", "GAZETTED", "INSTITUTIONAL"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setHolidayCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      holidayCategoryFilter === cat
                        ? "bg-[#EA6118] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "ALL" ? "All Holidays" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Holidays Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {publicHolidays
                .filter((h) => {
                  const matchCat = holidayCategoryFilter === "ALL" || h.type === holidayCategoryFilter;
                  const matchSearch =
                    !holidaySearch ||
                    h.name.toLowerCase().includes(holidaySearch.toLowerCase()) ||
                    h.date.includes(holidaySearch) ||
                    (h.description || "").toLowerCase().includes(holidaySearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .map((hol) => {
                  let formattedDate = hol.date;
                  let monthStr = "";
                  let dayNum = "";
                  try {
                    const parsed = new Date(hol.date);
                    if (!isNaN(parsed.getTime())) {
                      monthStr = parsed.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                      dayNum = String(parsed.getDate());
                    }
                  } catch {}

                  const typeColor =
                    hol.type === "NATIONAL"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : hol.type === "FESTIVAL"
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : hol.type === "GAZETTED"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-amber-100 text-amber-800 border-amber-200";

                  return (
                    <div
                      key={hol.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all flex items-start gap-3.5 group"
                    >
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 p-2.5 min-w-[54px] shadow-xs group-hover:border-[#EA6118]/40 transition-colors">
                        <span className="text-[10px] font-bold text-[#EA6118] uppercase tracking-wider">{monthStr || "HOL"}</span>
                        <span className="text-lg font-black text-slate-900 leading-none mt-0.5">{dayNum || "•"}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase border ${typeColor}`}>
                            {hol.type}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">{hol.dayOfWeek}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{hol.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{hol.description || "Official Public Holiday"}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Campus Scheduled Absences & Approved Leaves */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-heading text-base font-bold text-[#12173A]">
              Faculty &amp; Staff Approved Absence Roster
            </h3>
            {calendarLeaves.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {calendarLeaves.map((event: any, idx) => {
                  const empName =
                    (typeof event.userId === "object" ? event.userId?.name : null) ||
                    event.employeeName ||
                    event.userName ||
                    event.name ||
                    "Staff Member";
                  const empDept =
                    (typeof event.userId === "object" ? event.userId?.department : null) ||
                    event.department ||
                    "Campus Operations";
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100">
                      <p className="font-bold text-slate-900">{empName}</p>
                      <p className="text-slate-500 text-[11px]">{event.leaveType || "Leave"} • {empDept}</p>
                      <p className="text-[11px] text-[#EA6118] font-bold mt-1.5">{event.fromDate} - {event.toDate}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No active faculty leaves scheduled on the campus calendar.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add New Public Holiday (HR / Admin / MD / GM) */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#12173A] flex items-center gap-1.5">
                  <Calendar className="h-5 w-5 text-[#EA6118]" />
                  <span>Add Public Holiday</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Register national, festival, or custom institutional holidays for all campuses.
                </p>
              </div>
              <button
                onClick={() => setShowAddHolidayModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPublicHoliday} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Founder's Day / Institutional Off"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Holiday Date</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Holiday Category</label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold"
                  >
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="NATIONAL">National Holiday</option>
                    <option value="GAZETTED">Gazetted Holiday</option>
                    <option value="INSTITUTIONAL">Institutional / Campus Holiday</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Brief context or holiday guidelines..."
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddHolidayModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Add Holiday
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#12173A]">
                  Apply for Leave
                </h3>
                <p className="text-[11px] text-slate-500">
                  Casual Leave: 1 Day/Month quota • Excess days or Unpaid leave marked as Loss of Pay (LOP)
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLeaveType(val);
                    if (val === "HALF_DAY" && fromDate) {
                      setToDate(fromDate);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold"
                >
                  <option value="CASUAL">Casual Leave (Full Day - 1 Day / Month Quota)</option>
                  <option value="HALF_DAY">Half-Day Leave (0.5 Day - Morning / Afternoon Session)</option>
                  <option value="UNPAID">Loss of Pay (LOP / Unpaid Leave)</option>
                  <option value="SICK">Sick Leave (Medical Certificate)</option>
                </select>
              </div>

              {isHalfDay && (
                <div className="space-y-1.5 rounded-2xl bg-orange-50/50 p-3 border border-orange-200/70">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Clock className="h-3.5 w-3.5 text-[#EA6118]" />
                    <span>Select Half-Day Session</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHalfDaySession("FIRST_HALF")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        halfDaySession === "FIRST_HALF"
                          ? "border-[#EA6118] bg-[#EA6118] text-white shadow-sm font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/30"
                      }`}
                    >
                      <span className="text-xs font-bold">First Half (Morning)</span>
                      <span className={`text-[10px] ${halfDaySession === "FIRST_HALF" ? "text-orange-100" : "text-slate-500"}`}>
                        09:40 AM – 02:00 PM
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHalfDaySession("SECOND_HALF")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        halfDaySession === "SECOND_HALF"
                          ? "border-[#EA6118] bg-[#EA6118] text-white shadow-sm font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/30"
                      }`}
                    >
                      <span className="text-xs font-bold">Second Half (Afternoon)</span>
                      <span className={`text-[10px] ${halfDaySession === "SECOND_HALF" ? "text-orange-100" : "text-slate-500"}`}>
                        02:00 PM – 07:00 PM
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isHalfDay ? (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Leave Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setToDate(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">From Date</label>
                    <input
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">To Date</label>
                    <input
                      type="date"
                      required
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/60 text-slate-700 flex items-center justify-between">
                <span className="font-medium">Calculated Total Duration:</span>
                <strong className="text-[#EA6118] font-bold">
                  {isHalfDay
                    ? `0.5 Day (${halfDaySession === "FIRST_HALF" ? "First Half: 09:40 AM - 02:00 PM" : "Second Half: 02:00 PM - 07:00 PM"})`
                    : `${calculatedDays} Day(s)`}
                </strong>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed explanation of the leave reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              {/* Assign Approvers Section (HR, MD, GM, Manager) */}
              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <UserCheck className="h-4 w-4 text-[#EA6118]" />
                    <span>Assign &amp; Route Approval To:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignedRoles(["HR", "MD", "GM", "MANAGER"])}
                      className="text-[10px] font-bold text-[#EA6118] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAssignedRoles(["HR"])}
                      className="text-[10px] font-bold text-slate-500 hover:underline"
                    >
                      HR Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "HR", label: "HR Manager", icon: Briefcase },
                    { key: "MD", label: "MD (Director)", icon: Crown },
                    { key: "GM", label: "GM (General Mgr)", icon: Shield },
                    { key: "MANAGER", label: "Reporting Mgr", icon: Users },
                  ].map((item) => {
                    const isSelected = assignedRoles.includes(item.key);
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleAssignedRole(item.key)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          isSelected
                            ? "border-[#EA6118] bg-orange-50/80 text-[#EA6118] font-bold ring-1 ring-[#EA6118]"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100/70"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-[#EA6118] text-white" : "bg-slate-100 text-slate-500"}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] leading-tight font-bold truncate">{item.label}</p>
                          <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">{item.key}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Send Notification Option */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendNotification}
                      onChange={(e) => setSendNotification(e.target.checked)}
                      className="h-4 w-4 rounded text-[#EA6118] focus:ring-[#EA6118] border-slate-300 accent-[#EA6118]"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Bell className={`h-3.5 w-3.5 ${sendNotification ? "text-[#EA6118]" : "text-slate-400"}`} />
                      <span className="font-semibold">
                        Send instant notification (In-app alert &amp; Email) to assigned approvers ({assignedRoles.join(", ")})
                      </span>
                    </div>
                  </label>
                </div>
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
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#12173A] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#EA6118]" />
                  <span>Apply for 1-Hour Permission</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Monthly Quota: 2 Permissions (1 Hour Each) • Total 2 Hours / Month
                </p>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quota Status Alert Banner */}
            <div className={`rounded-2xl p-3.5 text-xs border ${
              permissionsRemaining <= 0 || permissionCountUsed >= 2
                ? "bg-red-50 border-red-200 text-red-900 shadow-xs"
                : permissionCountUsed >= 1 || permissionHoursUsed >= 1
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {(permissionsRemaining <= 0 || permissionCountUsed >= 2) && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Monthly Permission Quota:</span>
                </span>
                <span className={`font-mono px-2 py-0.5 rounded-lg ${
                  permissionsRemaining <= 0 || permissionCountUsed >= 2
                    ? "text-red-700 bg-red-100 font-bold"
                    : ""
                }`}>
                  {permissionCountUsed} of 2 Used ({permissionsRemaining} Available)
                </span>
              </div>
              {permissionsRemaining <= 0 || permissionCountUsed >= 2 ? (
                <div className="mt-2 pt-2 border-t border-red-200/80 text-[11px] text-red-700 space-y-1">
                  <p className="font-bold">
                    🚫 Monthly Limit Reached (2/2 Permissions Completed)
                  </p>
                  <p>
                    All form fields are disabled. You have already completed your maximum limit of 2 permissions for this calendar month.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] mt-1 opacity-90">
                  Each permission grant allows exactly 1 hour of absence during official shift hours.
                </p>
              )}
            </div>

            <form onSubmit={handleApplyPermission} className="space-y-4 text-xs">
              <fieldset
                disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                className={`space-y-4 ${
                  permissionsRemaining <= 0 || permissionCountUsed >= 2
                    ? "opacity-50 cursor-not-allowed pointer-events-none select-none"
                    : ""
                }`}
              >
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Permission Date</label>
                  <input
                    type="date"
                    required
                    disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                    value={permissionForm.date}
                    onChange={(e) => setPermissionForm({ ...permissionForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Slot Preset Selection */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">1-Hour Time Slot Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                      onClick={() => handleSlotPresetChange("morning")}
                      className={`p-2.5 rounded-xl border text-center transition-all disabled:cursor-not-allowed ${
                        permissionForm.slotPreset === "morning"
                          ? "border-[#EA6118] bg-orange-50 text-[#EA6118] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-[11px] font-bold">Morning</span>
                      <span className="text-[10px] text-slate-400">09:40 - 10:40 AM</span>
                    </button>

                    <button
                      type="button"
                      disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                      onClick={() => handleSlotPresetChange("evening")}
                      className={`p-2.5 rounded-xl border text-center transition-all disabled:cursor-not-allowed ${
                        permissionForm.slotPreset === "evening"
                          ? "border-[#EA6118] bg-orange-50 text-[#EA6118] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-[11px] font-bold">Evening</span>
                      <span className="text-[10px] text-slate-400">06:00 - 07:00 PM</span>
                    </button>

                    <button
                      type="button"
                      disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                      onClick={() => handleSlotPresetChange("custom")}
                      className={`p-2.5 rounded-xl border text-center transition-all disabled:cursor-not-allowed ${
                        permissionForm.slotPreset === "custom"
                          ? "border-[#EA6118] bg-orange-50 text-[#EA6118] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-[11px] font-bold">Custom</span>
                      <span className="text-[10px] text-slate-400">Set Times</span>
                    </button>
                  </div>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">From Time</label>
                    <input
                      type="time"
                      required
                      disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                      value={permissionForm.fromTime}
                      onChange={(e) => setPermissionForm({ ...permissionForm, fromTime: e.target.value, slotPreset: "custom" })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">To Time</label>
                    <input
                      type="time"
                      required
                      disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                      value={permissionForm.toTime}
                      onChange={(e) => setPermissionForm({ ...permissionForm, toTime: e.target.value, slotPreset: "custom" })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 text-slate-700 flex items-center justify-between text-xs">
                  <span>Requested Duration:</span>
                  <strong className="text-[#EA6118] font-bold">1 Hour (Standard Permission)</strong>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reason for Permission</label>
                  <textarea
                    rows={2}
                    required
                    disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                    placeholder={
                      permissionsRemaining <= 0 || permissionCountUsed >= 2
                        ? "Monthly quota exhausted. You have already completed 2 permissions this month."
                        : "Provide reason for 1-hour permission request..."
                    }
                    value={permissionForm.reason}
                    onChange={(e) => setPermissionForm({ ...permissionForm, reason: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Assign Approvers Section (HR, MD, GM, Manager) */}
                <div className="space-y-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <UserCheck className="h-4 w-4 text-[#EA6118]" />
                      <span>Assign &amp; Route Permission Approval To:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                        onClick={() => setPermissionAssignedRoles(["HR", "MD", "GM", "MANAGER"])}
                        className="text-[10px] font-bold text-[#EA6118] hover:underline disabled:text-slate-400 disabled:no-underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                        onClick={() => setPermissionAssignedRoles(["HR"])}
                        className="text-[10px] font-bold text-slate-500 hover:underline disabled:text-slate-400 disabled:no-underline"
                      >
                        HR Only
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "HR", label: "HR Manager", icon: Briefcase },
                      { key: "MD", label: "MD (Director)", icon: Crown },
                      { key: "GM", label: "GM (General Mgr)", icon: Shield },
                      { key: "MANAGER", label: "Reporting Mgr", icon: Users },
                    ].map((item) => {
                      const isSelected = permissionAssignedRoles.includes(item.key);
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                          onClick={() => togglePermissionAssignedRole(item.key)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 disabled:cursor-not-allowed ${
                            isSelected
                              ? "border-[#EA6118] bg-orange-50/80 text-[#EA6118] font-bold ring-1 ring-[#EA6118]"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100/70"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-[#EA6118] text-white" : "bg-slate-100 text-slate-500"}`}>
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] leading-tight font-bold truncate">{item.label}</p>
                            <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">{item.key}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Send Notification Option */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2}
                        checked={permissionSendNotification}
                        onChange={(e) => setPermissionSendNotification(e.target.checked)}
                        className="h-4 w-4 rounded text-[#EA6118] focus:ring-[#EA6118] border-slate-300 accent-[#EA6118] disabled:cursor-not-allowed"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Bell className={`h-3.5 w-3.5 ${permissionSendNotification ? "text-[#EA6118]" : "text-slate-400"}`} />
                        <span className="font-semibold">
                          Send instant notification (In-app alert &amp; Email) to assigned approvers ({permissionAssignedRoles.join(", ")})
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={permissionsRemaining <= 0 || permissionCountUsed >= 2 || isSubmittingPermission}
                  isLoading={isSubmittingPermission}
                  className={
                    permissionsRemaining <= 0 || permissionCountUsed >= 2
                      ? "!bg-slate-200 !text-slate-400 !cursor-not-allowed !border-slate-200 shadow-none"
                      : ""
                  }
                >
                  {permissionsRemaining <= 0 || permissionCountUsed >= 2
                    ? "Quota Exhausted (2/2 Used)"
                    : "Submit Permission Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function LeaveView() {
  return (
    <AppShell>
      <LeaveContent />
    </AppShell>
  );
}
export default LeaveView;

