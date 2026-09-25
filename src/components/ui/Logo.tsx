import React from "react";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  collapsed?: boolean;
}

export function Logo({ className = "", variant = "dark", collapsed = false }: LogoProps) {
  const isLight = variant === "light";

  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200/60 overflow-hidden">
          <img
            src="/wegrow&Bschool.webp"
            alt="WeGrow"
            width={36}
            height={36}
            className="object-contain max-h-full max-w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {isLight ? (
        <div className="flex items-center rounded-xl bg-white/95 px-3 py-1.5 shadow-sm border border-white/20 transition-all hover:bg-white">
          <img
            src="/wegrow&Bschool.webp"
            alt="WeGrow Skill Campus & B School"
            width={145}
            height={38}
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </div>
      ) : (
        <div className="flex items-center">
          <img
            src="/wegrow&Bschool.webp"
            alt="WeGrow Skill Campus & B School"
            width={145}
            height={38}
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
