"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { ToastContext, type ToastContextType, type ToastItem, type ToastType, type ToastMethods } from "./ToastContextDef";

export { ToastContext, type ToastContextType, type ToastItem, type ToastType, type ToastMethods };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => showToast(msg, "success", title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast(msg, "error", title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast(msg, "warning", title), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast(msg, "info", title), [showToast]);

  const toastMethods = useMemo<ToastMethods>(
    () => ({
      success,
      error,
      warning,
      info,
      show: showToast,
    }),
    [success, error, warning, info, showToast]
  );

  // Expose global window helper for easy integration
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).showToast = showToast;
    }
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast: toastMethods,
        showToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      {/* Toast Render Stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          const Icon = isSuccess
            ? CheckCircle2
            : isError
            ? AlertCircle
            : isWarning
            ? AlertTriangle
            : Info;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
                isSuccess
                  ? "bg-slate-900/95 text-white border-emerald-500/40 ring-1 ring-emerald-500/30"
                  : isError
                  ? "bg-red-950/95 text-white border-red-500/40 ring-1 ring-red-500/30"
                  : isWarning
                  ? "bg-amber-950/95 text-white border-amber-500/40 ring-1 ring-amber-500/30"
                  : "bg-slate-900/95 text-white border-blue-500/40 ring-1 ring-blue-500/30"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                  isSuccess
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isError
                    ? "bg-red-500/20 text-red-400"
                    : isWarning
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 text-xs">
                {t.title && <p className="font-bold text-white mb-0.5">{t.title}</p>}
                <p className="text-slate-200 leading-relaxed font-medium">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export { useToast } from "./useToast";
export default ToastProvider;
