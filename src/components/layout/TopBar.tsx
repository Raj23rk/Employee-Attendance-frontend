import React, { useState, useEffect, useCallback } from "react";
import {
  Menu,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  User,
  LogOut,
  Shield,
  Sparkles,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/helpers";
import { notificationsService } from "@/services/notifications.service";

interface TopBarProps {
  onOpenMobileMenu: () => void;
  collapsed: boolean;
}

export function TopBar({ onOpenMobileMenu, collapsed }: TopBarProps) {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Format today's date
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsService.getNotifications();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead && !n.read).length);
      } else if (Array.isArray(data?.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? data.notifications.filter((n: any) => !n.isRead && !n.read).length);
      }
    } catch {
      // Ignored if notifications table is empty
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      await fetchNotifications();
    } catch {
      // Ignored
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E2E4EF] bg-white/95 px-4 lg:px-8 backdrop-blur-md">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border border-[#E2E4EF] text-[#12173A] hover:bg-[#F3F4FA]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8FB0]" />
          <input
            type="text"
            placeholder="Search roster, muster rolls, circulars, payslips..."
            className="w-full rounded-xl border border-[#E2E4EF] bg-[#F4F5F9] py-2.5 pl-10 pr-4 text-xs text-[#12173A] placeholder-[#8A8FB0] focus:border-[#EA6118] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA6118]/20 transition-all"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-[#F4F5F9] px-3 py-2 text-xs font-semibold text-[#5B6180]">
          <Calendar className="h-3.5 w-3.5 text-[#EA6118]" />
          <span>{today}</span>
        </div>

        {/* Live Active Status Indicator with Green Blinking Dot */}
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/90 border border-emerald-200/80 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold tracking-wide">Active</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E4EF] text-[#5B6180] hover:border-[#EA6118]/50 hover:bg-[#F3F4FA] transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EA6118] ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E2E4EF] bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E4EF]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#12173A]">
                  Notifications
                </h4>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#EA6118]/10 px-2 py-0.5 text-[10px] font-bold text-[#EA6118]">
                    {unreadCount} New
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-slate-400 hover:text-orange-600 font-bold"
                    >
                      Read all
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif: any, i) => (
                    <div key={notif._id || notif.id || i} className="rounded-xl bg-[#F4F5F9] p-2.5 space-y-0.5">
                      <p className="font-semibold text-[#12173A]">{notif.title || notif.subject || "System Notification"}</p>
                      <p className="text-[#5B6180] text-[11px]">{notif.message || notif.body}</p>
                      <span className="text-[10px] text-[#8A8FB0] block">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No new notifications.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 rounded-xl border border-[#E2E4EF] p-1.5 hover:bg-[#F3F4FA] transition-colors"
          >
            <Avatar name={user?.name || "User"} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold leading-tight text-[#12173A]">{user?.name}</p>
              <p className="text-[10px] font-medium leading-tight text-[#8A8FB0]">{user?.department}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#8A8FB0] hidden sm:block mr-1" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E2E4EF] bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#E2E4EF]">
                <p className="text-xs font-bold text-[#12173A]">{user?.name}</p>
                <p className="text-[11px] text-[#8A8FB0] truncate">{user?.email}</p>
                <div className="mt-1">
                  <span className="inline-block rounded-md bg-[#EA6118]/10 px-2 py-0.5 text-[10px] font-bold text-[#EA6118]">
                    {user?.role ? ROLE_LABELS[user.role] : "Staff"}
                  </span>
                </div>
              </div>
              <div className="py-1">
                <a
                  href="/profile"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>My Profile</span>
                </a>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#C23B3B] hover:bg-[#FBE7E7] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
