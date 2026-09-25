import React from "react";
import { cn } from "@/lib/helpers";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  hoverable = false,
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  const pads: Record<string, string> = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-line",
        pads[padding],
        hoverable && "wg-card-hover cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
