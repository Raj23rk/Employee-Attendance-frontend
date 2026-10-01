"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { User, UserRole } from "@/lib/constants";

import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { authStorage } from "@/lib/auth-storage";
import { AuthContext, type AuthContextType } from "./AuthContextDef";

export { AuthContext, type AuthContextType };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await usersService.getMe();
      const userData: any = (response as any)?.data || response;
      if (userData && (userData.id || userData._id || userData.email || userData.name)) {
        const rawRole = (userData.role || "employee").toLowerCase().replace(/[- ]/g, "_");
        const normalizedRole: UserRole = (rawRole === "hr" ? "hr_manager" : rawRole) as UserRole;

        const formattedUser: User = {
          id: userData.id || userData._id || "u-api",
          name: userData.name || userData.fullName || "WeGrow Member",
          email: userData.email || "",
          role: normalizedRole,
          department: userData.department || "General",
          employeeId: userData.employeeId || "WG-EMP",
          designation: userData.designation,
          gender: userData.gender,
          branch: userData.branch || userData.branchName || userData.campus || "",
          phone: userData.phone || "",
          avatar: userData.avatar || userData.avatarUrl || "",
          dateOfJoining: userData.dateOfJoining || "",
        };
        setUser(formattedUser);
        authStorage.updateUser(formattedUser);
      }
    } catch {
      // Keep existing stored user on transient error or offline
    }
  }, []);

  /* Restore and verify session in background */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = authStorage.getToken();
    const stored = authStorage.getUser();

    if (stored) {
      setUser((prev) => prev || stored);
    }

    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Live Backend API Authentication
      const result: any = await authService.login({ identifier: email.trim(), password });

      const token = result?.accessToken || result?.data?.accessToken;
      const apiUser = result?.user || result?.data?.user;
      const refreshToken = result?.refreshToken || result?.data?.refreshToken;

      if (token && apiUser) {
        const rawRole = (apiUser.role || "employee").toLowerCase().replace(/[- ]/g, "_");
        const normalizedRole: UserRole = (rawRole === "hr" ? "hr_manager" : rawRole) as UserRole;

        const formattedUser: User = {
          id: apiUser.id || apiUser._id || "u-api",
          name: apiUser.name || apiUser.fullName || "WeGrow Member",
          email: apiUser.email || cleanEmail,
          role: normalizedRole,
          department: apiUser.department || "General",
          employeeId: apiUser.employeeId || "WG-EMP",
          designation: apiUser.designation,
          gender: apiUser.gender,
          branch: apiUser.branch || apiUser.branchName || apiUser.campus || "",
          phone: apiUser.phone || "",
          avatar: apiUser.avatar || apiUser.avatarUrl || "",
          dateOfJoining: apiUser.dateOfJoining || "",
        };

        authStorage.saveSession({
          token,
          refreshToken,
          user: formattedUser,
          rememberMe,
        });

        setUser(formattedUser);
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setIsLoading(false);
        return { success: false, error: Array.isArray(err.response.data.message) ? err.response.data.message.join(", ") : err.response.data.message };
      }
    }

    setIsLoading(false);
    return { success: false, error: "Invalid credentials. Please check your email/ID and password." };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    } finally {
      setUser(null);
      authStorage.clearSession();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from "./useAuth";
export default AuthProvider;
