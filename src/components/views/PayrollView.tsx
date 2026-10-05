import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Wallet, Download, FileText, CheckCircle2, AlertCircle, RefreshCw, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/helpers";
import { payrollService } from "@/services/payroll.service";
import { useToast } from "@/context/ToastContext";

function PayrollContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();
  const isAdminOrHR = role === "admin" || role === "hr_manager" || role === "ceo" || role === "md" || role === "gm";
  const [activeTab, setActiveTab] = useState<"my_payroll" | "admin_payroll">(isAdminOrHR ? "admin_payroll" : "my_payroll");
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [allPayslips, setAllPayslips] = useState<any[]>([]);
  const [allStructures, setAllStructures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate Payslip Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    userId: "",
    monthYear: "September 2026",
    grossPay: 75000,
    netPay: 68500,
    totalDeductions: 6500,
    workingDays: 22,
    paidDays: 22,
    status: "PAID",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayrollData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [structRes, slipRes, allSlipsRes, allStructsRes] = await Promise.allSettled([
        payrollService.getSalaryStructure(),
        payrollService.getMyPayslips(),
        isAdminOrHR ? payrollService.getAllPayslips() : Promise.resolve(null),
        isAdminOrHR ? payrollService.getAllSalaryStructures() : Promise.resolve(null),
      ]);

      if (structRes.status === "fulfilled" && structRes.value) {
        setSalaryStructure(structRes.value.data || structRes.value);
      }
      if (slipRes.status === "fulfilled" && slipRes.value) {
        const data = slipRes.value.data || slipRes.value;
        setPayslips(Array.isArray(data) ? data : []);
      }
      if (allSlipsRes.status === "fulfilled" && allSlipsRes.value) {
        const data = allSlipsRes.value.data || allSlipsRes.value;
        setAllPayslips(Array.isArray(data) ? data : []);
      }
      if (allStructsRes.status === "fulfilled" && allStructsRes.value) {
        const data = allStructsRes.value.data || allStructsRes.value;
        setAllStructures(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load payroll data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdminOrHR]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const handleDownloadSlip = (monthYear: string) => {
    window.open(payrollService.getPayslipDownloadUrl(monthYear), "_blank");
  };

  const handleGeneratePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await payrollService.generatePayslip(generateForm);
      toast.success("Payslip generated successfully!");
      setShowGenerateModal(false);
      await fetchPayrollData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate payslip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const netSalary = salaryStructure?.netSalary || salaryStructure?.netPay || 78200;
  const basicHra = (salaryStructure?.basic || 42500) + (salaryStructure?.hra || 21250);
  const specialAllowance = salaryStructure?.specialAllowance || 21250;
  const deductions = (salaryStructure?.pfDeduction || 3600) + (salaryStructure?.tdsDeduction || 3200);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">Payroll &amp; Compensation</h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Salary breakdown, payslip archives, tax projections, and reimbursement records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPayrollData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isAdminOrHR && (
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={() => setShowGenerateModal(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Generate Payslip</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher for HR / Admin */}
      {isAdminOrHR && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("my_payroll")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "my_payroll"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            My Personal Payslips
          </button>
          <button
            onClick={() => setActiveTab("admin_payroll")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "admin_payroll"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            Company Payroll Management
          </button>
        </div>
      )}

      {/* Tab 1: My Personal Payroll */}
      {activeTab === "my_payroll" && (
        <div className="space-y-6">
          {/* Highlight Card */}
          <div className="rounded-3xl border border-[#D0D9F7] bg-gradient-to-br from-[#E8ECFB] to-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3454C8]">
                  Current Net Compensation (Monthly)
                </span>
                <p className="font-heading text-3xl font-extrabold text-[#0A1B45]">
                  {formatCurrency(netSalary)}
                </p>
                <p className="text-xs text-[#5B6180]">Direct deposit connected to registered bank account</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white p-4 border border-[#E2E4EF] min-w-[140px]">
                  <span className="text-[11px] text-[#5B6180] font-semibold">Basic + HRA</span>
                  <p className="text-sm font-bold text-[#12173A] mt-1">{formatCurrency(basicHra)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 border border-[#E2E4EF] min-w-[140px]">
                  <span className="text-[11px] text-[#5B6180] font-semibold">Special Allowances</span>
                  <p className="text-sm font-bold text-[#12173A] mt-1">{formatCurrency(specialAllowance)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 border border-[#E2E4EF] min-w-[140px]">
                  <span className="text-[11px] text-[#5B6180] font-semibold">PF &amp; Tax Deductions</span>
                  <p className="text-sm font-bold text-[#C23B3B] mt-1">- {formatCurrency(deductions)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payslips Archive */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm">
            <h2 className="font-heading text-base font-bold text-[#12173A] mb-4">
              Payslip History &amp; Downloads
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : payslips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                    <tr>
                      <th className="py-3 px-4 uppercase">Month / Cycle</th>
                      <th className="py-3 px-4 uppercase">Gross Pay</th>
                      <th className="py-3 px-4 uppercase">Deductions</th>
                      <th className="py-3 px-4 uppercase">Net Salary</th>
                      <th className="py-3 px-4 uppercase">Status</th>
                      <th className="py-3 px-4 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E4EF] text-[#12173A]">
                    {payslips.map((slip: any, idx) => (
                      <tr key={slip._id || slip.id || idx} className="hover:bg-[#F4F5F9]/50 transition-colors">
                        <td className="py-3 px-4 font-bold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#EA6118]" />
                          <span>{slip.monthYear || slip.month || "Current Cycle"}</span>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(slip.grossPay || 75000)}</td>
                        <td className="py-3 px-4 text-[#C23B3B]">- {formatCurrency(slip.totalDeductions || 6500)}</td>
                        <td className="py-3 px-4 font-bold text-[#188A5E]">{formatCurrency(slip.netPay || 68500)}</td>
                        <td className="py-3 px-4">
                          <Badge variant="success">{slip.status || "Paid"}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDownloadSlip(slip.monthYear || "September-2026")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#EA6118] hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No payslips generated for this account yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Admin Payroll */}
      {activeTab === "admin_payroll" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto space-y-4">
          <h2 className="font-heading text-base font-bold text-[#12173A]">
            Company-Wide Generated Payslips
          </h2>
          {allPayslips.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase">Employee</th>
                  <th className="py-3 px-4 uppercase">Cycle</th>
                  <th className="py-3 px-4 uppercase">Gross Pay</th>
                  <th className="py-3 px-4 uppercase">Net Pay</th>
                  <th className="py-3 px-4 uppercase">Days Paid</th>
                  <th className="py-3 px-4 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF] text-[#12173A]">
                {allPayslips.map((slip: any, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold">{slip.userName || slip.employeeName || slip.userId}</td>
                    <td className="py-3 px-4">{slip.monthYear}</td>
                    <td className="py-3 px-4">{formatCurrency(slip.grossPay)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(slip.netPay)}</td>
                    <td className="py-3 px-4">{slip.paidDays || 22} / {slip.workingDays || 22}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{slip.status || "PAID"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No company payslips recorded yet.</p>
          )}
        </div>
      )}

      {/* Generate Payslip Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Record / Generate Payslip
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayslip} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Employee ID / User ID</label>
                <input
                  type="text"
                  required
                  placeholder="EMP001"
                  value={generateForm.userId}
                  onChange={(e) => setGenerateForm({ ...generateForm, userId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Month / Year</label>
                  <input
                    type="text"
                    required
                    value={generateForm.monthYear}
                    onChange={(e) => setGenerateForm({ ...generateForm, monthYear: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gross Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={generateForm.grossPay}
                    onChange={(e) => setGenerateForm({ ...generateForm, grossPay: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Deductions (₹)</label>
                  <input
                    type="number"
                    required
                    value={generateForm.totalDeductions}
                    onChange={(e) => setGenerateForm({ ...generateForm, totalDeductions: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Net Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={generateForm.netPay}
                    onChange={(e) => setGenerateForm({ ...generateForm, netPay: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Confirm &amp; Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function PayrollView() {
  return (
    <AppShell>
      <PayrollContent />
    </AppShell>
  );
}
export default PayrollView;
