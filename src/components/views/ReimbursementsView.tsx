import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { CreditCard, Plus, Download, CheckCircle2, Clock, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/helpers";
import { expensesService } from "@/services/expenses.service";
import { useToast } from "@/context/ToastContext";

function ReimbursementsContent() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    category: "Travel",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    billUrl: "",
  });

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await expensesService.getMyExpenses();
      const data = res?.data || res;
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await expensesService.submitReimbursement(form);
      toast.success("Reimbursement claim submitted successfully!");
      setShowModal(false);
      setForm({
        category: "Travel",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        billUrl: "",
      });
      await fetchClaims();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Expense &amp; Reimbursement Claims
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Staff expenditure claims, invoice verifications, and accountant clearing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchClaims}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Submit New Claim</span>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : claims.length > 0 ? (
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
            <tbody className="divide-y divide-[#E2E4EF]">
              {claims.map((c: any, idx) => (
                <tr key={c._id || c.id || idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-[#12173A]">{c.category}</td>
                  <td className="py-3 px-4 text-[#5B6180]">{c.description}</td>
                  <td className="py-3 px-4 font-bold text-[#12173A]">{formatCurrency(c.amount)}</td>
                  <td className="py-3 px-4 text-[#5B6180]">{c.date}</td>
                  <td className="py-3 px-4">
                    <Badge variant={c.status === "APPROVED" ? "success" : "warning"}>
                      {c.status || "PENDING"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-400 text-center py-12">No claims filed yet.</p>
        )}
      </div>

      {/* Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Submit Expense Claim
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                >
                  <option value="Travel">Travel &amp; Cab</option>
                  <option value="Food & Dining">Food &amp; Refreshments</option>
                  <option value="Training">Training &amp; Books</option>
                  <option value="Utilities">Utilities &amp; Office</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Reason for expenditure..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Submit Claim
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReimbursementsView() {
  return (
    <AppShell>
      <ReimbursementsContent />
    </AppShell>
  );
}
export default ReimbursementsView;
