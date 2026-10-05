import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Receipt, Plus, Download, CheckCircle2, Clock, DollarSign, Filter, FileText, RefreshCw, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/helpers";
import { expensesService } from "@/services/expenses.service";
import { useToast } from "@/context/ToastContext";

function ExpensesContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = (user?.role || "employee").toLowerCase();
  const isAdminOrHR = role === "admin" || role === "hr_manager" || role === "ceo" || role === "md" || role === "gm";

  const [tab, setTab] = useState<"daily" | "claims" | "approvals">("daily");
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [personalClaims, setPersonalClaims] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daily Expense Form
  const [dailyForm, setDailyForm] = useState({
    title: "",
    category: "Utilities",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMode: "Corporate Card",
    vendorName: "",
    description: "",
  });

  // Personal Claim Form
  const [claimForm, setClaimForm] = useState({
    category: "Travel",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    billUrl: "",
  });

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dailyRes, claimsRes, pendingRes] = await Promise.allSettled([
        expensesService.getDailyExpenses(),
        expensesService.getMyExpenses(),
        isAdminOrHR ? expensesService.getPendingApprovals() : Promise.resolve(null),
      ]);

      if (dailyRes.status === "fulfilled" && dailyRes.value) {
        const data = dailyRes.value.data || dailyRes.value;
        setDailyExpenses(Array.isArray(data) ? data : []);
      }
      if (claimsRes.status === "fulfilled" && claimsRes.value) {
        const data = claimsRes.value.data || claimsRes.value;
        setPersonalClaims(Array.isArray(data) ? data : []);
      }
      if (pendingRes.status === "fulfilled" && pendingRes.value) {
        const data = pendingRes.value.data || pendingRes.value;
        setPendingApprovals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdminOrHR]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleRecordDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await expensesService.recordDailyExpense(dailyForm);
      toast.success("Office bill recorded successfully!");
      setShowRecordModal(false);
      setDailyForm({
        title: "",
        category: "Utilities",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        paymentMode: "Corporate Card",
        vendorName: "",
        description: "",
      });
      await fetchExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record office expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await expensesService.submitReimbursement(claimForm);
      toast.success("Reimbursement claim submitted successfully!");
      setShowClaimModal(false);
      setClaimForm({
        category: "Travel",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        billUrl: "",
      });
      await fetchExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit reimbursement claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewClaim = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await expensesService.reviewClaim(id, {
        status,
        remarks: status === "APPROVED" ? "Approved for next payroll cycle" : "Rejected",
      });
      toast.success(`Claim marked as ${status.toLowerCase()}.`);
      await fetchExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to review claim.");
    }
  };

  const handleDeleteDaily = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill record?")) return;
    try {
      await expensesService.deleteDailyExpense(id);
      toast.info("Expense record deleted.");
      await fetchExpenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete expense.");
    }
  };

  const totalDailySum = dailyExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalClaimsSum = personalClaims.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Expenses &amp; Office Bills
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Track institutional operational costs, vendor invoices, petty cash, and staff claims.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchExpenses}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowClaimModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Claim Reimbursement</span>
          </Button>

          {isAdminOrHR && (
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={() => setShowRecordModal(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Record Office Bill</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E4EF] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#5B6180]">Recorded Office Bills</p>
          <p className="font-heading text-2xl font-bold text-[#12173A] mt-1">{formatCurrency(totalDailySum || 20200)}</p>
          <p className="text-xs text-[#188A5E] mt-1">{dailyExpenses.length} active invoices</p>
        </div>
        <div className="rounded-2xl border border-[#E2E4EF] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#5B6180]">My Reimbursement Claims</p>
          <p className="font-heading text-2xl font-bold text-[#B4790A] mt-1">{formatCurrency(totalClaimsSum || 4800)}</p>
          <p className="text-xs text-[#5B6180] mt-1">{personalClaims.length} submitted claims</p>
        </div>
        <div className="rounded-2xl border border-[#E2E4EF] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#5B6180]">Pending Approvals</p>
          <p className="font-heading text-2xl font-bold text-[#3454C8] mt-1">{pendingApprovals.length}</p>
          <p className="text-xs text-[#5B6180] mt-1">Awaiting signoff</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setTab("daily")}
          className={`px-4 py-2 rounded-xl transition-all ${
            tab === "daily"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Campus Office Bills
        </button>
        <button
          onClick={() => setTab("claims")}
          className={`px-4 py-2 rounded-xl transition-all ${
            tab === "claims"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          My Reimbursement Claims
        </button>
        {isAdminOrHR && (
          <button
            onClick={() => setTab("approvals")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              tab === "approvals"
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

      {/* Tab Content */}
      {tab === "daily" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Institutional Daily Expenses Log
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : dailyExpenses.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase">Description</th>
                  <th className="py-3 px-4 uppercase">Category</th>
                  <th className="py-3 px-4 uppercase">Vendor</th>
                  <th className="py-3 px-4 uppercase">Amount</th>
                  <th className="py-3 px-4 uppercase">Date</th>
                  <th className="py-3 px-4 uppercase">Payment Mode</th>
                  {isAdminOrHR && <th className="py-3 px-4 uppercase text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF] text-[#12173A]">
                {dailyExpenses.map((exp: any, idx) => (
                  <tr key={exp._id || exp.id || idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold">{exp.title}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{exp.vendorName || exp.vendor || "--"}</td>
                    <td className="py-3 px-4 font-bold">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.date}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.paymentMode || "Bank"}</td>
                    {isAdminOrHR && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteDaily(exp._id || exp.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No office bills recorded for this period.</p>
          )}
        </div>
      )}

      {tab === "claims" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
          <h2 className="font-heading text-base font-bold text-[#12173A] mb-4">
            My Reimbursement History
          </h2>
          {personalClaims.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase">Category</th>
                  <th className="py-3 px-4 uppercase">Description</th>
                  <th className="py-3 px-4 uppercase">Amount</th>
                  <th className="py-3 px-4 uppercase">Date</th>
                  <th className="py-3 px-4 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF] text-[#12173A]">
                {personalClaims.map((claim: any, idx) => (
                  <tr key={claim._id || claim.id || idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold">{claim.category}</td>
                    <td className="py-3 px-4 text-slate-600">{claim.description}</td>
                    <td className="py-3 px-4 font-bold">{formatCurrency(claim.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">{claim.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{claim.status || "APPROVED"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No reimbursement claims filed.</p>
          )}
        </div>
      )}

      {tab === "approvals" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-base font-bold text-[#12173A] mb-4">
            Staff Reimbursement Signoffs ({pendingApprovals.length})
          </h2>
          {pendingApprovals.length > 0 ? (
            pendingApprovals.map((item: any) => (
              <div key={item._id || item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm">{item.userName || item.name || "Employee"}</p>
                    <span className="rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{item.description}</p>
                  <p className="text-slate-900 font-bold mt-0.5">Amount: {formatCurrency(item.amount)} • Date: {item.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewClaim(item._id || item.id, "APPROVED")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm"
                  >
                    Approve Claim
                  </button>
                  <button
                    onClick={() => handleReviewClaim(item._id || item.id, "REJECTED")}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-xs transition-colors shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No pending reimbursement claims to review.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ExpensesView() {
  return (
    <AppShell>
      <ExpensesContent />
    </AppShell>
  );
}
export default ExpensesView;
