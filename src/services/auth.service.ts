import apiClient from "@/lib/api-client";
import type { User } from "@/lib/constants";

export interface LoginPayload {
  identifier?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  statusCode?: number;
  success?: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User & {
    _id?: string;
    fullName?: string;
    designation?: string;
    gender?: string;
    joiningDate?: string;
  };
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: User & {
      _id?: string;
      fullName?: string;
      designation?: string;
      gender?: string;
      joiningDate?: string;
    };
  };
}

export interface RegisterPayload {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  gender: string;
  department: string;
  designation: string;
  managerId?: string;
  phone?: string;
  dateOfJoining?: string;
}

export const authService = {
  // 1.1 Login (identifier: Email or Employee ID)
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const identifier = payload.identifier || payload.email || "";
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      identifier,
      password: payload.password,
    });
    return response.data;
  },

  // 1.2 Register / Onboard Employee (Admin, HR, Manager, CEO)
  async register(payload: RegisterPayload) {
    const response = await apiClient.post("/auth/register", payload);
    return response.data;
  },

  // 1.3 Logout
  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Safely ignore if token was already invalid or expired on backend
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("wg_user");
        localStorage.removeItem("wg_token");
      }
    }
  },

  // 1.4 Refresh Token
  async refreshToken(refreshToken: string) {
    const response = await apiClient.post("/auth/refresh-token", { refreshToken });
    return response.data;
  },

  // 1.5 Forgot Password
  async forgotPassword(email: string) {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  // 1.6 Reset Password
  async resetPassword(token: string, newPassword: string) {
    const response = await apiClient.post("/auth/reset-password", { token, newPassword });
    return response.data;
  },
};

export default authService;
