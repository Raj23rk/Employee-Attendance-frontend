import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
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
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { attendanceService } from "@/services/attendance.service";
import { CheckInOutWidget } from "@/components/ui/CheckInOutWidget";
import { useToast } from "@/context/ToastContext";
import { formatTime } from "@/lib/helpers";
import { generateBranchAttendancePdf } from "@/lib/pdf-reports";


function AttendanceContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();
  const isManager = role === "manager";
  const isHR = role === "hr_manager" || role === "admin" || role === "md" || role === "gm";
  const isCEO = role === "ceo" || role === "md" || role === "gm";

  const defaultTab = (isHR || isCEO) ? "company" : isManager ? "team" : "my_logs";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected Month & Year for Attendance History
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

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

  // Robust Array extractor helper
  const extractList = (val: any): any[] => {
    if (!val) return [];
    const root = val?.data !== undefined ? val.data : val;
    if (Array.isArray(root)) return root;
    if (root && typeof root === "object") {
      if (Array.isArray(root.records)) return root.records;
      if (Array.isArray(root.calendar)) return root.calendar;
      if (Array.isArray(root.attendances)) return root.attendances;
      if (Array.isArray(root.history)) return root.history;
      if (Array.isArray(root.sheet)) return root.sheet;
      if (Array.isArray(root.data)) return root.data;
      if (Array.isArray(root.logs)) return root.logs;
      if (Array.isArray(root.list)) return root.list;
    }
    return [];
  };

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    const currentDateStr = new Date().toISOString().split("T")[0];

    try {
      const [calRes, corrRes, teamRes, pendCorrRes, sheetRes, polRes, todayRes] = await Promise.allSettled([
        attendanceService.getMyCalendar(selectedMonth, selectedYear),
        attendanceService.getMyCorrections(),
        (isManager || isHR || isCEO) ? attendanceService.getTeamAttendanceToday() : Promise.resolve(null),
        (isManager || isHR || isCEO) ? attendanceService.getPendingCorrections() : Promise.resolve(null),
        (isHR || isCEO) ? attendanceService.getHrDailySheet({ date: currentDateStr }) : Promise.resolve(null),
        isHR ? attendanceService.getPolicies() : Promise.resolve(null),
        attendanceService.getTodayStatus(),
      ]);

      let calList: any[] = [];
      if (calRes.status === "fulfilled" && calRes.value) {
        calList = extractList(calRes.value);
      }

      // Check if today status is available and not already in calendar
      if (todayRes.status === "fulfilled" && todayRes.value) {
        const todayData = todayRes.value?.data || todayRes.value;
        if (todayData && (todayData.checkInTime || todayData.checkIn || todayData.status)) {
          const todayDateStr = todayData.date || currentDateStr;
          const exists = calList.some((r: any) => (r.date || "").startsWith(todayDateStr));
          if (!exists) {
            calList = [
              {
                date: todayDateStr,
                checkInTime: todayData.checkInTime || todayData.checkIn,
                checkOutTime: todayData.checkOutTime || todayData.checkOut,
                status: todayData.status || "PRESENT",
                notes: todayData.notes || "Live Daily Punch",
                totalWorkHours: todayData.totalWorkHours || todayData.workHours,
              },
              ...calList,
            ];
          }
        }
      }
      setMyCalendar(calList);

      if (corrRes.status === "fulfilled" && corrRes.value) {
        setMyCorrections(extractList(corrRes.value));
      }
      if (teamRes.status === "fulfilled" && teamRes.value) {
        setTeamToday(extractList(teamRes.value));
      }
      if (pendCorrRes.status === "fulfilled" && pendCorrRes.value) {
        setPendingCorrections(extractList(pendCorrRes.value));
      }
      if (sheetRes.status === "fulfilled" && sheetRes.value) {
        setDailySheet(extractList(sheetRes.value));
      }
      if (polRes.status === "fulfilled" && polRes.value) {
        setPolicies(polRes.value.data || polRes.value);
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, isManager, isHR, isCEO]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Handle Correction Submission
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await attendanceService.submitCorrection(correctionForm);
      toast.success("Attendance regularisation request submitted successfully!");
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
      toast.error(err?.response?.data?.message || "Failed to submit correction request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Correction Review (Approve/Reject)
  const handleReviewCorrection = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await attendanceService.reviewCorrection(id, { action, remarks: action === "APPROVE" ? "Approved" : "Rejected" });
      toast.success(`Correction request marked as ${action.toLowerCase()}.`);
      await fetchAttendanceData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to review correction.");
    }
  };

  // PDF Attendance Master Report Export
  const handleExportPdf = () => {
    toast.info("Generating PDF Attendance Master Report...");
    if (activeTab === "company" && dailySheet.length > 0) {
      const formatted = dailySheet.map((item: any, i: number) => ({
        id: item.employeeId || item.id || `emp-${i}`,
        name: item.name || item.employeeName || "Staff",
        employeeId: item.employeeId || item.id || `WG-${i + 1}`,
        department: item.department || "General",
        branch: item.branch || "Main Campus",
        role: "employee" as any,
        todayAttendance: {
          isCheckedIn: item.status === "PRESENT" && (!item.checkOutTime || item.checkOutTime === "--:--"),
          checkInTime: item.checkInTime,
          checkOutTime: item.checkOutTime,
          status: item.status || "PRESENT",
        },
      }));
      generateBranchAttendancePdf(formatted as any, "HR Master Daily Register");
    } else if (activeTab === "team" && teamToday.length > 0) {
      const formatted = teamToday.map((member: any, i: number) => ({
        id: member._id || member.id || `team-${i}`,
        name: member.name || member.userName || "Staff",
        employeeId: member.employeeId || `STAFF-${i + 1}`,
        department: member.department || "Campus Operations",
        branch: member.branch || "Assigned Campus",
        role: "employee" as any,
        todayAttendance: {
          isCheckedIn: member.status === "PRESENT" && (!member.checkOutTime || member.checkOutTime === "--:--"),
          checkInTime: member.checkInTime || member.checkIn,
          checkOutTime: member.checkOutTime || member.checkOut,
          status: member.status || "PRESENT",
        },
      }));
      generateBranchAttendancePdf(formatted as any, "Team Attendance Today");
    } else {
      const formatted = myCalendar.map((row: any, i: number) => ({
        id: row._id || row.id || `row-${i}`,
        name: user?.name || "Employee",
        employeeId: user?.employeeId || "WG-STAFF",
        department: user?.department || "General",
        branch: user?.branch || "Main Campus",
        dateOfJoining: row.date,
        role: (user?.role?.toLowerCase() as any) || "employee",
        todayAttendance: {
          isCheckedIn: row.status === "PRESENT" && (!row.checkOutTime || row.checkOutTime === "--:--"),
          checkInTime: row.checkInTime || row.checkIn,
          checkOutTime: row.checkOutTime || row.checkOut,
          status: row.status || "PRESENT",
        },
      }));
      generateBranchAttendancePdf(
        formatted as any,
        `${user?.name || "Staff"} Attendance History`,
        { reportTitle: "Monthly Biometric Attendance History" }
      );
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
              {isManager ? "Team Manager Portal" : isHR ? "HR & Compliance Master" : "Employee Portal"}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A] mt-1">
            Attendance &amp; Biometric Records
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Standard Shift: <strong>09:40 AM – 07:00 PM</strong> • Grace: <strong>09:45 AM</strong> • 3 Late Check-ins Allowed • 2h Monthly Permission
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

          <Button
            variant="primary"
            size="sm"
            className="gap-2 shadow-sm"
            onClick={handleExportPdf}
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF Report</span>
          </Button>
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
          {/* Monthly Attendance Summary & Filter Card */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#12173A]">
                  Daily Check-In &amp; Check-Out Time Report
                </h3>
                <p className="text-xs text-[#5B6180] mt-0.5">
                  Detailed biometric punch records, check-in &amp; check-out timestamps, and working hours calculation.
                </p>
              </div>

              {/* Month & Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#EA6118] focus:outline-none"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-[#EA6118] focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick KPI stats for the selected month */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Days Logged</span>
                <p className="font-bold text-[#12173A] text-base mt-0.5">{myCalendar.length} Records</p>
              </div>
              <div className="rounded-2xl bg-emerald-50/60 p-3 border border-emerald-100">
                <span className="text-emerald-700 font-bold uppercase text-[10px]">Present Days</span>
                <p className="font-bold text-emerald-800 text-base mt-0.5">
                  {myCalendar.filter((r) => String(r.status).toUpperCase() === "PRESENT" || String(r.status).toUpperCase() === "LATE").length} Days
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50/60 p-3 border border-amber-100">
                <span className="text-amber-700 font-bold uppercase text-[10px]">Late Arrivals</span>
                <p className="font-bold text-amber-800 text-base mt-0.5">
                  {myCalendar.filter((r) => String(r.status).toUpperCase() === "LATE").length} / 3 Allowed
                </p>
              </div>
              <div className="rounded-2xl bg-orange-50/60 p-3 border border-orange-100">
                <span className="text-orange-700 font-bold uppercase text-[10px]">Total Hours Logged</span>
                <p className="font-bold text-orange-800 text-base mt-0.5">
                  {myCalendar.reduce((acc, curr) => {
                    const hrs = parseFloat(curr.totalWorkHours || curr.workHours || curr.durationHours || 0);
                    return acc + (isNaN(hrs) ? 0 : hrs);
                  }, 0).toFixed(1)} hrs
                </p>
              </div>
            </div>

            {/* Attendance Punch Table */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : myCalendar.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 px-3">Date &amp; Day</th>
                      <th className="pb-3 px-3">Check-In Time</th>
                      <th className="pb-3 px-3">Check-Out Time</th>
                      <th className="pb-3 px-3">Total Work Time</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Biometric Log / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {myCalendar.map((row: any, i) => {
                      const rawIn = row.checkInTime || row.checkIn || row.inTime || row.firstPunch;
                      const rawOut = row.checkOutTime || row.checkOut || row.outTime || row.lastPunch;
                      const formattedIn = rawIn ? formatTime(rawIn) : "--:--";
                      const formattedOut = rawOut ? formatTime(rawOut) : "--:--";
                      const statusUpper = String(row.status || "PRESENT").toUpperCase();

                      let dateLabel = row.date || row.createdAt || "Today";
                      let dayOfWeek = "";
                      try {
                        const parsedDate = new Date(dateLabel);
                        if (!isNaN(parsedDate.getTime())) {
                          dateLabel = parsedDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });
                          dayOfWeek = parsedDate.toLocaleDateString("en-US", { weekday: "short" });
                        }
                      } catch {}

                      return (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-slate-900">{dateLabel}</p>
                            {dayOfWeek && <p className="text-[11px] text-slate-400 font-medium">{dayOfWeek}</p>}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{formattedIn}</span>
                              {rawIn && formattedIn !== "--:--" && (
                                <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[9px] font-semibold">
                                  IN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{formattedOut}</span>
                              {rawOut && formattedOut !== "--:--" && (
                                <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[9px] font-semibold">
                                  OUT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-slate-700">
                              {row.totalWorkHours || row.workHours || (rawIn && rawOut ? "9h 20m" : rawIn ? "In Progress" : "--:--")}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${
                                statusUpper === "PRESENT"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : statusUpper === "LATE"
                                  ? "bg-amber-100 text-amber-700"
                                  : statusUpper === "HALF_DAY" || statusUpper === "HALF DAY"
                                  ? "bg-blue-100 text-blue-700"
                                  : statusUpper === "ON_LEAVE" || statusUpper === "LEAVE"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {row.status || "Present"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              {row.notes || row.terminal || row.locationAddress || "Biometric Device Sync"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No attendance records logged for {selectedMonth}/{selectedYear}.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Punches from biometric devices or manual check-ins will appear here.</p>
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
                      <p className="font-bold text-slate-900">
                        {(typeof req.userId === "object" ? req.userId?.name : null) ||
                          req.userName ||
                          req.employeeName ||
                          req.employee ||
                          "Staff Member"}
                      </p>
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
                      <td className="py-3 px-3">{member.checkInTime || member.checkIn ? formatTime(member.checkInTime || member.checkIn) : "--"}</td>
                      <td className="py-3 px-3">{member.checkOutTime || member.checkOut ? formatTime(member.checkOutTime || member.checkOut) : "--"}</td>
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
                    <td className="py-3 px-3 text-slate-500">
                      {item.checkInTime ? formatTime(item.checkInTime) : "09:40 AM"} - {item.checkOutTime ? formatTime(item.checkOutTime) : "07:00 PM"}
                    </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
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
    <AppShell>
      <AttendanceContent />
    </AppShell>
  );
}
export default AttendanceView;
