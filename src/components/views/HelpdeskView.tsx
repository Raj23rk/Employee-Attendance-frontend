import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { LifeBuoy, Plus, MessageSquare, CheckCircle2, Clock, Send, RefreshCw, X, User, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { helpdeskService } from "@/services/helpdesk.service";
import { usersService } from "@/services/users.service";
import { useToast } from "@/context/ToastContext";
import { formatRoleLabel } from "@/lib/constants";

const DEFAULT_STAFF_FALLBACK: any[] = [
  { _id: "st-1", id: "st-1", name: "Dr. Thavabalan", email: "dr.thavabalan@gmail.com", employeeId: "WG-EMP-001", role: "MD", department: "Managing Director" },
  { _id: "st-2", id: "st-2", name: "Dr. Lakshmipriya", email: "lakshmipriya@psr.edu.in", employeeId: "WG-EMP-002", role: "GM", department: "Management / Operations" },
  { _id: "st-3", id: "st-3", name: "Ashokkumar M", email: "ak45ashokkumar@gmail.com", employeeId: "WG-EMP-004", role: "ADMIN", department: "Administration", designation: "System Administrator" },
  { _id: "st-4", id: "st-4", name: "Priya Sharma", email: "priya.sharma@wegrow.edu.in", employeeId: "WG-FAC-014", role: "HR_MANAGER", department: "Human Resources" },
  { _id: "st-5", id: "st-5", name: "Vijay Kumaran", email: "vijay.k@wegrow.edu.in", employeeId: "WG-FAC-028", role: "MANAGER", department: "Computer Applications" },
];

function HelpdeskContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>(DEFAULT_STAFF_FALLBACK);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    category: "IT",
    description: "",
    priority: "MEDIUM",
    assignedTo: "",
    sendNotification: true,
  });

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ticketRes, staffRes, userRes] = await Promise.allSettled([
        helpdeskService.getMyTickets(),
        usersService.getStaffList(),
        usersService.getAllUsers({ limit: 100 }),
      ]);

      if (ticketRes.status === "fulfilled" && ticketRes.value) {
        const data = ticketRes.value?.data || ticketRes.value;
        setTickets(Array.isArray(data) ? data : []);
      }

      let parsedUsers: any[] = [];
      if (staffRes.status === "fulfilled" && staffRes.value) {
        const sData = staffRes.value?.data || staffRes.value;
        if (Array.isArray(sData) && sData.length > 0) {
          parsedUsers = sData;
        }
      }

      if (parsedUsers.length === 0 && userRes.status === "fulfilled" && userRes.value) {
        const uData = userRes.value?.data || userRes.value;
        const usersArray = Array.isArray(uData)
          ? uData
          : (Array.isArray(uData?.users) ? uData.users : (Array.isArray(uData?.data) ? uData.data : []));
        if (usersArray.length > 0) {
          parsedUsers = usersArray;
        }
      }

      if (parsedUsers.length === 0) {
        setStaffList(DEFAULT_STAFF_FALLBACK);
      } else {
        const map = new Map<string, any>();
        parsedUsers.forEach((u) => {
          const key = (u.employeeId || u._id || u.id || u.email || "").toLowerCase();
          if (key) map.set(key, u);
        });
        DEFAULT_STAFF_FALLBACK.forEach((u) => {
          const key = (u.employeeId || u._id || u.id || u.email || "").toLowerCase();
          if (!map.has(key)) map.set(key, u);
        });
        setStaffList(Array.from(map.values()));
      }
    } catch (err) {
      console.error("Failed to load tickets/staff:", err);
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
      const assignedStaff = staffList.find(
        (s) => s._id === form.assignedTo || s.id === form.assignedTo || s.employeeId === form.assignedTo
      );

      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        priority: form.priority,
        assignedTo: form.assignedTo || undefined,
        assigneeId: form.assignedTo || undefined,
        assignedPersonName: assignedStaff?.name,
        assignedPersonEmail: assignedStaff?.email,
        sendNotification: form.sendNotification,
      };

      await helpdeskService.createTicket(payload);
      
      const assignedLabel = assignedStaff ? assignedStaff.name : `${form.category} Support Team`;
      toast.success(
        form.sendNotification
          ? `Support ticket raised & assigned to ${assignedLabel}! Notification dispatched.`
          : `Support ticket raised & assigned to ${assignedLabel}!`
      );
      setShowNew(false);
      setForm({
        title: "",
        category: "IT",
        description: "",
        priority: "MEDIUM",
        assignedTo: "",
        sendNotification: true,
      });
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
                  <th className="py-3 px-4 uppercase">Assigned To</th>
                  <th className="py-3 px-4 uppercase">Priority</th>
                  <th className="py-3 px-4 uppercase">Created On</th>
                  <th className="py-3 px-4 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4EF]">
                {tickets.map((t: any, idx) => {
                  const assignedName =
                    t.assignedPersonName ||
                    (typeof t.assignedTo === "object" ? t.assignedTo?.name : null) ||
                    t.assignedToName ||
                    (t.assignedTo ? staffList.find((s) => s._id === t.assignedTo || s.id === t.assignedTo || s.employeeId === t.assignedTo)?.name : null) ||
                    `${t.category || "General"} Support`;

                  return (
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
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <User className="h-3 w-3 text-[#EA6118]" />
                          <span>{assignedName}</span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-12">No active support tickets found.</p>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-[#12173A]">
                  Raise Support Ticket
                </h3>
                <p className="text-[11px] text-slate-500">
                  Submit a request with assignee delegation and instant alerts.
                </p>
              </div>
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold"
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Assign To (Staff Member / Department Authority) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#EA6118]" />
                    <span>Assign To (Staff Member / Department Lead)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#EA6118] focus:outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Auto-Route by Category / Helpdesk Team --</option>
                  <optgroup label="── Institutional Staff &amp; Faculty Roster ──">
                    {staffList.map((st: any) => {
                      const stId = st._id || st.id || st.employeeId || st.email;
                      const roleLabel = formatRoleLabel(st.role || st.designation);
                      const dept = st.department || st.designation || "General";
                      const empId = st.employeeId ? ` (${st.employeeId})` : "";
                      return (
                        <option key={stId} value={stId}>
                          {st.name}{empId} • {roleLabel} - {dept}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
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

              {/* Send Notification Option */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-100/80 text-[#EA6118] shrink-0 mt-0.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <label htmlFor="send-ticket-notify" className="font-bold text-slate-900 cursor-pointer text-xs block">
                      Send Notification Alert
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Send real-time in-app notification &amp; email alert to the assigned person / support team.
                    </p>
                  </div>
                </div>
                <input
                  id="send-ticket-notify"
                  type="checkbox"
                  checked={form.sendNotification}
                  onChange={(e) => setForm({ ...form, sendNotification: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-[#EA6118] focus:ring-[#EA6118] accent-[#EA6118] cursor-pointer mt-1"
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
