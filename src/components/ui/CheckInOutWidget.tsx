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
} from "lucide-react";
import { attendanceService, type PunchPayload } from "@/services/attendance.service";

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
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workMode, setWorkMode] = useState<"office" | "wfh" | "on_duty">("office");
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Check localStorage fallback first
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
          if (typeof window !== "undefined") {
            localStorage.setItem("wg_punch_date", todayStr);
            localStorage.setItem("wg_checkin_time", data.checkInTime);
            localStorage.removeItem("wg_checkout_time");
          }
        } else if (data.checkOutTime) {
          setIsCheckedIn(false);
          setCheckInTime(data.checkInTime || null);
          setCheckOutTime(data.checkOutTime);
          if (typeof window !== "undefined") {
            localStorage.setItem("wg_punch_date", todayStr);
            localStorage.setItem("wg_checkout_time", data.checkOutTime);
          }
        }
        if (onStatusChange) onStatusChange(data);
      }
    } catch {
      // Backend offline or mock mode - fallback is already preserved
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
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split("T")[0];

    try {
      const payload: PunchPayload = {
        workMode,
        notes: `Checked in via web app (${workMode.toUpperCase()})`,
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

      setStatusMessage("Successfully checked in!");
      setTimeout(() => setStatusMessage(null), 4000);
      if (onStatusChange) onStatusChange({ isCheckedIn: true, checkInTime: nowIso });
    } catch (err: any) {
      // Local fallback in case of network issue
      setIsCheckedIn(true);
      setCheckInTime(nowIso);
      setCheckOutTime(null);
      setElapsedSeconds(0);

      if (typeof window !== "undefined") {
        localStorage.setItem("wg_punch_date", todayStr);
        localStorage.setItem("wg_checkin_time", nowIso);
        localStorage.removeItem("wg_checkout_time");
      }
      setStatusMessage("Checked in (Saved locally)");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!confirm("Are you sure you want to Check Out for today?")) return;

    setIsProcessing(true);
    setStatusMessage(null);
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split("T")[0];

    try {
      const payload: PunchPayload = {
        workMode,
        notes: "Checked out via web app",
      };

      await attendanceService.checkOut(payload);

      setIsCheckedIn(false);
      setCheckOutTime(nowIso);

      if (typeof window !== "undefined") {
        localStorage.setItem("wg_punch_date", todayStr);
        localStorage.setItem("wg_checkout_time", nowIso);
      }

      setStatusMessage("Successfully checked out. Great work today!");
      setTimeout(() => setStatusMessage(null), 5000);
      if (onStatusChange) onStatusChange({ isCheckedIn: false, checkOutTime: nowIso });
    } catch (err: any) {
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

  // ── VARIANT: BANNER (Compact, designed for header bars) ──
  if (variant === "banner") {
    return (
      <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
        {/* Active Timer Pill if Checked In */}
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
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-900/30 hover:from-[#B91C1C] hover:to-[#991B1B] active:scale-95 transition-all disabled:opacity-60"
            title="Click to Check Out"
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
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#EA6118] to-[#D9520A] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/30 hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 group"
              title="Click to Check In"
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

  // ── VARIANT: CARD (Expanded dashboard widget) ──
  return (
    <div
      className={`rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              isCheckedIn
                ? "bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/10"
                : "bg-orange-50 text-[#EA6118] ring-4 ring-[#EA6118]/10"
            }`}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-[#0F172A]">
              Attendance Punch &amp; Work Hours
            </h3>
            <p className="text-xs text-[#64748B]">
              {isCheckedIn
                ? "Session active • Tracking your logged work hours"
                : checkOutTime
                ? "Shift completed for today"
                : "Record your daily punch in / punch out"}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Checked In
            </span>
          ) : checkOutTime ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Checked Out
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Not Clocked In
            </span>
          )}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            Today&apos;s Work Timer
          </span>
          <div className="mt-1 font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A]">
            {formatElapsed(elapsedSeconds)}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-[#64748B]">
            <div>
              Check-In:{" "}
              <span className="font-bold text-[#0F172A]">
                {checkInTime ? formatTimeOnly(checkInTime) : "--:--"}
              </span>
            </div>
            <span>•</span>
            <div>
              Check-Out:{" "}
              <span className="font-bold text-[#0F172A]">
                {checkOutTime ? formatTimeOnly(checkOutTime) : "--:--"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {isCheckedIn ? (
            <button
              onClick={handleCheckOut}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-red-800 active:scale-98 transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <RotateCw className="h-5 w-5 animate-spin" />
              ) : (
                <Square className="h-4 w-4 fill-current" />
              )}
              <span>Check Out Now</span>
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#EA6118] to-[#D9520A] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-orange-600/25 hover:opacity-95 active:scale-98 transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <RotateCw className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              <span>{checkOutTime ? "Check In Again" : "Check In Now"}</span>
            </button>
          )}

          {statusMessage && (
            <p className="text-center text-xs font-semibold text-emerald-600 animate-in fade-in">
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Work Mode Toggle Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <span>Work Mode:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setWorkMode("office")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                workMode === "office"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <MapPin className="h-3 w-3" />
              <span>Office</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("wfh")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                workMode === "wfh"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Laptop className="h-3 w-3" />
              <span>WFH</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("on_duty")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                workMode === "on_duty"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Briefcase className="h-3 w-3" />
              <span>On Duty</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-[#94A3B8]">
          Shift Standard: 09:00 AM – 06:00 PM (8h Required)
        </div>
      </div>
    </div>
  );
}
