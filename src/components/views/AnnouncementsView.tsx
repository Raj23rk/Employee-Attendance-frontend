import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Megaphone, Plus, Bell, Calendar, Sparkles, Heart, RefreshCw, X, Send, MapPin, Plane } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { engageService } from "@/services/engage.service";
import { useToast } from "@/context/ToastContext";

function AnnouncementsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = user?.role || "employee";
  const canPost = role === "hr_manager" || role === "admin" || role === "ceo";

  const [activeTab, setActiveTab] = useState<"notices" | "events" | "travel">("notices");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showPostModal, setShowPostModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [postForm, setPostForm] = useState({
    title: "",
    category: "Campus Notice",
    body: "",
  });

  const [travelForm, setTravelForm] = useState({
    purpose: "",
    destination: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    estimatedCost: 15000,
  });

  const fetchEngageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [annRes, eventsRes] = await Promise.allSettled([
        engageService.getAnnouncements(),
        engageService.getEvents(),
      ]);

      if (annRes.status === "fulfilled" && annRes.value) {
        const data = annRes.value.data || annRes.value;
        setAnnouncements(Array.isArray(data) ? data : []);
      }
      if (eventsRes.status === "fulfilled" && eventsRes.value) {
        const data = eventsRes.value.data || eventsRes.value;
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngageData();
  }, [fetchEngageData]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await engageService.createAnnouncement(postForm);
      toast.success("Announcement posted successfully!");
      setShowPostModal(false);
      setPostForm({ title: "", category: "Campus Notice", body: "" });
      await fetchEngageData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await engageService.toggleLikeAnnouncement(id);
      await fetchEngageData();
    } catch (err) {
      console.error("Failed to like:", err);
    }
  };

  const handleRsvp = async (id: string) => {
    try {
      await engageService.toggleRsvp(id);
      toast.success("RSVP updated!");
      await fetchEngageData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to RSVP.");
    }
  };

  const handleSubmitTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await engageService.submitTravelRequest(travelForm);
      toast.success("Travel booking request submitted successfully!");
      setShowTravelModal(false);
      setTravelForm({
        purpose: "",
        destination: "",
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        estimatedCost: 15000,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit travel request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Campus Announcements &amp; Events
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Official campus news, holiday circulars, academic notices, and HR updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEngageData}
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
            onClick={() => setShowTravelModal(true)}
          >
            <Plane className="h-4 w-4" />
            <span>Travel Booking</span>
          </Button>

          {canPost && (
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={() => setShowPostModal(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Post Circular</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Headers */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("notices")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "notices"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          All Announcements
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "events"
              ? "bg-[#EA6118] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Campus Drives &amp; Events
        </button>
      </div>

      {/* Tab 1: Notices */}
      {activeTab === "notices" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : announcements.length > 0 ? (
            announcements.map((ann: any, idx) => (
              <div
                key={ann._id || ann.id || idx}
                className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EA6118]/10 px-2.5 py-0.5 text-xs font-bold text-[#EA6118]">
                      {ann.authorName || ann.author || "Directorate"}
                    </span>
                    <span className="text-xs text-[#8A8FB0] flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : (ann.date || "Recent")}
                    </span>
                  </div>
                  {ann.category && (
                    <Badge variant="info">
                      {ann.category.toUpperCase()}
                    </Badge>
                  )}
                </div>

                <h2 className="font-heading text-lg font-bold text-[#12173A]">{ann.title}</h2>
                <p className="text-xs sm:text-sm text-[#5B6180] leading-relaxed">{ann.body || ann.content}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleLike(ann._id || ann.id)}
                    className="flex items-center gap-1.5 text-xs text-rose-500 font-bold hover:opacity-80 transition-opacity"
                  >
                    <Heart className="h-4 w-4 fill-rose-500" />
                    <span>{ann.likesCount || ann.likes || 1} Likes</span>
                  </button>
                  <span className="text-[11px] text-slate-400">Verified Campus Announcement</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-12">No active announcements available.</p>
          )}
        </div>
      )}

      {/* Tab 2: Events */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length > 0 ? (
            events.map((ev: any, idx) => (
              <div key={ev._id || ev.id || idx} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                  {ev.category || "Campus Event"}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{ev.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" /> {ev.location || "Auditorium"}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">{ev.date || "Upcoming"}</span>
                  <button
                    onClick={() => handleRsvp(ev._id || ev.id)}
                    className="rounded-xl bg-orange-500 text-white text-xs font-bold px-3 py-1.5 hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    RSVP / Attend
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-12 col-span-full">No upcoming events listed.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AnnouncementsView() {
  return (
    <AuthProvider>
      <AppShell>
        <AnnouncementsContent />
      </AppShell>
    </AuthProvider>
  );
}
export default AnnouncementsView;
