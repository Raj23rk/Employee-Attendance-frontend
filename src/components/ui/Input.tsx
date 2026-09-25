"use client";

import React, { useState } from "react";
import { cn } from "@/lib/helpers";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, type, className, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6180]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8FB0]">
            {icon}
          </div>
        )}
        <input
          type={isPassword && showPassword ? "text" : type}
          className={cn(
            "w-full rounded-xl border border-[#E2E4EF] bg-white px-4 py-2.5 text-sm text-[#12173A] placeholder-[#8A8FB0]",
            "focus:outline-none focus:ring-2 focus:ring-[#EA6118]/20 focus:border-[#EA6118]",
            "transition-all duration-150",
            icon ? "pl-10" : "",
            isPassword ? "pr-10" : "",
            error ? "border-[#C23B3B] focus:ring-[#C23B3B]/20" : "",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8FB0] hover:text-[#12173A] transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#C23B3B]">{error}</p>}
    </div>
  );
}
