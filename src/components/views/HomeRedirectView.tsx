import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

function HomeRedirectContent() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      if (isAuthenticated) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5F9]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EA6118] border-t-transparent" />
        <p className="text-sm font-semibold text-[#5B6180]">Directing to WeGrow HR Portal...</p>
      </div>
    </div>
  );
}

export function HomeRedirectView() {
  return <HomeRedirectContent />;
}
export default HomeRedirectView;
