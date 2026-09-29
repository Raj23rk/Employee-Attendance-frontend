import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { DEFAULT_BRANCHES, ATTENDANCE_POLICY_CONFIG, type Branch } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";

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
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workMode, setWorkMode] = useState<"office" | "wfh" | "on_duty">("office");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Geolocation & Branch State
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    nearestBranch: Branch | null;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("branch-1");

  // Monthly Policy Metrics
  const [monthlyLateCount, setMonthlyLateCount] = useState<number>(2); // Default mock for demo
  const [permissionHoursUsed, setPermissionHoursUsed] = useState<number>(1.0); // Out of 2.0 max
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    fromTime: "10:00",
    toTime: "11:00",
    durationHours: 1.0,
    reason: "",
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Find user geolocation
  const detectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let matchedBranch: Branch | null = null;
        let minDistance = Infinity;

        DEFAULT_BRANCHES.forEach((b) => {
          const dist = calculateDistanceMeters(latitude, longitude, b.latitude, b.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            matchedBranch = b;
          }
        });

        // Nearest or default
        const activeBranch = matchedBranch || DEFAULT_BRANCHES[0];
        setUserLocation({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: `${activeBranch.name} • ${activeBranch.city} (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`,
          nearestBranch: activeBranch,
        });
        setSelectedBranch(activeBranch.id);
        setIsLocating(false);
      },
      () => {
        // Fallback to default branch when GPS is restricted
        const defaultBranch = DEFAULT_BRANCHES[0];
        setUserLocation({
          latitude: defaultBranch.latitude,
          longitude: defaultBranch.longitude,
          accuracy: 10,
          address: `${defaultBranch.name} (${defaultBranch.city})`,
          nearestBranch: defaultBranch,
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

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

  // Sync with API & localStorage
  const syncTodayStatus = useCallback(async () => {
    const todayStr = new Date().toISOString().split("T")[0];

    if (typeof window !== "undefined") {
      const storedDate = localStorage.getItem("wg_punch_date");
      const storedInTime = localStorage.getItem("wg_checkin_time");
      const storedOutTime = localStorage.getItem("wg_checkout_time");

      if (storedDate === todayStr) {
        if (storedInTime && !storedOutTime) {
          setIsCheckedIn(true);
          setCheckInTime(storedInTime);
          const start = new Date(storedInTime).getTime();
          const now = Date.now();
          setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
        } else if (storedOutTime) {
          setIsCheckedIn(false);
          setCheckInTime(storedInTime);
          setCheckOutTime(storedOutTime);
        }
      }
    }

    try {
      const response = await attendanceService.getTodayStatus();
      const data = response?.data || response;
      if (data) {
        if (data.checkInTime && !data.checkOutTime) {
          setIsCheckedIn(true);
          setCheckInTime(data.checkInTime);
          setCheckOutTime(null);
          const start = new Date(data.checkInTime).getTime();
          if (!isNaN(start)) {
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
          }
        } else if (data.checkOutTime) {
          setIsCheckedIn(false);
          setCheckInTime(data.checkInTime || null);
          setCheckOutTime(data.checkOutTime);
        }
        if (onStatusChange) onStatusChange(data);
      }
    } catch {
      // Offline fallback
    }
  }, [onStatusChange]);

  useEffect(() => {
    syncTodayStatus();
  }, [syncTodayStatus]);

  // Live seconds timer
  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const start = new Date(checkInTime).getTime();
        if (!isNaN(start)) {
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
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
      const activeBranchObj = DEFAULT_BRANCHES.find((b) => b.id === selectedBranch) || DEFAULT_BRANCHES[0];
      const payload: PunchPayload = {
        workMode,
        latitude: userLocation?.latitude || activeBranchObj.latitude,
        longitude: userLocation?.longitude || activeBranchObj.longitude,
        accuracy: userLocation?.accuracy || 10,
        branchId: activeBranchObj.id,
        branchName: activeBranchObj.name,
        locationAddress: userLocation?.address || activeBranchObj.address,
        notes: `Checked in at ${activeBranchObj.name} (${workMode.toUpperCase()})${lateNotice}`,
      };

      await attendanceService.checkIn(payload);

      setIsCheckedIn(true);
      setCheckInTime(nowIso);
      setCheckOutTime(null);
      setElapsedSeconds(0);

      if (typeof window !== "undefined") {
        localStorage.setItem("wg_punch_date", todayStr);
        localStorage.setItem("wg_checkin_time", nowIso);
        localStorage.removeItem("wg_checkout_time");
      }

      setStatusMessage(`Checked in successfully at ${activeBranchObj.name}!${lateNotice}`);
      setTimeout(() => setStatusMessage(null), 6000);
      if (onStatusChange) onStatusChange({ isCheckedIn: true, checkInTime: nowIso });
    } catch {
      setIsCheckedIn(true);
      setCheckInTime(nowIso);
      setCheckOutTime(null);
      setElapsedSeconds(0);

      if (typeof window !== "undefined") {
        localStorage.setItem("wg_punch_date", todayStr);
        localStorage.setItem("wg_checkin_time", nowIso);
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

    try {
      const activeBranchObj = DEFAULT_BRANCHES.find((b) => b.id === selectedBranch) || DEFAULT_BRANCHES[0];
      const payload: PunchPayload = {
        workMode,
        latitude: userLocation?.latitude || activeBranchObj.latitude,
        longitude: userLocation?.longitude || activeBranchObj.longitude,
        branchId: activeBranchObj.id,
        branchName: activeBranchObj.name,
        notes: `Checked out via web portal at ${activeBranchObj.name}`,
      };

      await attendanceService.checkOut(payload);

      setIsCheckedIn(false);
      setCheckOutTime(nowIso);

      if (typeof window !== "undefined") {
        localStorage.setItem("wg_punch_date", todayStr);
        localStorage.setItem("wg_checkout_time", nowIso);
      }

      setStatusMessage("Checked out successfully. Have a great evening!");
      setTimeout(() => setStatusMessage(null), 5000);
      if (onStatusChange) onStatusChange({ isCheckedIn: false, checkOutTime: nowIso });
    } catch {
      setIsCheckedIn(false);
      setCheckOutTime(nowIso);

      if (typeof window !== "undefined") {
        localStorage.setItem("wg_punch_date", todayStr);
        localStorage.setItem("wg_checkout_time", nowIso);
      }
      setStatusMessage("Checked out (Saved locally)");
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotalPermission = permissionHoursUsed + permissionForm.durationHours;
    try {
      await attendanceService.submitPermissionRequest(permissionForm);
      setPermissionHoursUsed(newTotalPermission);
      if (newTotalPermission > 2.0) {
        toast.warning(
          `Permission submitted! Warning: Total permission used this month (${newTotalPermission.toFixed(
            1
          )}h) exceeds 2 hours. Half-day salary deduction will be applied according to policy.`
        );
      } else {
        toast.success("Permission application approved and logged.");
      }
      setShowPermissionModal(false);
    } catch {
      setPermissionHoursUsed(newTotalPermission);
      setShowPermissionModal(false);
      toast.info("Permission logged locally.");
    }
  };

  const formatTimeOnly = (isoString?: string | null) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return isoString;
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

        {/* Status Indicator & Permissions Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPermissionModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Permission Tracker ({permissionHoursUsed}h / 2h)</span>
          </button>

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

        {/* Action Button & Branch Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Branch Selector */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 focus:border-[#EA6118] focus:outline-none"
            >
              {DEFAULT_BRANCHES.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  📍 {branch.name} ({branch.city})
                </option>
              ))}
            </select>
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
        <div
          className={`rounded-2xl p-3 border text-xs ${
            permissionHoursUsed > 2.0
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Monthly Permission
            </span>
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold bg-white shadow-xs">
              {permissionHoursUsed.toFixed(1)}h / 2.0h Max
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            {permissionHoursUsed > 2.0 ? (
              <strong className="text-red-700">⚠️ Exceeded 2h: Half-Day salary deduction applied!</strong>
            ) : (
              "2 hours total allowed per month. Extra permission triggers Half-Day deduction."
            )}
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

      {/* Permission Request Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-[#12173A]">
                  Request Work Permission
                </h3>
                <p className="text-[11px] text-slate-500">
                  Monthly quota: 2.0 hours. You have used {permissionHoursUsed}h so far.
                </p>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyPermission} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={permissionForm.date}
                  onChange={(e) => setPermissionForm({ ...permissionForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">From Time</label>
                  <input
                    type="time"
                    required
                    value={permissionForm.fromTime}
                    onChange={(e) => setPermissionForm({ ...permissionForm, fromTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">To Time</label>
                  <input
                    type="time"
                    required
                    value={permissionForm.toTime}
                    onChange={(e) => setPermissionForm({ ...permissionForm, toTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Duration (Hours)</label>
                <select
                  value={permissionForm.durationHours}
                  onChange={(e) =>
                    setPermissionForm({ ...permissionForm, durationHours: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                >
                  <option value={0.5}>0.5 Hour (30 mins)</option>
                  <option value={1.0}>1.0 Hour (60 mins)</option>
                  <option value={1.5}>1.5 Hours (90 mins)</option>
                  <option value={2.0}>2.0 Hours (120 mins - Full Monthly Allowance)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="State reason for permission during shift hours..."
                  value={permissionForm.reason}
                  onChange={(e) => setPermissionForm({ ...permissionForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPermissionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#EA6118] px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 shadow-sm"
                >
                  Submit Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

