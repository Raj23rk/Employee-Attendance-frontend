"use client";

import React from "react";
import {
  Users,
  CheckCircle,
  Calendar,
  Clock,
  Inbox,
  Wallet,
  FileText,
  UserPlus,
  BarChart3,
  Shield,
  Megaphone,
  ClipboardCheck,
  UserCheck,
  User,
  Receipt,
  type LucideIcon,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/helpers";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  CircleCheck: CheckCircle,
  CalendarDays: Calendar,
  Clock,
  Inbox,
  Wallet,
  FileText,
  UserPlus,
  BarChart3,
  Shield,
  Megaphone,
  ClipboardCheck,
  UserCheck,
  User,
  Receipt,
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string | LucideIcon | any;
  trend?: string;
  color?: "info" | "success" | "warn" | "danger" | "orange" | "green" | "blue" | "purple";
  className?: string;
}

export function StatCard({ label, value, icon, trend, color = "info", className }: StatCardProps) {
  const IconComponent = typeof icon === "function" ? icon : (ICON_MAP[icon] || Users);

  const colorStyles = {
    info: {
      bg: "bg-[#E8ECFB]",
      text: "text-[#3454C8]",
      border: "border-[#D0D9F7]",
    },
    blue: {
      bg: "bg-[#E8ECFB]",
      text: "text-[#3454C8]",
      border: "border-[#D0D9F7]",
    },
    success: {
      bg: "bg-[#E4F5EC]",
      text: "text-[#188A5E]",
      border: "border-[#C1E8D5]",
    },
    green: {
      bg: "bg-[#E4F5EC]",
      text: "text-[#188A5E]",
      border: "border-[#C1E8D5]",
    },
    warn: {
      bg: "bg-[#FBF0DA]",
      text: "text-[#B4790A]",
      border: "border-[#F5DEAB]",
    },
    danger: {
      bg: "bg-[#FBE7E7]",
      text: "text-[#C23B3B]",
      border: "border-[#F5C2C2]",
    },
    orange: {
      bg: "bg-[#FDF0E6]",
      text: "text-[#EA6118]",
      border: "border-[#FCE3CF]",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
    },
  }[color] || {
    bg: "bg-[#E8ECFB]",
    text: "text-[#3454C8]",
    border: "border-[#D0D9F7]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E2E4EF] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6180]">{label}</p>
          <p className="font-heading text-2xl lg:text-3xl font-bold tracking-tight text-[#12173A]">
            {value}
          </p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colorStyles.bg, colorStyles.text)}>
          <IconComponent className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#5B6180]">
          <TrendingUp className={cn("h-3.5 w-3.5", colorStyles.text)} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
