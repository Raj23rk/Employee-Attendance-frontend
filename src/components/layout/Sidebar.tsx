import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  CalendarDays,
  FileBarChart2,
  Megaphone,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CreditCard,
  Target,
  Receipt,
  Shield,
  LifeBuoy,
  Clock,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { type UserRole, ROLE_LABELS, formatRoleLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/helpers";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

// Role-based sidebar menu definition for Admin, CEO, HR Manager, Manager, Employee
const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Employee Details", href: "/employees", icon: Users, badge: "3 Branches" },
    { label: "Attendance & Bio", href: "/attendance", icon: CalendarCheck },
    { label: "Payroll & Salary", href: "/payroll", icon: Wallet },
    { label: "Daily Office Bills", href: "/expenses", icon: Receipt },
    { label: "Leave Requests", href: "/leave", icon: CalendarDays, badge: "6" },
    { label: "Tasks & Sprints", href: "/tasks", icon: Target },
    { label: "Reports & Analytics", href: "/reports", icon: FileBarChart2 },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "System Settings", href: "/settings", icon: Settings },
  ],
  ceo: [
    { label: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Employee Details", href: "/employees", icon: Users, badge: "3 Branches" },
    { label: "Financials & Payroll", href: "/payroll", icon: Wallet },
    { label: "Institutional Analytics", href: "/reports", icon: FileBarChart2, badge: "Q3 Review" },
    { label: "Confidential Feedback", href: "/feedback", icon: Shield, badge: "CEO Only" },
    { label: "Tasks & OKRs", href: "/tasks", icon: Target },
    { label: "Strategic Circulars", href: "/announcements", icon: Megaphone },
    { label: "Governance & Policies", href: "/settings", icon: Settings },
    { label: "Executive Profile", href: "/profile", icon: User },
  ],
  hr_manager: [
    { label: "HR Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Employee Details", href: "/employees", icon: Users, badge: "3 Branches" },
    { label: "Daily Master Sheet", href: "/attendance", icon: CalendarCheck },
    { label: "Leave Approvals", href: "/leave", icon: CalendarDays, badge: "6" },
    { label: "Payroll Muster", href: "/payroll", icon: Wallet },
    { label: "Office Expenses", href: "/expenses", icon: Receipt },
    { label: "Tasks & Sprints", href: "/tasks", icon: Target },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
    { label: "HR Audit Reports", href: "/reports", icon: FileBarChart2 },
    { label: "My Profile", href: "/profile", icon: User },
  ],
  manager: [
    { label: "Team Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Team Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "Leave Requests", href: "/leave", icon: CalendarDays, badge: "2" },
    { label: "Kanban Tasks", href: "/tasks", icon: Target },
    { label: "Claim Reviews", href: "/expenses", icon: Receipt },
    { label: "Timesheets", href: "/timesheets", icon: Clock },
    { label: "Company Notices", href: "/announcements", icon: Megaphone },
    { label: "My Profile", href: "/profile", icon: User },
  ],
  employee: [
    { label: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "Apply Leave", href: "/leave", icon: CalendarDays },
    { label: "My Payslips", href: "/payroll", icon: Wallet },
    { label: "Kanban Tasks", href: "/tasks", icon: Target },
    { label: "Weekly Timesheets", href: "/timesheets", icon: Clock },
    { label: "Reimbursements", href: "/expenses", icon: Receipt },
    { label: "Helpdesk Tickets", href: "/helpdesk", icon: LifeBuoy },
    { label: "Confidential Feedback", href: "/feedback", icon: Shield },
    { label: "Documents & Assets", href: "/documents", icon: FileText },
    { label: "Company Notices", href: "/announcements", icon: Megaphone },
    { label: "My Profile", href: "/profile", icon: User },
  ],
  accountant: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Payroll Processing", href: "/payroll", icon: Wallet, badge: "Pending" },
    { label: "Office Bills & Claims", href: "/expenses", icon: Receipt },
    { label: "Attendance Records", href: "/attendance", icon: CalendarCheck },
    { label: "Financial Reports", href: "/reports", icon: FileBarChart2 },
    { label: "Notices", href: "/announcements", icon: Megaphone },
    { label: "My Profile", href: "/profile", icon: User },
  ],
};

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, isMobileOpen, onCloseMobile }: SidebarProps) {
  const [pathname, setPathname] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname.replace(/\/$/, "") || "/");
    }
  }, []);

  const rawRole = (user?.role || "employee").toLowerCase().replace(/[- ]/g, "_") as UserRole;
  const currentRole: UserRole = ROLE_NAV_ITEMS[rawRole] ? rawRole : "employee";
  const navItems = ROLE_NAV_ITEMS[currentRole] || ROLE_NAV_ITEMS.employee;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0A1B45] text-white transition-all duration-300 ease-in-out border-r border-[#16326F]/60",
        collapsed ? "w-20" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-[#16326F]/60">
        <a href="/dashboard" className="flex items-center">
          <Logo variant="light" collapsed={collapsed} />
        </a>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg bg-[#16326F]/80 text-[#8A8FB0] hover:bg-[#204382] hover:text-white transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role Pill Banner */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-[#16326F]/40 bg-[#101F52]/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8FB0]">
              Portal View
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EA6118]/20 px-2 py-0.5 text-[11px] font-bold text-[#F0834A]">
              <Sparkles className="h-3 w-3" />
              {formatRoleLabel(user?.role)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-[#16326F]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-[#EA6118] to-[#D9520A] text-white shadow-lg shadow-orange-600/30 font-bold"
                  : "text-[#8A8FB0] hover:bg-[#16326F]/60 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-[#8A8FB0] group-hover:text-white"
                )}
              />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide",
                        isActive ? "bg-white/20 text-white" : "bg-[#16326F] text-[#F0834A]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </a>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-[#16326F]/60 bg-[#071333]">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
          <a href="/profile" className="flex items-center gap-2.5 overflow-hidden hover:opacity-90 transition-opacity">
            <Avatar name={user?.name || "User"} size="md" className="ring-2 ring-[#EA6118]/40" />
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-bold text-white">{user?.name}</span>
                <span className="truncate text-[10px] text-[#8A8FB0]">{user?.email}</span>
              </div>
            )}
          </a>
          {!collapsed && (
            <button
              onClick={logout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8A8FB0] hover:bg-[#C23B3B]/20 hover:text-[#C23B3B] transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
