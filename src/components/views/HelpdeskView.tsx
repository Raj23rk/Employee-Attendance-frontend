import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { LifeBuoy, Plus, MessageSquare, CheckCircle2, Clock, Send, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { helpdeskService } from "@/services/helpdesk.service";
import { useToast } from "@/context/ToastContext";

function HelpdeskContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    category: "IT",
    description: "",
    priority: "MEDIUM",
  });

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await helpdeskService.getMyTickets();
      const data = res?.data || res;
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await helpdeskService.createTicket(form);
      toast.success("Support ticket raised successfully!");
      setShowNew(false);
      setForm({ title: "", category: "IT", description: "", priority: "MEDIUM" });
      await fetchTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to raise support ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Helpdesk &amp; Support Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Raise support tickets for IT infrastructure, HR queries, payroll discrepancies, or campus admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Raise Support Ticket</span>
          </Button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E4EF] bg-[#F4F5F9] text-[#5B6180]">
                <tr>
                  <th className="py-3 px-4 uppercase">Ticket</th>
                  <th className="py-3 px-4 uppercase">Category</th>
                  <th className="py-3 px-4 uppercase">Priority</th>
                  <th className="py-3 px-4 uppercase">Created On</th>
                  <th className="py-3 px-4 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF]">
                {tickets.map((t: any, idx) => (
                  <tr key={t._id || t.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#12173A]">{t.title || t.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-orange-600">{t.priority}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{t.status || "OPEN"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-12">No active support tickets found.</p>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Raise Support Ticket
              </h3>
              <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subject / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need Secondary Monitor for Design Work"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                  >
                    <option value="IT">IT Support</option>
                    <option value="HR">HR Query</option>
                    <option value="PAYROLL">Payroll Discrepancy</option>
                    <option value="ADMIN">Campus Administration</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the issue, location, or requirement..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpdeskView() {
  return (
    <AppShell>
      <HelpdeskContent />
    </AppShell>
  );
}
export default HelpdeskView;
