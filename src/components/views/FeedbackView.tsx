import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Shield, Send, Lock, Eye, CheckCircle2, MessageSquare, AlertTriangle, Sparkles, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { feedbackService } from "@/services/feedback.service";
import { useToast } from "@/context/ToastContext";

function FeedbackContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isCEO = user?.role === "ceo";

  const [activeTab, setActiveTab] = useState<"submit" | "history" | "ceo_inbox">(isCEO ? "ceo_inbox" : "submit");
  const [myFeedback, setMyFeedback] = useState<any[]>([]);
  const [ceoFeedback, setCeoFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    category: "INFRASTRUCTURE",
    message: "",
    suggestions: "",
  });

  const fetchFeedbackData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [myRes, ceoRes] = await Promise.allSettled([
        feedbackService.getMyFeedback(),
        isCEO ? feedbackService.getAllFeedback() : Promise.resolve(null),
      ]);

      if (myRes.status === "fulfilled" && myRes.value) {
        const data = myRes.value.data || myRes.value;
        setMyFeedback(Array.isArray(data) ? data : []);
      }
      if (ceoRes.status === "fulfilled" && ceoRes.value) {
        const data = ceoRes.value.data || ceoRes.value;
        setCeoFeedback(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isCEO]);

  useEffect(() => {
    fetchFeedbackData();
  }, [fetchFeedbackData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback(form);
      toast.success("Confidential feedback submitted directly to the CEO Executive Office!");
      setForm({ title: "", category: "INFRASTRUCTURE", message: "", suggestions: "" });
      await fetchFeedbackData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await feedbackService.updateFeedbackStatus(id, {
        status,
        ceoNotes: notes || "Reviewed and addressed by CEO office.",
      });
      toast.success("Feedback status updated.");
      await fetchFeedbackData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update feedback status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2.5 py-0.5 text-xs font-bold text-[#F0834A]">
              <Shield className="h-3 w-3" />
              {isCEO ? "CEO Executive Oversight" : "Strictly Confidential & Encrypted"}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A] mt-1">
            Confidential Open Feedback
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Direct channel between campus faculty/staff and the CEO Executive Office.
          </p>
        </div>

        <button
          onClick={fetchFeedbackData}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {!isCEO && (
          <button
            onClick={() => setActiveTab("submit")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "submit"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            Submit Feedback
          </button>
        )}

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "history"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          My Submitted Feedback
        </button>

        {isCEO && (
          <button
            onClick={() => setActiveTab("ceo_inbox")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "ceo_inbox"
                ? "bg-[#EA6118] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>CEO Direct Feedback Inbox</span>
            {ceoFeedback.length > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.2">
                {ceoFeedback.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab 1: Submit Form */}
      {activeTab === "submit" && (
        <div className="max-w-2xl rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-5">
          <h2 className="font-heading text-base font-bold text-[#12173A]">
            Send Direct Note to Leadership
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Topic / Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Improvement in Cafeteria Menu & Quality"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
              >
                <option value="INFRASTRUCTURE">Infrastructure &amp; Campus Facility</option>
                <option value="WORK_CULTURE">Work Culture &amp; Wellbeing</option>
                <option value="MANAGEMENT">Academic &amp; Management Process</option>
                <option value="GRIEVANCE">Grievance &amp; Compliance</option>
                <option value="SUGGESTION">General Suggestion</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Detailed Feedback / Message</label>
              <textarea
                rows={4}
                required
                placeholder="Describe the context clearly..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Proposed Solutions / Suggestions (Optional)</label>
              <textarea
                rows={2}
                placeholder="What would you suggest to improve this?"
                value={form.suggestions}
                onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="w-full justify-center gap-2">
                <Send className="h-4 w-4" />
                <span>Send Confidential Feedback</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: My Feedback History */}
      {activeTab === "history" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-base font-bold text-[#12173A]">
            My Submitted Feedback History
          </h2>
          {myFeedback.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {myFeedback.map((item: any, idx) => (
                <div key={item._id || item.id || idx} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{item.title}</span>
                    <Badge variant="info">{item.status || "OPEN"}</Badge>
                  </div>
                  <p className="text-slate-600">{item.message}</p>
                  {item.ceoNotes && (
                    <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-orange-950 text-[11px]">
                      <strong>CEO Office Response:</strong> {item.ceoNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No feedback history logged for this account.</p>
          )}
        </div>
      )}

      {/* Tab 3: CEO Inbox */}
      {activeTab === "ceo_inbox" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-heading text-base font-bold text-[#12173A]">
            CEO Executive Feedback Inbox ({ceoFeedback.length})
          </h2>
          {ceoFeedback.length > 0 ? (
            <div className="space-y-4 text-xs">
              {ceoFeedback.map((fb: any) => (
                <div key={fb._id || fb.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{fb.title}</h3>
                      <p className="text-slate-500 text-[11px]">Category: {fb.category} • Submitted by: <strong className="text-slate-800">{fb.authorName || fb.author || "Faculty Member"}</strong> ({fb.department || "Campus"})</p>
                    </div>
                    <Badge variant="warning">{fb.status || "OPEN"}</Badge>
                  </div>

                  <p className="text-slate-700 bg-white p-3 rounded-2xl border border-slate-100">{fb.message}</p>

                  {fb.suggestions && (
                    <p className="text-slate-500 text-[11px]"><strong>Suggestion:</strong> {fb.suggestions}</p>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Action Status:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(fb._id || fb.id, "REVIEWED")}
                        className="rounded-lg bg-blue-600 text-white font-bold px-3 py-1 text-xs hover:bg-blue-700"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(fb._id || fb.id, "ACTION_TAKEN")}
                        className="rounded-lg bg-emerald-600 text-white font-bold px-3 py-1 text-xs hover:bg-emerald-700"
                      >
                        Action Taken
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No feedback submitted in CEO inbox yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function FeedbackView() {
  return (
    <AppShell>
      <FeedbackContent />
    </AppShell>
  );
}
export default FeedbackView;
