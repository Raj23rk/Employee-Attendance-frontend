import apiClient from "@/lib/api-client";
import type { User } from "@/lib/constants";

export interface UpdatePersonalProfilePayload {
  phone?: string;
  personalEmail?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  avatarUrl?: string;
}

export interface OnboardEmployeePayload {
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

export const usersService = {
  // 3.1 Get Current User Profile
  async getMe() {
    const response = await apiClient.get<{ success?: boolean; data: User }>("/users/me");
    return response.data;
  },

  // 3.2 Update Personal Profile Details
  async updateMe(payload: UpdatePersonalProfilePayload) {
    const response = await apiClient.put("/users/me", payload);
    return response.data;
  },

  // 3.3 Change Password
  async changePassword(oldPassword: string, newPassword: string) {
    const response = await apiClient.put("/users/me/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // 3.4 List All Employees (Admin, HR, CEO)
  async getAllUsers(params?: { search?: string; department?: string; page?: number; limit?: number }) {
    const response = await apiClient.get("/users", { params });
    return response.data;
  },

  // 3.5 Onboard Employee (Admin, HR, Manager, CEO)
  async onboardEmployee(payload: OnboardEmployeePayload) {
    const response = await apiClient.post("/users", payload);
    return response.data;
  },
};

export default usersService;
