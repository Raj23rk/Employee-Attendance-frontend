import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Synchronous token verification from localStorage
  const hasToken =
    typeof window !== "undefined" &&
    !!(localStorage.getItem("access_token") || localStorage.getItem("wg_token"));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access_token") || localStorage.getItem("wg_token");
    if (!token || (!isLoading && !isAuthenticated)) {
      window.location.replace("/login");
    }
  }, [isLoading, isAuthenticated]);

  // Block rendering protected children if token is absent or verifying initial session
  if (!hasToken || (!user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EA6118] border-t-transparent" />
          <p className="text-sm font-semibold text-[#5B6180]">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F4F5F9]">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Role-Aware Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          isMobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <div
          className={`flex flex-col min-h-screen transition-all duration-300 ${
            collapsed ? "lg:pl-20" : "lg:pl-64"
          }`}
        >
          <TopBar onOpenMobileMenu={() => setMobileOpen(true)} collapsed={collapsed} />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}


