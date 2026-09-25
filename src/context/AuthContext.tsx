import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, UserRole } from "@/lib/constants";
import { MOCK_USERS } from "@/lib/mock-data";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await usersService.getMe();
      const userData: any = (response as any)?.data || response;
      if (userData && (userData.id || userData._id || userData.email || userData.name)) {
        const formattedUser: User = {
          id: userData.id || userData._id || "u-api",
          name: userData.name || userData.fullName || "WeGrow Member",
          email: userData.email || "",
          role: (userData.role?.toLowerCase() as UserRole) || "employee",
          department: userData.department || "General",
          employeeId: userData.employeeId || "WG-EMP",
          designation: userData.designation,
          gender: userData.gender,
        };
        setUser(formattedUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("wg_user", JSON.stringify(formattedUser));
        }
      }
    } catch {
      // Ignored if offline or unauthorized
    }
  }, []);

  /* Restore session on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("wg_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("wg_user");
      }
    }

    const token = localStorage.getItem("access_token");
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Attempt Real Backend API Authentication
      const result: any = await authService.login({ identifier: email.trim(), password });

      const token = result?.accessToken || result?.data?.accessToken;
      const apiUser = result?.user || result?.data?.user;
      const refreshToken = result?.refreshToken || result?.data?.refreshToken;

      if (token && apiUser) {
        // Normalize user format
        const formattedUser: User = {
          id: apiUser.id || apiUser._id || "u-api",
          name: apiUser.name || apiUser.fullName || "WeGrow Member",
          email: apiUser.email || cleanEmail,
          role: (apiUser.role?.toLowerCase() as UserRole) || "employee",
          department: apiUser.department || "General",
          employeeId: apiUser.employeeId || "WG-EMP",
          designation: apiUser.designation,
          gender: apiUser.gender,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
          localStorage.setItem("wg_token", token);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }
          localStorage.setItem("wg_user", JSON.stringify(formattedUser));
        }
        setUser(formattedUser);
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      // 2. Offline / Mock fallback for demo seed accounts (supports email or employeeId)
      const mockUser = 
        MOCK_USERS[cleanEmail] || 
        Object.values(MOCK_USERS).find(
          (u) => u.employeeId?.toLowerCase() === cleanEmail || u.email?.toLowerCase() === cleanEmail
        );

      if (mockUser && mockUser.password === password) {
        const { password: _, ...userData } = mockUser;
        const mockToken = "mock_jwt_token_" + (typeof window !== "undefined" ? btoa(mockUser.email) : "mock");
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", mockToken);
          localStorage.setItem("wg_token", mockToken);
          localStorage.setItem("wg_user", JSON.stringify(userData));
        }
        setUser(userData);
        setIsLoading(false);
        return { success: true };
      }

      if (err?.response?.data?.message) {
        setIsLoading(false);
        return { success: false, error: err.response.data.message };
      }
    }

    setIsLoading(false);
    return { success: false, error: "Invalid credentials (Try demo password: Password@123)" };
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("wg_token");
      localStorage.removeItem("wg_user");
      window.location.href = "/login";
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
