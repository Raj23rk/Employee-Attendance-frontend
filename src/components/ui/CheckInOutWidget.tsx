import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Play,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Laptop,
  Briefcase,
  ChevronDown,
  RotateCw,
  Navigation,
  ShieldAlert,
  Calendar,
  Sparkles,
  Info,
  X,
  Building,
} from "lucide-react";
import { attendanceService, type PunchPayload } from "@/services/attendance.service";
import { organizationService } from "@/services/organization.service";
import { ATTENDANCE_POLICY_CONFIG, type Branch } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

interface CheckInOutWidgetProps {
  variant?: "banner" | "card";
  onStatusChange?: (status: any) => void;
  className?: string;
}

export function CheckInOutWidget({
  variant = "banner",
  onStatusChange,
  className = "",
}: CheckInOutWidgetProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workMode, setWorkMode] = useState<"office" | "wfh" | "on_duty">("office");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Geolocation & Branch State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    nearestBranch: Branch | null;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Employee's database assigned branch resolution
  const userAssignedBranchName = user?.branch?.trim() || "";

  const activeBranch = useMemo(() => {
    const matchedUserBranch = branches.find((b) => {
      if (!userAssignedBranchName) return false;
      const cleanUserBr = userAssignedBranchName.toLowerCase();
      return (
        b.id.toLowerCase() === cleanUserBr ||
        b.name.toLowerCase() === cleanUserBr ||
        b.name.toLowerCase().includes(cleanUserBr) ||
        cleanUserBr.includes(b.name.toLowerCase()) ||
        (b.code && b.code.toLowerCase() === cleanUserBr) ||
        (b.city && b.city.toLowerCase() === cleanUserBr)
      );
    });

    return matchedUserBranch || (userAssignedBranchName ? {
      id: "assigned-branch",
      name: userAssignedBranchName,
      city: "Campus",
      code: "ASSIGNED",
      latitude: 9.4291,
      longitude: 77.8231,
      address: userAssignedBranchName,
      radiusMeters: 500,
    } : (branches.length > 0 ? branches[0] : null));
  }, [branches, userAssignedBranchName]);

  const displayBranchName = useMemo(() => {
    return activeBranch?.name || userAssignedBranchName || "WeGrow Skill Campus – Sivakasi Branch 1.0";
  }, [activeBranch, userAssignedBranchName]);

  useEffect(() => {
    organizationService.getBranches().then((res) => {
      const data = res?.data || res;
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((b: any, i: number) => ({
          ...b,
          id: b.id || b._id || `branch-${i + 1}`,
          name: b.name || `Branch ${i + 1}`,
          city: b.city || "Campus",
          code: b.code || `BR-${i + 1}`,
        }));
        setBranches(formatted);
      }
    }).catch(() => {});
  }, []);

  // Monthly Policy Metrics
  const [monthlyLateCount, setMonthlyLateCount] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkInTimestampRef = useRef<number | null>(null);

  // Helper to calculate distance between two coordinates in meters (Haversine Formula)
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find user geolocation anchored to employee's assigned branch
  const detectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: activeBranch
            ? `${activeBranch.name} • ${activeBranch.city} (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`
            : `${displayBranchName} (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`,
          nearestBranch: activeBranch,
        });
        setIsLocating(false);
      },
      () => {
        setUserLocation({
          latitude: activeBranch?.latitude || 9.4291,
          longitude: activeBranch?.longitude || 77.8231,
          accuracy: 10,
          address: activeBranch ? `${activeBranch.name} (${activeBranch.city})` : displayBranchName,
          nearestBranch: activeBranch,
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [activeBranch, displayBranchName]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format UTC ISO date / timestamp into IST (Asia/Kolkata)
  const formatTimeOnly = (isoOrTimeString?: string | number | null) => {
    if (!isoOrTimeString) return "--:--";
    try {
      if (typeof isoOrTimeString === "number") {
        const d = new Date(isoOrTimeString);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          });
        }
      }

      const str = String(isoOrTimeString).trim();

      // If already a simple time string like "09:41 AM" (without ISO/Date components)
      if (
        !str.includes("T") &&
        !str.includes("Z") &&
        !str.includes("-") &&
        (str.includes("AM") || str.includes("PM"))
      ) {
        return str;
      }

      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
      }
      return str;
    } catch {
      return String(isoOrTimeString);
    }
  };

  // Sync with API & localStorage
  const syncTodayStatus = useCallback(async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const userKey = (user as any)?._id || user?.id || user?.employeeId || user?.email || "current_user";

    // 1. Initial immediate restore from user-scoped local storage
    if (typeof window !== "undefined") {
      const storedDate = localStorage.getItem(`wg_punch_date_${userKey}`) || localStorage.getItem("wg_punch_date");
      const storedInTime = localStorage.getItem(`wg_checkin_time_${userKey}`) || localStorage.getItem("wg_checkin_time");
      const storedTimestamp = localStorage.getItem(`wg_checkin_timestamp_${userKey}`) || localStorage.getItem("wg_checkin_timestamp");
      const storedOutTime = localStorage.getItem(`wg_checkout_time_${userKey}`) || localStorage.getItem("wg_checkout_time");

      if (storedDate === todayStr) {
        const inMs = storedTimestamp ? Number(storedTimestamp) : storedInTime ? new Date(storedInTime).getTime() : 0;
        const outMs = storedOutTime && storedOutTime !== "--:--" && storedOutTime !== "-" ? new Date(storedOutTime).getTime() : 0;

        if (storedInTime && (!storedOutTime || storedOutTime === "--:--" || storedOutTime === "-" || (!isNaN(inMs) && !isNaN(outMs) && inMs > outMs))) {
          setIsCheckedIn(true);
          setCheckInTime(storedInTime);
          setCheckOutTime(null);
          if (!isNaN(inMs) && inMs > 0) {
            checkInTimestampRef.current = inMs;
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - inMs) / 1000)));
          }
        } else if (storedOutTime && storedOutTime !== "--:--" && storedOutTime !== "-") {
          setIsCheckedIn(false);
          setCheckInTime(storedInTime || null);
          setCheckOutTime(storedOutTime);
          checkInTimestampRef.current = null;
        }
      }
    }

    // 2. Fetch authoritative status from backend
    try {
      const response = await attendanceService.getTodayStatus();
      const data = response?.data || response;
      if (data) {
        const checked =
          data.checkedIn === true ||
          data.isCheckedIn === true ||
          data.status === "PRESENT" ||
          data.status === "LATE";

        // Prioritize ISO UTC timestamp from rawCheckInTime or record so IST conversion is exact (09:41 AM)
        const rawInCandidate =
          data.rawCheckInTime ||
          data.record?.checkInTime ||
          (typeof data.startedAt === "number"
            ? new Date(data.startedAt).toISOString()
            : null) ||
          data.checkInTime;

        const rawOutCandidate =
          data.rawCheckOutTime ||
          data.record?.checkOutTime ||
          data.checkOutTime;

        const rawIn =
          rawInCandidate &&
          rawInCandidate !== "--:--" &&
          rawInCandidate !== "-" &&
          rawInCandidate !== "null" &&
          rawInCandidate !== "undefined"
            ? rawInCandidate
            : null;

        const rawOut =
          rawOutCandidate &&
          rawOutCandidate !== "--:--" &&
          rawOutCandidate !== "-" &&
          rawOutCandidate !== "null" &&
          rawOutCandidate !== "undefined"
            ? rawOutCandidate
            : null;

        let startMs: number | null = null;
        if (typeof data.startedAt === "number" && data.startedAt > 0) {
          startMs = data.startedAt;
        } else if (rawIn) {
          const parsed = new Date(rawIn).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            startMs = parsed;
          }
        }

        let outMs: number | null = null;
        if (rawOut) {
          const parsed = new Date(rawOut).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            outMs = parsed;
          }
        }

        // If checkIn happened after checkout (e.g. checked in again), checkout is obsolete
        const isCheckoutValid = !!rawOut && (!startMs || !outMs || outMs >= startMs);
        const hasActiveCheckIn = (checked || !!rawIn) && !isCheckoutValid;

        if (hasActiveCheckIn) {
          setIsCheckedIn(true);
          setCheckInTime(rawIn);
          setCheckOutTime(null);
          if (startMs) {
            checkInTimestampRef.current = startMs;
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
            if (typeof window !== "undefined") {
              localStorage.setItem(`wg_punch_date_${userKey}`, todayStr);
              localStorage.setItem(`wg_checkin_time_${userKey}`, rawIn || new Date(startMs).toISOString());
              localStorage.setItem(`wg_checkin_timestamp_${userKey}`, String(startMs));
              localStorage.removeItem(`wg_checkout_time_${userKey}`);
              localStorage.removeItem("wg_checkout_time");
            }
          }
        } else if (isCheckoutValid || (!checked && rawIn)) {
          setIsCheckedIn(false);
          setCheckInTime(rawIn || null);
          setCheckOutTime(rawOut || null);
          checkInTimestampRef.current = null;
          if (typeof window !== "undefined") {
            localStorage.setItem(`wg_punch_date_${userKey}`, todayStr);
            if (rawIn) localStorage.setItem(`wg_checkin_time_${userKey}`, rawIn);
            if (rawOut) localStorage.setItem(`wg_checkout_time_${userKey}`, rawOut);
          }
        } else {
          setIsCheckedIn(false);
          setCheckInTime(null);
          setCheckOutTime(null);
          checkInTimestampRef.current = null;
          setElapsedSeconds(0);
        }

        if (onStatusChange) onStatusChange(data);
      }
    } catch {
      // Offline fallback is handled from localStorage
    }
  }, [onStatusChange, user]);

  useEffect(() => {
    syncTodayStatus();
  }, [syncTodayStatus]);

  // Live continuous seconds timer - accurate elapsed time since morning check-in
  useEffect(() => {
    if (isCheckedIn) {
      const updateTimer = () => {
        const start = checkInTimestampRef.current;
        if (start && start > 0) {
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        } else if (checkInTime) {
          const parsed = new Date(checkInTime).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            checkInTimestampRef.current = parsed;
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - parsed) / 1000)));
          }
        }
      };

      updateTimer();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCheckedIn, checkInTime]);

  const handleCheckIn = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    const now = new Date();
    const nowIso = now.toISOString();
    const nowMs = now.getTime();
    const todayStr = nowIso.split("T")[0];

    // Check 9:40 AM standard & 9:45 AM grace time
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const totalCurrentMinutes = currentHour * 60 + currentMin;
    const graceThresholdMinutes = 9 * 60 + 45; // 09:45 AM

    let isLatePunch = false;
    let lateNotice = "";

    if (totalCurrentMinutes > graceThresholdMinutes) {
      isLatePunch = true;
      const newLateCount = monthlyLateCount + 1;
      setMonthlyLateCount(newLateCount);
      if (newLateCount > 3) {
        lateNotice = ` (4th Late Check-in: Half-Day Salary Deduction Applied)`;
      } else {
        lateNotice = ` (Late Arrival ${newLateCount}/3 Allowed)`;
      }
    }

    try {
      const targetBranchId = activeBranch?.id || "assigned-branch";
      const targetBranchName = activeBranch?.name || userAssignedBranchName || "Main Campus";
      const payload: PunchPayload = {
        workMode,
        latitude: userLocation?.latitude || activeBranch?.latitude,
        longitude: userLocation?.longitude || activeBranch?.longitude,
        accuracy: userLocation?.accuracy || 10,
        branchId: targetBranchId,
        branchName: targetBranchName,
        locationAddress: userLocation?.address || activeBranch?.address || targetBranchName,
        notes: `Checked in at ${targetBranchName} (${workMode.toUpperCase()})${lateNotice}`,
      };

      const res = await attendanceService.checkIn(payload);
      const resData = res?.data || res;

      const rawIn =
        resData?.rawCheckInTime ||
        resData?.record?.checkInTime ||
        (typeof resData?.startedAt === "number"
          ? new Date(resData.startedAt).toISOString()
          : nowIso);
      const startMs =
        typeof resData?.startedAt === "number"
          ? resData.startedAt
          : new Date(rawIn).getTime() || nowMs;

      setIsCheckedIn(true);
      setCheckInTime(rawIn);
      setCheckOutTime(null);
      checkInTimestampRef.current = startMs;
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));

      const userKey = (user as any)?._id || user?.id || user?.employeeId || user?.email || "current_user";
      if (typeof window !== "undefined") {
        localStorage.setItem(`wg_punch_date_${userKey}`, todayStr);
        localStorage.setItem(`wg_checkin_time_${userKey}`, rawIn);
        localStorage.setItem(`wg_checkin_timestamp_${userKey}`, String(startMs));
        localStorage.removeItem(`wg_checkout_time_${userKey}`);
        localStorage.removeItem("wg_checkout_time");
      }

      setStatusMessage(`Checked in successfully at ${targetBranchName}!${lateNotice}`);
      setTimeout(() => setStatusMessage(null), 6000);
      if (onStatusChange) onStatusChange({ isCheckedIn: true, checkInTime: rawIn, rawCheckInTime: rawIn, startedAt: startMs });
    } catch {
      setIsCheckedIn(true);
      setCheckInTime(nowIso);
      setCheckOutTime(null);
      checkInTimestampRef.current = nowMs;
      setElapsedSeconds(0);

      const userKey = (user as any)?._id || user?.id || user?.employeeId || user?.email || "current_user";
      if (typeof window !== "undefined") {
        localStorage.setItem(`wg_punch_date_${userKey}`, todayStr);
        localStorage.setItem(`wg_checkin_time_${userKey}`, nowIso);
        localStorage.setItem(`wg_checkin_timestamp_${userKey}`, String(nowMs));
        localStorage.removeItem(`wg_checkout_time_${userKey}`);
        localStorage.removeItem("wg_checkout_time");
      }
      setStatusMessage(`Checked in (Saved locally)${lateNotice}`);
      setTimeout(() => setStatusMessage(null), 6000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isEarlyCheckOut = currentHour < 19; // 07:00 PM standard

    const confirmMsg = isEarlyCheckOut
      ? "Standard check-out time is 07:00 PM. Are you sure you want to Check Out early?"
      : "Are you sure you want to Check Out for today?";

    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    setStatusMessage(null);
    const nowIso = now.toISOString();
    const todayStr = nowIso.split("T")[0];
    const userKey = (user as any)?._id || user?.id || user?.employeeId || user?.email || "current_user";

    try {
      const targetBranchId = activeBranch?.id || "assigned-branch";
      const targetBranchName = activeBranch?.name || userAssignedBranchName || "Main Campus";
      const payload: PunchPayload = {
        workMode,
        latitude: userLocation?.latitude || activeBranch?.latitude,
        longitude: userLocation?.longitude || activeBranch?.longitude,
        branchId: targetBranchId,
        branchName: targetBranchName,
        notes: `Checked out via web portal at ${targetBranchName}`,
      };

      const res = await attendanceService.checkOut(payload);
      const resData = res?.data || res;
      const rawOut =
        resData?.rawCheckOutTime ||
        resData?.record?.checkOutTime ||
        resData?.checkOutTime ||
        nowIso;

      setIsCheckedIn(false);
      setCheckOutTime(rawOut);
      checkInTimestampRef.current = null;

      if (typeof window !== "undefined") {
        localStorage.setItem(`wg_punch_date_${userKey}`, todayStr);
        localStorage.setItem(`wg_checkout_time_${userKey}`, rawOut);
      }

      setStatusMessage("Checked out successfully. Have a great evening!");
      setTimeout(() => setStatusMessage(null), 5000);
      if (onStatusChange) onStatusChange({ isCheckedIn: false, checkOutTime: rawOut });
    } catch {
      setIsCheckedIn(false);
      setCheckOutTime(nowIso);
      checkInTimestampRef.current = null;

      if (typeof window !== "undefined") {
        localStorage.setItem(`wg_punch_date_${userKey}`, todayStr);
        localStorage.setItem(`wg_checkout_time_${userKey}`, nowIso);
      }
      setStatusMessage("Checked out (Saved locally)");
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── VARIANT: BANNER (Header Navigation Bar) ──
  if (variant === "banner") {
    return (
      <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
        {/* Active Timer Pill */}
        {isCheckedIn ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/15 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  Active Session
                </span>
                <span className="font-mono text-xs font-extrabold text-white tracking-widest">
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/20" />

            <div className="flex flex-col text-[11px] text-slate-200">
              <span className="text-[9px] text-slate-400 uppercase font-semibold">In Time</span>
              <span className="font-bold text-white">{formatTimeOnly(checkInTime)}</span>
            </div>
          </div>
        ) : checkOutTime ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-1.5 backdrop-blur-md border border-white/15 text-xs text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">Shift Ended</span>
              <span className="font-bold text-white">Out: {formatTimeOnly(checkOutTime)}</span>
            </div>
          </div>
        ) : null}

        {/* Action Button */}
        {isCheckedIn ? (
          <button
            onClick={handleCheckOut}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/30 hover:from-[#B91C1C] hover:to-[#991B1B] active:scale-95 transition-all disabled:opacity-60"
            title="Standard Check-out: 07:00 PM"
          >
            {isProcessing ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-3.5 w-3.5 fill-current" />
            )}
            <span>Check Out</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCheckIn}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#EA6118] to-[#D9520A] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/30 hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 group"
              title="Standard Check-in: 09:40 AM (Grace: 09:45 AM)"
            >
              {isProcessing ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current transition-transform group-hover:scale-110" />
              )}
              <span>{checkOutTime ? "Check In Again" : "Check In"}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── VARIANT: CARD (Comprehensive dashboard widget with Location, Policy rules & Permission Tracker) ──
  return (
    <div
      className={`rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:shadow-md space-y-6 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isCheckedIn
                ? "bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/10"
                : "bg-orange-50 text-[#EA6118] ring-4 ring-[#EA6118]/10"
            }`}
          >
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-[#0F172A]">
                Smart Biometric &amp; GPS Attendance
              </h3>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                Shift: 09:40 AM – 07:00 PM
              </span>
            </div>
            <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              <span>
                {isLocating
                  ? "Detecting GPS location..."
                  : userLocation?.address || "Main Campus / HQ • Chennai"}
              </span>
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Checked In
            </span>
          ) : checkOutTime ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Shift Ended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Not Clocked In
            </span>
          )}
        </div>
      </div>

      {/* Main Timer and Action Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            Today&apos;s Active Work Session
          </span>
          <div className="mt-1 font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A]">
            {formatElapsed(elapsedSeconds)}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-[#64748B]">
            <div>
              Standard In: <strong className="text-slate-800">09:40 AM</strong>
            </div>
            <span>•</span>
            <div>
              Grace In: <strong className="text-amber-700">09:45 AM</strong>
            </div>
            <span>•</span>
            <div>
              Check-Out: <strong className="text-slate-800">07:00 PM</strong>
            </div>
          </div>
        </div>

        {/* Action Button & Employee Assigned Branch Indicator */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Employee's Designated Branch (Fixed to user profile / DB) */}
          <div className="w-full sm:w-auto inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="text-sm">📍</span>
            <span className="font-semibold text-slate-800 truncate max-w-[260px] sm:max-w-[320px]" title={displayBranchName}>
              {displayBranchName}
            </span>
          </div>

          {isCheckedIn ? (
            <button
              onClick={handleCheckOut}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-red-800 active:scale-98 transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <RotateCw className="h-5 w-5 animate-spin" />
              ) : (
                <Square className="h-4 w-4 fill-current" />
              )}
              <span>Check Out (07:00 PM)</span>
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#EA6118] to-[#D9520A] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <RotateCw className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              <span>{checkOutTime ? "Check In Again" : "Check In Now (09:40 AM)"}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-2xl bg-orange-50 p-3 text-center text-xs font-bold text-orange-800 border border-orange-200">
          {statusMessage}
        </div>
      )}

      {/* Policy Rules & Compliance Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Metric 1: Late Check-In Meter */}
        <div
          className={`rounded-2xl p-3 border text-xs ${
            monthlyLateCount >= 4
              ? "bg-red-50 border-red-200 text-red-900"
              : monthlyLateCount === 3
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-orange-600" />
              Late Check-ins
            </span>
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold bg-white shadow-xs">
              {monthlyLateCount} / 3 Allowed
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            {monthlyLateCount >= 4 ? (
              <strong className="text-red-700">⚠️ 4th Late: Half-Day salary deduction applied!</strong>
            ) : (
              "Allowed up to 9:45 AM (3 times/month). 4th late triggers Half-Day deduction."
            )}
          </p>
        </div>

        {/* Metric 2: Monthly Permission Allowance */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-slate-50 text-xs text-slate-800">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Monthly Permission
            </span>
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold bg-white shadow-xs">
              Max 2.0h / Month
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            2 hours total allowed per month. Extra permission triggers Half-Day deduction.
          </p>
        </div>

        {/* Metric 3: Casual & Medical Leave Rules */}
        <div className="rounded-2xl p-3 border border-slate-200 bg-slate-50 text-xs text-slate-800">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              Leave Rules
            </span>
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold bg-white shadow-xs">
              1 CL / Month
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Remaining CL is Paid / LOP. Medical Leave requires doctor certificate upload, otherwise LOP.
          </p>
        </div>
      </div>
    </div>
  );
}

