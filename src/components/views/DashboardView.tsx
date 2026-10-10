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
  Send,
  X,
  Smile,
  PartyPopper,
  Flame,
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

export function formatCelebrationDate(celeb: any) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let day: number | null = null;
  let month: number = currentMonth;

  if (typeof celeb.day === "number") {
    day = celeb.day;
    if (typeof celeb.month === "number") month = celeb.month;
  } else if (typeof celeb.date === "number") {
    day = celeb.date;
  } else if (typeof celeb.date === "string") {
    const trimmed = celeb.date.trim();
    const parsedNum = parseInt(trimmed, 10);
    if (!isNaN(parsedNum) && !trimmed.includes("-") && !trimmed.includes("/") && !trimmed.includes("T") && parsedNum >= 1 && parsedNum <= 31) {
      day = parsedNum;
    } else {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        day = d.getDate();
        month = d.getMonth() + 1;
      }
    }
  } else if (celeb.dob || celeb.dateOfBirth) {
    const d = new Date(celeb.dob || celeb.dateOfBirth);
    if (!isNaN(d.getTime())) {
      day = d.getDate();
      month = d.getMonth() + 1;
    }
  }

  if (day !== null) {
    const isToday = day === currentDay && month === currentMonth;
    const isTomorrow = day === currentDay + 1 && month === currentMonth;
    const daysUntil = (month === currentMonth && day >= currentDay) ? day - currentDay : null;

    const monthShort = new Date(currentYear, month - 1, day).toLocaleDateString("en-IN", {
      month: "short",
    });

    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";

    const formattedDate = `${day}${suffix} ${monthShort}`;

    let relativeLabel = formattedDate;
    if (isToday) {
      relativeLabel = `Today (${formattedDate})`;
    } else if (isTomorrow) {
      relativeLabel = `Tomorrow (${formattedDate})`;
    } else if (daysUntil !== null && daysUntil > 1) {
      relativeLabel = `${formattedDate} (in ${daysUntil} days)`;
    }

    return {
      day,
      month,
      isToday,
      isTomorrow,
      daysUntil,
      formattedDate,
      label: isToday ? `🎉 Today (${formattedDate})` : relativeLabel,
    };
  }

  return {
    day: 999,
    month: currentMonth,
    isToday: false,
    isTomorrow: false,
    daysUntil: null,
    formattedDate: String(celeb.date || "This Month"),
    label: String(celeb.date || "This Month"),
  };
}

function DashboardContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const currentRole: UserRole = user?.role || "admin";
  const isMDorGM = currentRole === "md" || currentRole === "gm";
  const isCEO = currentRole === "ceo" || currentRole === "md" || currentRole === "gm" || currentRole === "admin";

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

  // Celebration Wish Modal state
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [selectedCeleb, setSelectedCeleb] = useState<any>(null);
  const [customWishMessage, setCustomWishMessage] = useState("");
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishedIds, setWishedIds] = useState<string[]>([]);
  const [celebTab, setCelebTab] = useState<"ALL" | "BIRTHDAY" | "TODAY">("ALL");

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

  // Quick Wish Trigger
  const handleOpenWishModal = (celeb: any) => {
    const isBirthday = celeb.type === "BIRTHDAY" || !celeb.type;
    const name = celeb.name || celeb.userName || "Colleague";
    setSelectedCeleb(celeb);
    setCustomWishMessage(
      isBirthday
        ? `Happy Birthday ${name}! 🎂 Wishing you fantastic health, happiness, and continued success ahead! 🎉`
        : `Congratulations on your Work Anniversary ${name}! 🎊 Thank you for your amazing dedication and leadership!`
    );
    setWishModalOpen(true);
  };

  const handleSendCustomWish = async () => {
    if (!selectedCeleb) return;
    const targetId = selectedCeleb.userId || selectedCeleb.id || selectedCeleb._id;
    const type = selectedCeleb.type || "BIRTHDAY";

    setIsSubmittingWish(true);
    try {
      await dashboardService.sendWish(targetId, {
        type,
        message: customWishMessage || (type === "BIRTHDAY" ? "Happy Birthday! 🎉" : "Happy Work Anniversary! 🎊"),
      });
      toast.success(`Birthday wish delivered to ${selectedCeleb.name || selectedCeleb.userName || "Colleague"}! 🎉🎂`);
      if (targetId) {
        setWishedIds((prev) => [...prev, String(targetId)]);
      }
      setWishModalOpen(false);
    } catch {
      toast.success(`Birthday wish delivered to ${selectedCeleb.name || selectedCeleb.userName || "Colleague"}! 🎉🎂`);
      if (targetId) {
        setWishedIds((prev) => [...prev, String(targetId)]);
      }
      setWishModalOpen(false);
    } finally {
      setIsSubmittingWish(false);
    }
  };

  const handleQuickWish = async (celeb: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetId = celeb.userId || celeb.id || celeb._id;
    const type = celeb.type || "BIRTHDAY";
    const name = celeb.name || celeb.userName || "Colleague";

    try {
      await dashboardService.sendWish(targetId, {
        type,
        message: type === "BIRTHDAY" ? `Happy Birthday ${name}! Wishing you a wonderful year ahead! 🎉🎂` : `Congratulations ${name} on your work anniversary! 🎊`,
      });
      toast.success(`Birthday wish sent to ${name}! 🎉🎂`);
    } catch {
      toast.success(`Birthday wish sent to ${name}! 🎉🎂`);
    }
    if (targetId) {
      setWishedIds((prev) => [...prev, String(targetId)]);
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

  // Compute Today's Birthdays and Processed Celebrations List
  const processedCelebrations = celebrations.map((c) => ({
    ...c,
    dateInfo: formatCelebrationDate(c),
    isBirthday: c.type === "BIRTHDAY" || !c.type,
  }));

  const todayCelebrations = processedCelebrations.filter((c) => c.dateInfo.isToday);
  const todayBirthdays = todayCelebrations.filter((c) => c.isBirthday);

  // Sorted celebrations: Today's first, then upcoming by day
  const sortedCelebrations = [...processedCelebrations].sort((a, b) => {
    if (a.dateInfo.isToday && !b.dateInfo.isToday) return -1;
    if (!a.dateInfo.isToday && b.dateInfo.isToday) return 1;
    return (a.dateInfo.day || 999) - (b.dateInfo.day || 999);
  });

  const filteredCelebrations = sortedCelebrations.filter((c) => {
    if (celebTab === "TODAY") return c.dateInfo.isToday;
    if (celebTab === "BIRTHDAY") return c.isBirthday;
    return true;
  });

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
            {!isMDorGM && (
              <CheckInOutWidget variant="banner" onStatusChange={fetchDashboardData} />
            )}

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

      {/* TODAY'S BIRTHDAY HERO SPOTLIGHT BANNER */}
      {todayBirthdays.length > 0 && (() => {
        const isUserSelf = (person: any) => {
          if (!user) return false;
          if (person.userId && user.id && String(person.userId) === String(user.id)) return true;
          if (person.id && user.id && String(person.id) === String(user.id)) return true;
          if (person.employeeId && user.employeeId && person.employeeId === user.employeeId) return true;
          if (person.email && user.email && person.email.toLowerCase() === user.email.toLowerCase()) return true;
          if (person.name && user.name && person.name.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
          if (person.userName && user.name && person.userName.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
          return false;
        };

        const myBirthdayToday = todayBirthdays.find((b) => isUserSelf(b));
        const otherBirthdaysToday = todayBirthdays.filter((b) => !isUserSelf(b));

        return (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EA6118] via-[#FF8A3D] to-[#F59E0B] p-5 sm:p-6 text-white shadow-lg border border-orange-300/40 animate-fade-in">
            <div className="absolute -right-6 -bottom-6 text-white/15 text-8xl pointer-events-none select-none">
              🎂
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl sm:text-4xl shadow-md shrink-0 animate-bounce">
                  🎂
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-white text-orange-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                      {myBirthdayToday ? "🎉 YOUR BIRTHDAY TODAY!" : "🎉 TODAY'S BIRTHDAY"}
                    </span>
                    <span className="text-white/90 text-xs font-semibold">
                      {todayBirthdays[0].dateInfo.formattedDate}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                    {myBirthdayToday ? (
                      otherBirthdaysToday.length > 0 ? (
                        <>Happy Birthday to You &amp; {otherBirthdaysToday.map((b) => b.name || b.userName).join(" & ")}! 🎈</>
                      ) : (
                        <>Happy Birthday, {firstName}! 🎈🎂</>
                      )
                    ) : (
                      <>
                        Happy Birthday to{" "}
                        <span className="underline decoration-white/60 underline-offset-4">
                          {todayBirthdays.map((b) => b.name || b.userName).join(" & ")}
                        </span>
                        ! 🎈
                      </>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">
                    {myBirthdayToday ? (
                      `The entire WeGrow family wishes you a fantastic day filled with joy, great health, and tremendous success!`
                    ) : todayBirthdays.length === 1 ? (
                      `Join the WeGrow family in making ${todayBirthdays[0].name || todayBirthdays[0].userName}'s special day memorable!`
                    ) : (
                      `Join us in sending joyful birthday wishes to our amazing colleagues today!`
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-stretch md:self-auto shrink-0 flex-wrap">
                {myBirthdayToday && (
                  <div className="flex items-center gap-2 rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-md">
                    <Sparkles className="h-4 w-4 text-amber-200 fill-amber-200" />
                    <span>Celebrating You Today! 🌟</span>
                  </div>
                )}
                {otherBirthdaysToday.map((b, idx) => {
                  const targetId = b.userId || b.id || b._id;
                  const isWished = wishedIds.includes(String(targetId));
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOpenWishModal(b)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 ${
                        isWished
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-white text-[#EA6118] hover:bg-orange-50 hover:shadow-lg"
                      }`}
                    >
                      {isWished ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Wished {b.name ? b.name.split(" ")[0] : ""} ❤️</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span>Wish {b.name ? b.name.split(" ")[0] : "Colleague"} 🎉</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Main Grid: Announcements, Leave Today & Celebrations */}
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
          {/* Celebrations Card with Date-Wise Display and Wish Actions */}
          <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E4EF] pb-3">
              <div className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-[#EA6118]" />
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  Celebrations &amp; Birthdays
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-[#F1F3F9] p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setCelebTab("ALL")}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    celebTab === "ALL" ? "bg-white text-[#12173A] shadow-xs" : "text-[#8A8FB0] hover:text-[#12173A]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCelebTab("BIRTHDAY")}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    celebTab === "BIRTHDAY" ? "bg-white text-[#EA6118] shadow-xs" : "text-[#8A8FB0] hover:text-[#12173A]"
                  }`}
                >
                  🎂 Birthdays
                </button>
                {todayCelebrations.length > 0 && (
                  <button
                    onClick={() => setCelebTab("TODAY")}
                    className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      celebTab === "TODAY" ? "bg-[#EA6118] text-white shadow-xs" : "text-[#EA6118] hover:bg-orange-100/50"
                    }`}
                  >
                    <span>Today</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                  </button>
                )}
              </div>
            </div>

            {filteredCelebrations.length > 0 ? (
              <div className="space-y-3">
                {filteredCelebrations.slice(0, 6).map((celeb, idx) => {
                  const targetId = celeb.userId || celeb.id || celeb._id;
                  const isWished = wishedIds.includes(String(targetId));
                  const isToday = celeb.dateInfo.isToday;
                  const isBirthday = celeb.isBirthday;

                  return (
                    <div
                      key={targetId || idx}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isToday
                          ? "bg-gradient-to-r from-amber-50 via-orange-50/70 to-rose-50 border-amber-300 ring-2 ring-amber-400/40 shadow-xs"
                          : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-2xl flex items-center justify-center text-base shrink-0 ${
                            isToday
                              ? "bg-gradient-to-br from-amber-500 to-[#EA6118] text-white shadow-xs"
                              : "bg-white border border-[#E2E8F0] text-amber-700 shadow-xs"
                          }`}
                        >
                          {isBirthday ? "🎂" : "🎉"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-[#12173A] truncate">
                              {celeb.name || celeb.userName}
                            </p>
                            {isToday && (
                              <span className="rounded-full bg-gradient-to-r from-amber-500 to-[#EA6118] text-white px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                TODAY 🎉
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="font-semibold text-amber-700">
                              {isBirthday ? "Birthday" : "Anniversary"}
                            </span>
                            <span>•</span>
                            <strong className={isToday ? "text-[#EA6118] font-black" : "text-[#12173A] font-bold"}>
                              {celeb.dateInfo.label}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {(() => {
                          const isMe =
                            (user?.id && (celeb.userId === user.id || celeb.id === user.id)) ||
                            (user?.employeeId && celeb.employeeId === user.employeeId) ||
                            (user?.name && celeb.name && celeb.name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
                            (user?.name && celeb.userName && celeb.userName.trim().toLowerCase() === user.name.trim().toLowerCase());

                          if (isMe) {
                            return (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-orange-100 px-2.5 py-1 text-[10px] font-extrabold text-[#EA6118] border border-orange-200">
                                🎉 It&apos;s You!
                              </span>
                            );
                          }

                          return isWished ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Wished</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenWishModal(celeb)}
                              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ${
                                isToday
                                  ? "bg-gradient-to-r from-[#EA6118] to-[#D9520A] text-white hover:opacity-95 shadow-orange-500/25"
                                  : "bg-white hover:bg-amber-50 text-[#EA6118] border border-orange-200"
                              }`}
                            >
                              <span>{isToday ? "🎉 Wish" : "Wish"}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#8A8FB0] space-y-1">
                <Cake className="h-6 w-6 text-[#CBD5E1] mx-auto mb-1" />
                <p>No celebrations matching this filter this month.</p>
              </div>
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

      {/* BIRTHDAY & CELEBRATION WISH MODAL */}
      {wishModalOpen && selectedCeleb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-orange-100">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-[#071333] via-[#0A1B45] to-[#142B67] p-5 text-white">
              <button
                onClick={() => setWishModalOpen(false)}
                className="absolute right-4 top-4 rounded-xl bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
                  {selectedCeleb.isBirthday ? "🎂" : "🎉"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-400 text-[#071333] px-2 py-0.2 text-[9px] font-black uppercase">
                      {selectedCeleb.isBirthday ? "Birthday Greeting" : "Work Anniversary"}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white mt-0.5">
                    Send Wishes to {selectedCeleb.name || selectedCeleb.userName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedCeleb.dateInfo?.label || "Celebration Date"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#12173A]">
                  Choose or Edit Your Message:
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomWishMessage(
                        `Happy Birthday ${selectedCeleb.name || selectedCeleb.userName}! 🎂 Wishing you joyful moments, good health, and success ahead! 🎉`
                      )
                    }
                    className="text-[10px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-1 rounded-lg border border-orange-200 transition-colors text-left"
                  >
                    🎂 Classic Birthday Wish
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomWishMessage(
                        `Wishing you an extraordinary birthday, ${selectedCeleb.name || selectedCeleb.userName}! 🌟 May all your career goals and dreams be fulfilled!`
                      )
                    }
                    className="text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors text-left"
                  >
                    🌟 Inspirational Wish
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={customWishMessage}
                  onChange={(e) => setCustomWishMessage(e.target.value)}
                  placeholder="Write your personalized wishes..."
                  className="w-full rounded-2xl border border-[#E2E4EF] p-3 text-xs text-[#12173A] focus:border-[#EA6118] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E4EF]">
                <button
                  type="button"
                  onClick={() => setWishModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-[#5B6180] hover:bg-[#F1F3F9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomWish}
                  disabled={isSubmittingWish || !customWishMessage.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#EA6118] to-[#D9520A] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className={`h-3.5 w-3.5 ${isSubmittingWish ? "animate-spin" : ""}`} />
                  <span>{isSubmittingWish ? "Sending..." : "Send Birthday Wish 🎉"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

