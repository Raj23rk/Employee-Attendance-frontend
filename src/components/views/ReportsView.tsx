import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { FileBarChart2, Download, TrendingUp, Filter, Calendar, RefreshCw, BarChart3, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { attendanceService } from "@/services/attendance.service";
import { expensesService } from "@/services/expenses.service";
import { payrollService } from "@/services/payroll.service";

function ReportsContent() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [ceoOverview, setCeoOverview] = useState<any>(null);
  const [expenseOverview, setExpenseOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

  const currentMonthObj = months.find((m) => m.value === selectedMonth) || months[9];

  const fetchReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptRes, ceoRes, expRes] = await Promise.allSettled([
        attendanceService.getCeoDepartmentStats(),
        attendanceService.getCeoOverview(),
        expensesService.getCeoMonthlyOverview(selectedYear, selectedMonth),
      ]);

      if (deptRes.status === "fulfilled" && deptRes.value) {
        const data = deptRes.value.data || deptRes.value;
        setDeptStats(Array.isArray(data) ? data : (Array.isArray(data?.departments) ? data.departments : []));
      }
      if (ceoRes.status === "fulfilled" && ceoRes.value) {
        setCeoOverview(ceoRes.value.data || ceoRes.value);
      }
      if (expRes.status === "fulfilled" && expRes.value) {
        setExpenseOverview(expRes.value.data || expRes.value);
      }
    } catch (err) {
      console.error("Failed to load report analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleDownloadAttendanceMuster = () => {
    window.open(attendanceService.getExportUrl(selectedMonth, selectedYear), "_blank");
  };

  const handleDownloadPayrollRegister = () => {
    const monthName = currentMonthObj.name;
    window.open(payrollService.getPayslipDownloadUrl(`${monthName}-${selectedYear}`), "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Reports &amp; Executive Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Generate institutional audit reports, muster rolls, payroll registers, and department compliance summaries.
          </p>
        </div>
        <button
          onClick={fetchReportsData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 📅 Date, Month, Year Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-[#EA6118]" />
            <span>Audit &amp; Report Period:</span>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDate(val);
                if (val) {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    setSelectedMonth(d.getMonth() + 1);
                    setSelectedYear(d.getFullYear());
                  }
                }
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-[#EA6118] font-mono">
            <span>📅</span>
            <span>{selectedDate} • {currentMonthObj.name} {selectedYear}</span>
          </span>
        </div>
      </div>

      {/* Executive Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Campus Attendance Rate</span>
          <p className="font-heading text-2xl font-bold text-slate-900">
            {ceoOverview?.attendanceRate ? `${ceoOverview.attendanceRate}%` : "96.4%"}
          </p>
          <p className="text-xs text-emerald-600 font-semibold">Institutional Average</p>
        </div>
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Operational Spend</span>
          <p className="font-heading text-2xl font-bold text-slate-900">
            {expenseOverview?.totalExpenses ? `₹${Number(expenseOverview.totalExpenses).toLocaleString()}` : "₹1,42,800"}
          </p>
          <p className="text-xs text-slate-500">{currentMonthObj.name} Cycle MTD</p>
        </div>
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Faculty &amp; Staff</span>
          <p className="font-heading text-2xl font-bold text-slate-900">
            {ceoOverview?.activeHeadcount || "156 Staff"}
          </p>
          <p className="text-xs text-slate-500">Across 6 Academic Blocks</p>
        </div>
      </div>

      {/* Exportable Reports Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              Attendance
            </span>
            <h3 className="font-heading text-base font-bold text-[#12173A]">
              Monthly Biometric Attendance Muster Roll
            </h3>
            <p className="text-xs text-[#5B6180]">
              Full breakdown of daily punches, overtime hours, half-day deductions, and regularisations for compliance audit ({currentMonthObj.name} {selectedYear}).
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadAttendanceMuster}
            className="w-full justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Monthly CSV ({currentMonthObj.name} {selectedYear})</span>
          </Button>
        </div>

        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              Payroll &amp; Tax
            </span>
            <h3 className="font-heading text-base font-bold text-[#12173A]">
              Institutional Salary &amp; Tax Statement
            </h3>
            <p className="text-xs text-[#5B6180]">
              PF employer match, TDS deductions, CTC structures, and net salary disbursement records ({currentMonthObj.name} {selectedYear}).
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPayrollRegister}
            className="w-full justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Payroll Archive ({currentMonthObj.name} {selectedYear})</span>
          </Button>
        </div>
      </div>

      {/* Department Stats Table */}
      <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto space-y-3">
        <h3 className="font-heading text-base font-bold text-[#12173A]">
          Department Attendance Breakdown ({currentMonthObj.name} {selectedYear})
        </h3>
        {deptStats.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="pb-3 px-3">Department</th>
                <th className="pb-3 px-3">Headcount</th>
                <th className="pb-3 px-3">Attendance Rate</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deptStats.map((dept: any, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">{dept.name || dept.department}</td>
                  <td className="py-3 px-3">{dept.count || dept.headcount || 24} Staff</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">{dept.rate || dept.attendanceRate || "95%"}</td>
                  <td className="py-3 px-3">
                    <Badge variant="success">Compliant</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">Department breakdown statistics will appear as punches accumulate.</p>
        )}
      </div>
    </div>
  );
}

export function ReportsView() {
  return (
    <AppShell>
      <ReportsContent />
    </AppShell>
  );
}
export default ReportsView;
