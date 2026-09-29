import { useContext } from "react";
import { ToastContext } from "./ToastContextDef";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      showToast: (msg: string, type: any = "info") => {
        if (typeof window !== "undefined" && (window as any).showToast) {
          (window as any).showToast(msg, type);
        }
      },
      removeToast: () => {},
      success: (msg: string, title?: string) => {
        if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "success", title);
      },
      error: (msg: string, title?: string) => {
        if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "error", title);
      },
      warning: (msg: string, title?: string) => {
        if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "warning", title);
      },
      info: (msg: string, title?: string) => {
        if (typeof window !== "undefined" && (window as any).showToast) (window as any).showToast(msg, "info", title);
      },
    };
  }
  return context;
}

export default useToast;
