import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Clock, Send, Calendar, CheckCircle2, FileText, ChevronLeft, ChevronRight, RefreshCw, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { timesheetsService } from "@/services/timesheets.service";
import { useToast } from "@/context/ToastContext";

function TimesheetsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = user?.role || "employee";
  const isManager = role === "manager" || role === "hr_manager" || role === "ceo";

  const [activeTab, setActiveTab] = useState<"current" | "history" | "manager">("current");
  const [weekStartDate, setWeekStartDate] = useState("2026-09-21");
  const [entries, setEntries] = useState<any[]>([
    { project: "HRMS Portal", taskDescription: "Auth & Dashboard API integration", monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
    { project: "Biometric Ingestion", taskDescription: "Device synchronization logs", monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 },
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTimesheetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [weeklyRes, histRes, pendRes] = await Promise.allSettled([
        timesheetsService.getWeeklyTimesheet(weekStartDate),
        timesheetsService.getHistory(),
        isManager ? timesheetsService.getPendingTimesheets() : Promise.resolve(null),
      ]);

      if (weeklyRes.status === "fulfilled" && weeklyRes.value) {
        const data = weeklyRes.value.data || weeklyRes.value;
        if (data?.entries && Array.isArray(data.entries) && data.entries.length > 0) {
          setEntries(data.entries);
        }
      }
      if (histRes.status === "fulfilled" && histRes.value) {
        const data = histRes.value.data || histRes.value;
        setHistory(Array.isArray(data) ? data : []);
      }
      if (pendRes.status === "fulfilled" && pendRes.value) {
        const data = pendRes.value.data || pendRes.value;
        setPendingApprovals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load timesheet data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [weekStartDate, isManager]);

  useEffect(() => {
    fetchTimesheetData();
  }, [fetchTimesheetData]);

  const handleAddRow = () => {
    setEntries([
      ...entries,
      { project: "Campus Operations", taskDescription: "General Activity", monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleHourChange = (index: number, day: string, value: number) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [day]: Math.max(0, Math.min(24, value)) };
    setEntries(updated);
  };

  const handleSubmitWeekly = async () => {
    setIsSubmitting(true);
    try {
      await timesheetsService.submitTimesheet({
        weekStartDate,
        entries,
      });
      toast.success("Weekly timesheet submitted successfully!");
      await fetchTimesheetData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit timesheet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewTimesheet = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await timesheetsService.reviewTimesheet(id, {
        action,
        remarks: action === "APPROVE" ? "Approved logged project hours." : "Rejected.",
      });
      toast.success(`Timesheet ${action.toLowerCase()}d.`);
      await fetchTimesheetData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to review timesheet.");
    }
  };

  const calculateTotal = () => {
    return entries.reduce(
      (acc, r) =>
        acc +
        (Number(r.monday) || 0) +
        (Number(r.tuesday) || 0) +
        (Number(r.wednesday) || 0) +
        (Number(r.thursday) || 0) +
        (Number(r.friday) || 0) +
        (Number(r.saturday) || 0) +
        (Number(r.sunday) || 0),
      0
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Weekly Timesheets
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Log hours spent on academic projects, research grants, institutional initiatives, and duty sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTimesheetData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs font-semibold text-[#5B6180] bg-slate-100 px-3 py-2 rounded-xl">
            Week Starting: {weekStartDate}
          </span>
        </div>
      </div>

      {/* Tab Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "current"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Log Current Week
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "history"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Past Timesheets
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab("manager")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "manager"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>Pending Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab 1: Current Week Form */}
      {activeTab === "current" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase min-w-[180px]">Project Name</th>
                  <th className="py-3 px-4 uppercase min-w-[200px]">Task / Module</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Mon</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Tue</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Wed</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Thu</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Fri</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Sat</th>
                  <th className="py-3 px-2 uppercase text-center w-14">Sun</th>
                  <th className="py-3 px-3 uppercase text-center font-bold">Total</th>
                  <th className="py-3 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF]">
                {entries.map((r, idx) => {
                  const rowTotal =
                    (Number(r.monday) || 0) +
                    (Number(r.tuesday) || 0) +
                    (Number(r.wednesday) || 0) +
                    (Number(r.thursday) || 0) +
                    (Number(r.friday) || 0) +
                    (Number(r.saturday) || 0) +
                    (Number(r.sunday) || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={r.project}
                          onChange={(e) => {
                            const updated = [...entries];
                            updated[idx].project = e.target.value;
                            setEntries(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#EA6118] focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={r.taskDescription}
                          onChange={(e) => {
                            const updated = [...entries];
                            updated[idx].taskDescription = e.target.value;
                            setEntries(updated);
                          }}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-[#EA6118] focus:outline-none"
                        />
                      </td>
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                        <td key={day} className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={r[day] || 0}
                            onChange={(e) => handleHourChange(idx, day, Number(e.target.value))}
                            className="w-12 text-center rounded-lg border border-slate-200 py-1 text-xs font-bold text-slate-800 focus:border-[#EA6118] focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-center font-bold text-[#EA6118]">
                        {rowTotal}h
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {entries.length > 1 && (
                          <button
                            onClick={() => handleRemoveRow(idx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-200 gap-4">
            <Button variant="outline" size="sm" onClick={handleAddRow} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Project Row</span>
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold">Total Logged:</span>
                <p className="font-heading text-xl font-bold text-[#12173A]">{calculateTotal()} Hours</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitWeekly}
                isLoading={isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Submit for Review</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Past Timesheets */}
      {activeTab === "history" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Timesheet Submission History
          </h2>
          {history.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase">Week Starting</th>
                  <th className="py-3 px-4 uppercase">Total Hours</th>
                  <th className="py-3 px-4 uppercase">Status</th>
                  <th className="py-3 px-4 uppercase">Submitted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF]">
                {history.map((item: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold">{item.weekStartDate}</td>
                    <td className="py-3 px-4 font-bold text-[#EA6118]">{item.totalHours || 40}h</td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{item.status || "APPROVED"}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No historical timesheets submitted yet.</p>
          )}
        </div>
      )}

      {/* Tab 3: Manager Pending Approvals */}
      {activeTab === "manager" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Team Timesheets Requiring Signoff ({pendingApprovals.length})
          </h2>
          {pendingApprovals.length > 0 ? (
            pendingApprovals.map((item: any) => (
              <div key={item._id || item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.userName || item.employeeName || "Team Member"}</p>
                  <p className="text-slate-500 mt-1">Week: {item.weekStartDate} • Logged: <strong className="text-slate-800">{item.totalHours || 40} Hours</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewTimesheet(item._id || item.id, "APPROVE")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm"
                  >
                    Approve Hours
                  </button>
                  <button
                    onClick={() => handleReviewTimesheet(item._id || item.id, "REJECT")}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No pending timesheet submissions to review.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function TimesheetsView() {
  return (
    <AuthProvider>
      <AppShell>
        <TimesheetsContent />
      </AppShell>
    </AuthProvider>
  );
}
export default TimesheetsView;
