import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { leavesService } from "@/services/leaves.service";

function LeaveContent() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const isManager = role === "manager";
  const isHR = role === "hr_manager" || role === "admin";
  const isCEO = role === "ceo";
  const isFemale = user?.gender?.toLowerCase() === "female";

  const defaultTab = isManager ? "team_approvals" : isHR ? "hr_sanctions" : "my_leaves";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Data States
  const [balances, setBalances] = useState<any>(null);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [calendarLeaves, setCalendarLeaves] = useState<any[]>([]);

  // Form State
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchLeaveData = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    try {
      const [balRes, histRes, teamRes, calRes] = await Promise.allSettled([
        leavesService.getBalances(),
        leavesService.getMyHistory(),
        (isManager || isHR || isCEO) ? leavesService.getTeamRequests() : Promise.resolve(null),
        leavesService.getCalendar(now.getMonth() + 1, now.getFullYear()),
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
    } catch (err) {
      console.error("Failed to load leave data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isManager, isHR, isCEO]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const calculatedDays = fromDate && toDate
    ? Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await leavesService.applyLeave({
        leaveType,
        fromDate,
        toDate,
        days: calculatedDays,
        reason,
      });
      alert("Leave application submitted successfully!");
      setShowModal(false);
      setFromDate("");
      setToDate("");
      setReason("");
      await fetchLeaveData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit leave application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave application?")) return;
    try {
      await leavesService.cancelLeave(id);
      alert("Leave cancelled successfully.");
      await fetchLeaveData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to cancel leave.");
    }
  };

  const handleReviewLeave = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await leavesService.reviewLeave(id, {
        action,
        comments: action === "APPROVE" ? "Approved by reviewer" : "Rejected by reviewer",
      });
      alert(`Leave request has been ${action.toLowerCase()}d.`);
      await fetchLeaveData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to review leave.");
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
            Automated leave balances, statutory benefits, and multi-tier approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeaveData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </Button>
        </div>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Casual Leave</span>
          <p className="font-heading text-2xl font-bold text-slate-900 mt-1">
            {balances?.casual ?? balances?.CASUAL ?? "12"} <span className="text-xs text-slate-400 font-normal">Days</span>
          </p>
        </div>
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sick / Medical</span>
          <p className="font-heading text-2xl font-bold text-slate-900 mt-1">
            {balances?.sick ?? balances?.SICK ?? "8"} <span className="text-xs text-slate-400 font-normal">Days</span>
          </p>
        </div>
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Earned / Paid</span>
          <p className="font-heading text-2xl font-bold text-slate-900 mt-1">
            {balances?.earned ?? balances?.EARNED ?? "15"} <span className="text-xs text-slate-400 font-normal">Days</span>
          </p>
        </div>
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isFemale ? "Maternity Benefit" : "Paternity Leave"}
          </span>
          <p className="font-heading text-2xl font-bold text-[#EA6118] mt-1">
            {isFemale ? "26 Weeks" : "3 Days"}
          </p>
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
          My Leave Applications
        </button>

        {(isManager || isHR || isCEO) && (
          <button
            onClick={() => setActiveTab("team_approvals")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "team_approvals"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>Team Requests</span>
            {teamRequests.length > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2">
                {teamRequests.length}
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

      {/* Tab 1: My Personal Leaves */}
      {activeTab === "my_leaves" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
            My Submitted Applications
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-12">
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
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myLeaves.map((row: any, i) => (
                  <tr key={row._id || row.id || i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-900">{row.leaveType || row.type}</td>
                    <td className="py-3 px-3">{row.fromDate || row.from} → {row.toDate || row.to}</td>
                    <td className="py-3 px-3 font-semibold">{row.days || 1} day(s)</td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{row.reason}</td>
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
            <p className="text-xs text-slate-400 text-center py-8">No leave requests applied yet.</p>
          )}
        </div>
      )}

      {/* Tab 2: Team Leave Requests */}
      {activeTab === "team_approvals" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Team Member Leave Approvals ({teamRequests.length})
          </h3>
          {teamRequests.length > 0 ? (
            <div className="space-y-3">
              {teamRequests.map((req: any) => (
                <div key={req._id || req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">{req.employeeName || req.name || "Staff Member"}</p>
                      <span className="rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                        {req.leaveType || req.type}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">
                      Dates: <strong className="text-slate-700">{req.fromDate || req.from} to {req.toDate || req.to}</strong> ({req.days} days)
                    </p>
                    <p className="text-slate-500 text-[11px]">Reason: {req.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewLeave(req._id || req.id, "APPROVE")}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewLeave(req._id || req.id, "REJECT")}
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No pending team leave requests at this time.</p>
          )}
        </div>
      )}

      {/* Tab 3: Calendar */}
      {activeTab === "calendar" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm">
          <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Campus Leave &amp; Absence Calendar
          </h3>
          {calendarLeaves.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {calendarLeaves.map((event: any, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100">
                  <p className="font-bold text-slate-900">{event.employeeName || event.name}</p>
                  <p className="text-slate-500">{event.leaveType || "Leave"} • {event.department || "Campus"}</p>
                  <p className="text-[11px] text-orange-600 font-semibold mt-1">{event.fromDate} - {event.toDate}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No active leaves scheduled on the campus calendar.</p>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Apply for Leave
              </h3>
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
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick / Medical Leave (SL)</option>
                  <option value="EARNED">Earned / Annual Leave (EL)</option>
                  <option value="MATERNITY">Maternity Leave (26 Weeks Statutory)</option>
                  <option value="PATERNITY">Paternity Leave (3 Days)</option>
                  <option value="UNPAID">Leave Without Pay (LWP)</option>
                </select>
              </div>

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

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between">
                <span>Calculated Total Duration:</span>
                <strong className="text-slate-900">{calculatedDays} Day(s)</strong>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide details of the leave reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  Submit Application
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
    <AuthProvider>
      <AppShell>
        <LeaveContent />
      </AppShell>
    </AuthProvider>
  );
}
export default LeaveView;
