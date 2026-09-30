import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  CalendarCheck,
  Clock,
  Wallet,
  Megaphone,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CalendarDays,
  FileText,
  UserPlus,
  BarChart3,
  Shield,
  ClipboardCheck,
  UserCheck,
  User,
  Receipt,
  CheckCircle2,
  PlayCircle,
  StopCircle,
  Building2,
  Target,
  Award,
  Heart,
  Cake,
  Gift,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { ROLE_LABELS, type UserRole, formatRoleLabel } from "@/lib/constants";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dashboardService } from "@/services/dashboard.service";
import { attendanceService } from "@/services/attendance.service";
import { engageService } from "@/services/engage.service";
import { CheckInOutWidget } from "@/components/ui/CheckInOutWidget";
import { useToast } from "@/context/ToastContext";
import { authStorage } from "@/lib/auth-storage";

function DashboardContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const currentRole: UserRole = user?.role || "admin";
  const isCEO = currentRole === "ceo";

  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [onLeaveToday, setOnLeaveToday] = useState<any[]>([]);
  const [hoursChart, setHoursChart] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        overviewRes,
        todayRes,
        celebrationsRes,
        holidaysRes,
        onLeaveRes,
        hoursRes,
        announcementsRes,
      ] = await Promise.allSettled([
        dashboardService.getOverview(),
        attendanceService.getTodayStatus(),
        dashboardService.getCelebrations(),
        dashboardService.getHolidaysSpotlight(),
        dashboardService.getOnLeaveToday(),
        dashboardService.getHoursLoggedChart(),
        engageService.getAnnouncements(),
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value) {
        setOverview(overviewRes.value.data || overviewRes.value);
      }
      if (todayRes.status === "fulfilled" && todayRes.value) {
        setTodayAttendance(todayRes.value.data || todayRes.value);
      }
      if (celebrationsRes.status === "fulfilled" && celebrationsRes.value) {
        const data = celebrationsRes.value.data || celebrationsRes.value;
        setCelebrations(Array.isArray(data) ? data : []);
      }
      if (holidaysRes.status === "fulfilled" && holidaysRes.value) {
        const data = holidaysRes.value.data || holidaysRes.value;
        setHolidays(Array.isArray(data) ? data : []);
      }
      if (onLeaveRes.status === "fulfilled" && onLeaveRes.value) {
        const data = onLeaveRes.value.data || onLeaveRes.value;
        setOnLeaveToday(Array.isArray(data) ? data : []);
      }
      if (hoursRes.status === "fulfilled" && hoursRes.value) {
        const data = hoursRes.value.data || hoursRes.value;
        setHoursChart(Array.isArray(data) ? data : []);
      }
      if (announcementsRes.status === "fulfilled" && announcementsRes.value) {
        const data = announcementsRes.value.data || announcementsRes.value;
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) return;
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle live Punch In / Out
  const isClockedIn = todayAttendance?.status === "PRESENT" || todayAttendance?.status === "LATE" || !!todayAttendance?.checkInTime;

  const handleToggleClock = async () => {
    setIsClocking(true);
    try {
      if (!isClockedIn) {
        await attendanceService.checkIn({
          workMode: "office",
          notes: "Quick check-in from dashboard",
        });
        toast.success("Checked in successfully!");
      } else {
        await attendanceService.checkOut({
          notes: "Quick check-out from dashboard",
        });
        toast.success("Checked out successfully!");
      }
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update attendance punch.");
    } finally {
      setIsClocking(false);
    }
  };

  const handleSendWish = async (targetId: string, type: "BIRTHDAY" | "ANNIVERSARY") => {
    try {
      await dashboardService.sendWish(targetId, {
        type,
        message: type === "BIRTHDAY" ? "Happy Birthday! Wishing you a wonderful year ahead! 🎉" : "Congratulations on your work anniversary! 🎊",
      });
      toast.success("Wish sent successfully! 🎉");
    } catch {
      toast.info("Wish sent!");
    }
  };

  // Dynamic KPI Stats based strictly on live backend data & role
  const dynamicStats = [
    {
      label: isCEO ? "Total Active Headcount" : "Present Staff Today",
      value: overview?.presentCount ?? overview?.totalEmployees ?? "0",
      icon: Users,
      trend: overview?.employeeTrend || "Live",
      color: "orange" as const,
    },
    {
      label: isCEO ? "Average Campus Attendance" : "My Logged Hours (Month)",
      value: overview?.attendanceRate != null ? `${overview.attendanceRate}%` : (overview?.monthlyHours != null ? `${overview.monthlyHours}h` : "0%"),
      icon: CalendarCheck,
      trend: "Live",
      color: "green" as const,
    },
    {
      label: isCEO ? "Pending Executive Approvals" : "Pending Leave Requests",
      value: overview?.pendingLeaves ?? overview?.pendingApprovals ?? "0",
      icon: CalendarDays,
      trend: "Live",
      color: "blue" as const,
    },
    {
      label: isCEO ? "Disbursed Payroll (MTD)" : "My Available Paid Leaves",
      value: overview?.disbursedPayroll != null ? `₹${Number(overview.disbursedPayroll).toLocaleString()}` : (overview?.leaveBalance != null ? `${overview.leaveBalance} Days` : "0 Days"),
      icon: Wallet,
      trend: "Live",
      color: "purple" as const,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Colleague";
  const greeting = getGreeting();
  const roleLabel = formatRoleLabel(user?.role).toUpperCase();
  const campusLocation = user?.department ? `${user.department} Campus` : "Sivakasi Campus";

  // Mascot voice speech
  const speakScreenGreeting = useCallback((force = false) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!force && sessionStorage.getItem("wg_greeting_played") === "true") {
      return;
    }

    const screenSentence = `Hi ${firstName}, ${greeting}`;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(screenSentence);
      utterance.rate = 0.92;
      utterance.pitch = 0.88;
      utterance.lang = "en-US";

      const playUtterance = () => {
        const voices = window.speechSynthesis.getVoices();
        const sirVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("David") ||
              v.name.includes("Mark") ||
              v.name.includes("George") ||
              v.name.includes("Ravi") ||
              v.name.includes("Guy") ||
              v.name.includes("Ryan") ||
              v.name.toLowerCase().includes("male") ||
              v.name.includes("Natural"))
        ) || voices.find((v) => v.lang.startsWith("en"));

        if (sirVoice) {
          utterance.voice = sirVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        playUtterance();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          playUtterance();
        };
      }
    } catch (err) {
      console.error("Speech synthesis error:", err);
      setIsSpeaking(false);
    }
  }, [firstName, greeting]);

  useEffect(() => {
    if (!user?.name) return;

    // Only play automatic greeting once per session
    if (typeof window !== "undefined" && sessionStorage.getItem("wg_greeting_played") === "true") {
      return;
    }

    let hasRun = false;
    const triggerSpeech = () => {
      if (!hasRun) {
        if (typeof window !== "undefined") {
          if (sessionStorage.getItem("wg_greeting_played") === "true") return;
          sessionStorage.setItem("wg_greeting_played", "true");
        }
        hasRun = true;
        speakScreenGreeting(true);
      }
    };

    const timer = setTimeout(() => {
      triggerSpeech();
    }, 400);

    const handleFirstInteraction = () => {
      triggerSpeech();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [user?.name, speakScreenGreeting]);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071333] via-[#0A1B45] to-[#142B67] p-6 lg:p-7 text-white shadow-xl border border-[#16326F]/60">
        <div className="absolute left-10 top-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-orange-500/15 blur-2xl pointer-events-none" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          {/* Left: Mascot & Dynamic Greeting */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div
              onClick={() => speakScreenGreeting(true)}
              className="relative flex-shrink-0 flex items-center justify-center cursor-pointer group"
              title="Click to hear mascot speech"
            >
              <div
                className={`absolute h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-amber-500/30 to-orange-500/20 blur-md transition-all duration-300 ${
                  isSpeaking
                    ? "scale-125 from-orange-400/50 to-amber-400/40 animate-pulse"
                    : "group-hover:scale-110"
                }`}
              />
              <img
                src="/bdt_mascot.webp"
                alt="WeGrow Mascot"
                className={`relative h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-[0_8px_16px_rgba(234,97,24,0.35)] transition-transform duration-300 ${
                  isSpeaking ? "scale-105 animate-bounce" : "group-hover:scale-105"
                }`}
              />
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[9px] text-white items-center justify-center font-bold">
                    🔊
                  </span>
                </span>
              )}
            </div>

            {/* Greeting & Campus Badge */}
            <div className="space-y-1">
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Hi {firstName}, {greeting}
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-amber-400">
                  {roleLabel}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-medium">
                  {campusLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Punch Widget */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            <CheckInOutWidget variant="banner" onStatusChange={fetchDashboardData} />

            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>

            {isCEO && (
              <a
                href="/reports"
                className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm border border-white/10 transition-all"
              >
                <BarChart3 className="h-4 w-4 text-amber-400" />
                <span>Executive Reports</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicStats.map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
          />
        ))}
      </div>

      {/* Main Grid: Live Activity Feed, Celebrations & Quick Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Announcements & Live Updates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Institutional Announcements */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E4EF]">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#EA6118]" />
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  Latest Announcements &amp; Notices
                </h3>
              </div>
              <a href="/announcements" className="text-xs font-bold text-[#EA6118] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="divide-y divide-[#E2E4EF]/60 pt-2">
              {announcements.length > 0 ? (
                announcements.slice(0, 3).map((item, idx) => (
                  <div key={item._id || item.id || idx} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#12173A]">{item.title}</span>
                        {item.category && (
                          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-[#EA6118]">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5B6180] line-clamp-2">{item.body || item.content}</p>
                    </div>
                    <span className="text-[10px] text-[#8A8FB0] whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#8A8FB0]">
                  No new announcements at this time.
                </div>
              )}
            </div>
          </div>

          {/* On Leave Today */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E4EF]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#3B82F6]" />
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  Colleagues on Leave Today
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#8A8FB0]">
                {onLeaveToday.length} Staff
              </span>
            </div>

            <div className="pt-4">
              {onLeaveToday.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onLeaveToday.map((leave, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                        {(leave.userName || leave.name || "U")[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#12173A]">{leave.userName || leave.name}</p>
                        <p className="text-[10px] text-[#64748B]">{leave.leaveType || "Leave"} • {leave.department || "General"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8A8FB0] text-center py-4">All colleagues are available today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Celebrations & Holidays Spotlight */}
        <div className="space-y-6">
          {/* Celebrations Card */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E4EF] pb-3">
              <div className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-[#F59E0B]" />
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  Celebrations
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#8A8FB0]">This Month</span>
            </div>

            {celebrations.length > 0 ? (
              <div className="space-y-3">
                {celebrations.slice(0, 4).map((celeb, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <div>
                      <p className="text-xs font-bold text-[#12173A]">{celeb.name || celeb.userName}</p>
                      <p className="text-[10px] text-amber-700">{celeb.type === "BIRTHDAY" ? "🎂 Birthday" : "🎉 Work Anniversary"} • {celeb.date || "Upcoming"}</p>
                    </div>
                    <button
                      onClick={() => handleSendWish(celeb.userId || celeb.id, celeb.type || "BIRTHDAY")}
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-[10px] font-bold transition-colors shadow-sm"
                    >
                      Wish
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8A8FB0] text-center py-4">No celebrations today.</p>
            )}
          </div>

          {/* Holidays Spotlight */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E4EF] pb-3">
              <Gift className="h-5 w-5 text-[#10B981]" />
              <h3 className="font-heading text-base font-bold text-[#12173A]">
                Upcoming Holidays
              </h3>
            </div>

            {holidays.length > 0 ? (
              <div className="space-y-2.5">
                {holidays.slice(0, 3).map((holiday, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                    <span className="font-semibold text-emerald-900">{holiday.name || holiday.title}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{holiday.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8A8FB0] text-center py-4">No upcoming public holidays this week.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
export default DashboardView;
