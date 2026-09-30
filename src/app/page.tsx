"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authStorage } from "@/lib/auth-storage";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    const token = authStorage.getToken();
    const storedUser = authStorage.getUser();

    if (token || storedUser || isAuthenticated) {
      const saved = authStorage.getLastVisitedPath();
      const target = saved && saved !== "/login" && saved !== "/" ? saved : "/dashboard";
      router.replace(target);
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5F9]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EA6118] border-t-transparent" />
        <p className="text-sm font-semibold text-[#5B6180]">Directing to WeGrow HR Portal...</p>
      </div>
    </div>
  );
}
