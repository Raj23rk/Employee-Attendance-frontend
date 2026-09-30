import { useContext } from "react";
import { ToastContext } from "./ToastContextDef";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    const fallbackSuccess = (msg: string, title?: string) => {
      if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "success", title);
    };
    const fallbackError = (msg: string, title?: string) => {
      if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "error", title);
    };
    const fallbackWarning = (msg: string, title?: string) => {
      if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "warning", title);
    };
    const fallbackInfo = (msg: string, title?: string) => {
      if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "info", title);
    };
    const fallbackShow = (msg: string, type: any = "info", title?: string, duration?: number) => {
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast(msg, type, title, duration);
      }
    };

    return {
      toasts: [],
      toast: {
        success: fallbackSuccess,
        error: fallbackError,
        warning: fallbackWarning,
        info: fallbackInfo,
        show: fallbackShow,
      },
      showToast: fallbackShow,
      removeToast: () => {},
      success: fallbackSuccess,
      error: fallbackError,
      warning: fallbackWarning,
      info: fallbackInfo,
    };
  }
  return context;
}

export default useToast;
