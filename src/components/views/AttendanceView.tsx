import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Users,
  ShieldCheck,
  Building2,
  Check,
  X,
  Sparkles,
  Search,
  MapPin,
  Cpu,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { attendanceService } from "@/services/attendance.service";
import { CheckInOutWidget } from "@/components/ui/CheckInOutWidget";

function AttendanceContent() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const isManager = role === "manager";
  const isHR = role === "hr_manager" || role === "admin";
  const isCEO = role === "ceo";

  const defaultTab = isManager ? "team" : isHR ? "company" : "my_logs";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Live Data States
  const [myCalendar, setMyCalendar] = useState<any[]>([]);
  const [myCorrections, setMyCorrections] = useState<any[]>([]);
  const [teamToday, setTeamToday] = useState<any[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<any[]>([]);
  const [dailySheet, setDailySheet] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any>(null);

  // Correction Request Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    targetDate: new Date().toISOString().split("T")[0],
    requestedCheckIn: "09:00",
    requestedCheckOut: "18:00",
    reason: "",
    attachmentUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    try {
      const [calRes, corrRes, teamRes, pendCorrRes, sheetRes, polRes] = await Promise.allSettled([
        attendanceService.getMyCalendar(currentMonth, currentYear),
        attendanceService.getMyCorrections(),
        (isManager || isHR || isCEO) ? attendanceService.getTeamAttendanceToday() : Promise.resolve(null),
        (isManager || isHR || isCEO) ? attendanceService.getPendingCorrections() : Promise.resolve(null),
        (isHR || isCEO) ? attendanceService.getHrDailySheet({ date: now.toISOString().split("T")[0] }) : Promise.resolve(null),
        isHR ? attendanceService.getPolicies() : Promise.resolve(null),
      ]);

      if (calRes.status === "fulfilled" && calRes.value) {
        const data = calRes.value.data || calRes.value;
        setMyCalendar(Array.isArray(data) ? data : (Array.isArray(data?.records) ? data.records : []));
      }
      if (corrRes.status === "fulfilled" && corrRes.value) {
        const data = corrRes.value.data || corrRes.value;
        setMyCorrections(Array.isArray(data) ? data : []);
      }
      if (teamRes.status === "fulfilled" && teamRes.value) {
        const data = teamRes.value.data || teamRes.value;
        setTeamToday(Array.isArray(data) ? data : []);
      }
      if (pendCorrRes.status === "fulfilled" && pendCorrRes.value) {
        const data = pendCorrRes.value.data || pendCorrRes.value;
        setPendingCorrections(Array.isArray(data) ? data : []);
      }
      if (sheetRes.status === "fulfilled" && sheetRes.value) {
        const data = sheetRes.value.data || sheetRes.value;
        setDailySheet(Array.isArray(data) ? data : (Array.isArray(data?.sheet) ? data.sheet : []));
      }
      if (polRes.status === "fulfilled" && polRes.value) {
        setPolicies(polRes.value.data || polRes.value);
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isManager, isHR, isCEO]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Handle Correction Submission
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await attendanceService.submitCorrection(correctionForm);
      alert("Attendance regularisation request submitted successfully!");
      setShowCorrectionModal(false);
      setCorrectionForm({
        targetDate: new Date().toISOString().split("T")[0],
        requestedCheckIn: "09:00",
        requestedCheckOut: "18:00",
        reason: "",
        attachmentUrl: "",
      });
      await fetchAttendanceData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit correction request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Correction Review (Approve/Reject)
  const handleReviewCorrection = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await attendanceService.reviewCorrection(id, { action, remarks: action === "APPROVE" ? "Approved" : "Rejected" });
      alert(`Correction request marked as ${action.toLowerCase()}.`);
      await fetchAttendanceData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to review correction.");
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const now = new Date();
    window.open(attendanceService.getExportUrl(now.getMonth() + 1, now.getFullYear()), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2.5 py-0.5 text-xs font-bold text-[#F0834A]">
              <Sparkles className="h-3 w-3" />
              {isManager ? "Team Manager Portal" : isHR ? "HR & Compliance Master" : "Employee Portal"}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A] mt-1">
            Attendance &amp; Biometric Records
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Real-time synchronization with biometric terminals, shift timings, and regularisations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchAttendanceData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowCorrectionModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Apply Regularisation</span>
          </Button>

          {(isHR || isCEO) && (
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={handleExportCsv}
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Live Punch & Work Timer Card */}
      <CheckInOutWidget variant="card" onStatusChange={fetchAttendanceData} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("my_logs")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "my_logs"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          My Attendance Calendar
        </button>

        {(isManager || isHR || isCEO) && (
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "team"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>Team Attendance Today</span>
            {pendingCorrections.length > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2">
                {pendingCorrections.length}
              </span>
            )}
          </button>
        )}

        {(isHR || isCEO) && (
          <button
            onClick={() => setActiveTab("company")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "company"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            HR Master Daily Sheet
          </button>
        )}
      </div>

      {/* Tab 1: Personal Attendance Logs */}
      {activeTab === "my_logs" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
              Monthly Punch History
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : myCalendar.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Check In</th>
                    <th className="pb-3 px-3">Check Out</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Terminal / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myCalendar.map((row: any, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.date}</td>
                      <td className="py-3 px-3">{row.checkInTime || row.checkIn || "--"}</td>
                      <td className="py-3 px-3">{row.checkOutTime || row.checkOut || "--"}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                            row.status === "PRESENT" || row.status === "Present"
                              ? "bg-emerald-100 text-emerald-700"
                              : row.status === "LATE" || row.status === "Late"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.status || "Absent"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{row.notes || row.terminal || "Biometric Sync"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No attendance records logged for this month yet.
              </div>
            )}
          </div>

          {/* My Regularisation Requests */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm">
            <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
              My Regularisation Applications
            </h3>
            {myCorrections.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {myCorrections.map((corr: any, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Target Date: {corr.targetDate || corr.date}</p>
                      <p className="text-slate-500 text-[11px]">Reason: {corr.reason} • Requested: {corr.requestedCheckIn} - {corr.requestedCheckOut}</p>
                    </div>
                    <span className="rounded-lg bg-orange-50 text-orange-600 px-2.5 py-1 text-[10px] font-bold">
                      {corr.status || "PENDING"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No correction requests submitted.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Team Attendance (Manager / HR) */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {pendingCorrections.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm space-y-3">
              <h3 className="font-heading text-base font-bold text-amber-900">
                Pending Regularisation Approvals ({pendingCorrections.length})
              </h3>
              <div className="space-y-2">
                {pendingCorrections.map((req: any) => (
                  <div key={req._id || req.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-amber-200 shadow-xs text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{req.userName || req.employeeName || req.employee || "Staff Member"}</p>
                      <p className="text-[11px] text-slate-500">Date: {req.targetDate || req.date} • Reason: {req.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewCorrection(req._id || req.id, "APPROVE")}
                        className="rounded-lg bg-emerald-600 text-white px-3 py-1 font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewCorrection(req._id || req.id, "REJECT")}
                        className="rounded-lg bg-red-600 text-white px-3 py-1 font-bold hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
              Live Team Status Today
            </h3>
            {teamToday.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Employee</th>
                    <th className="pb-3 px-3">Shift</th>
                    <th className="pb-3 px-3">Check In</th>
                    <th className="pb-3 px-3">Check Out</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teamToday.map((member: any, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{member.name || member.userName}</td>
                      <td className="py-3 px-3 text-slate-500">{member.shift || "09:00 AM - 06:00 PM"}</td>
                      <td className="py-3 px-3">{member.checkInTime || member.checkIn || "--"}</td>
                      <td className="py-3 px-3">{member.checkOutTime || member.checkOut || "--"}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                          member.status === "PRESENT" || member.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {member.status || "Expected"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No team members assigned or roster not generated yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: HR Company Master Sheet */}
      {activeTab === "company" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          <h3 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Daily Master Attendance Register
          </h3>
          {dailySheet.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-3">Staff ID</th>
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Punches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dailySheet.map((item: any, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{item.employeeId || item.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.name || item.employeeName}</td>
                    <td className="py-3 px-3 text-slate-500">{item.department || "General"}</td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                        {item.status || "PRESENT"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.checkInTime || "09:00"} - {item.checkOutTime || "18:00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No master sheet records found for today.</p>
          )}
        </div>
      )}

      {/* Regularisation Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Submit Attendance Correction
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Target Date</label>
                <input
                  type="date"
                  required
                  value={correctionForm.targetDate}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, targetDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Requested In</label>
                  <input
                    type="time"
                    required
                    value={correctionForm.requestedCheckIn}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Requested Out</label>
                  <input
                    type="time"
                    required
                    value={correctionForm.requestedCheckOut}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why biometric punch was missing or delayed..."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCorrectionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Submit Regularisation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AttendanceView() {
  return (
    <AuthProvider>
      <AppShell>
        <AttendanceContent />
      </AppShell>
    </AuthProvider>
  );
}
export default AttendanceView;
