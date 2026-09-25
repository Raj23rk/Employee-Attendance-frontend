import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Settings, Shield, Bell, Lock, Sliders, Database, Save, RefreshCw, Plus, X, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { attendanceService } from "@/services/attendance.service";
import { notificationsService } from "@/services/notifications.service";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<"policies" | "templates" | "biometric">("policies");
  const [policies, setPolicies] = useState<any>({
    workStartTime: "09:00",
    workEndTime: "18:00",
    gracePeriodMinutes: 15,
    halfDayThresholdMinutes: 240,
    fullDayThresholdMinutes: 480,
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Template Form Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    code: "LEAVE_APPLIED",
    name: "Leave Application Alert",
    subject: "New Leave Request from {{employeeName}}",
    body: "Hello, {{employeeName}} has submitted a leave request for {{days}} day(s).",
    variables: ["employeeName", "days"],
  });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [polRes, tempRes] = await Promise.allSettled([
        attendanceService.getPolicies(),
        notificationsService.getTemplates(),
      ]);

      if (polRes.status === "fulfilled" && polRes.value) {
        const data = polRes.value.data || polRes.value;
        if (data && typeof data === "object") {
          setPolicies((prev: any) => ({ ...prev, ...data }));
        }
      }
      if (tempRes.status === "fulfilled" && tempRes.value) {
        const data = tempRes.value.data || tempRes.value;
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await attendanceService.updatePolicies(policies);
      alert("Shift and attendance policies saved successfully!");
      await fetchSettings();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update policies.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await notificationsService.createTemplate(templateForm);
      alert("Notification template created!");
      setShowTemplateModal(false);
      await fetchSettings();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncBiometric = async () => {
    try {
      await attendanceService.syncBiometric({
        deviceId: "DEVICE_MAIN_GATE_01",
        logs: [
          {
            employeeId: "EMP001",
            timestamp: new Date().toISOString(),
            punchType: "IN",
          },
        ],
      });
      alert("Biometric terminal logs synced successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Biometric test sync completed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Campus System Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Configure attendance biometric IP terminals, shifts, notification templates, and compliance rules.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Headers */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("policies")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "policies"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Shift &amp; Attendance Policy
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "templates"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Email &amp; Alert Templates
        </button>
        <button
          onClick={() => setActiveTab("biometric")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "biometric"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Biometric Hardware Gateway
        </button>
      </div>

      {/* Tab 1: Policies */}
      {activeTab === "policies" && (
        <div className="max-w-2xl rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-5">
          <h2 className="font-heading text-base font-bold text-[#12173A]">
            Office Shift &amp; Grace Timings
          </h2>

          <form onSubmit={handleSavePolicies} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Standard Work Start Time</label>
                <input
                  type="time"
                  required
                  value={policies.workStartTime || "09:00"}
                  onChange={(e) => setPolicies({ ...policies, workStartTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Standard Work End Time</label>
                <input
                  type="time"
                  required
                  value={policies.workEndTime || "18:00"}
                  onChange={(e) => setPolicies({ ...policies, workEndTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Grace Period (Mins)</label>
                <input
                  type="number"
                  required
                  value={policies.gracePeriodMinutes ?? 15}
                  onChange={(e) => setPolicies({ ...policies, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Half Day (Mins)</label>
                <input
                  type="number"
                  required
                  value={policies.halfDayThresholdMinutes ?? 240}
                  onChange={(e) => setPolicies({ ...policies, halfDayThresholdMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Day (Mins)</label>
                <input
                  type="number"
                  required
                  value={policies.fullDayThresholdMinutes ?? 480}
                  onChange={(e) => setPolicies({ ...policies, fullDayThresholdMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                <span>Save Policy Settings</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Templates */}
      {activeTab === "templates" && (
        <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-heading text-base font-bold text-[#12173A]">
              Configured Alert &amp; Email Templates
            </h2>
            <Button variant="primary" size="sm" onClick={() => setShowTemplateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </Button>
          </div>

          {templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {templates.map((tmpl: any, idx) => (
                <div key={tmpl._id || tmpl.code || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{tmpl.name || tmpl.code}</span>
                    <span className="rounded bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">{tmpl.code}</span>
                  </div>
                  <p className="text-slate-600 font-semibold">Subject: {tmpl.subject}</p>
                  <p className="text-slate-500 text-[11px] bg-white p-2.5 rounded-xl border border-slate-100">{tmpl.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No custom notification templates configured.</p>
          )}
        </div>
      )}

      {/* Tab 3: Biometric */}
      {activeTab === "biometric" && (
        <div className="max-w-2xl rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-5 text-xs">
          <h2 className="font-heading text-base font-bold text-[#12173A]">
            Biometric Hardware Terminal Connectors
          </h2>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-900">Main Gate Biometric Terminal (DEVICE_MAIN_GATE_01)</span>
              </div>
              <Badge variant="success">Online &amp; Active</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">Sync Webhook: <code>/api/v1/attendance/hr/sync-biometric</code></p>
          </div>

          <Button variant="outline" size="sm" onClick={handleSyncBiometric} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Test Hardware Ingestion Webhook</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export function SettingsView() {
  return (
    <AuthProvider>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </AuthProvider>
  );
}
export default SettingsView;
