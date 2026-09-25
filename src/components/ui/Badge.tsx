import React from "react";
import { cn } from "@/lib/helpers";

interface BadgeProps {
  variant?: "success" | "warn" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  const normalizedVariant = variant === "warning" ? "warn" : variant;

  const variants: Record<string, string> = {
    success: "bg-[#E4F5EC] text-[#188A5E]",
    warn: "bg-[#FBF0DA] text-[#B4790A]",
    danger: "bg-[#FBE7E7] text-[#C23B3B]",
    info: "bg-[#E8ECFB] text-[#3454C8]",
    neutral: "bg-[#F3F4FA] text-[#5B6180]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variants[normalizedVariant] || variants.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
