import apiClient from "@/lib/api-client";
import type { User, BankDetails } from "@/lib/constants";

export interface UpdatePersonalProfilePayload {
  phone?: string;
  personalEmail?: string;
  address?: string;
  dateOfJoining?: string;
  branch?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankDetails?: BankDetails;
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
  branch?: string;
  bankDetails?: BankDetails;
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

  // 3.2.1 Upload Profile Picture / Avatar (POST /users/me/avatar)
  async uploadAvatar(fileOrFormDataOrPayload: File | FormData | { avatarUrl: string }) {
    if (fileOrFormDataOrPayload instanceof FormData) {
      const response = await apiClient.post("/users/me/avatar", fileOrFormDataOrPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } else if (fileOrFormDataOrPayload instanceof File) {
      const formData = new FormData();
      formData.append("avatar", fileOrFormDataOrPayload);
      const response = await apiClient.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } else {
      const response = await apiClient.post("/users/me/avatar", fileOrFormDataOrPayload);
      return response.data;
    }
  },

  // 3.3 Change Password (Self-service: oldPassword + newPassword)
  async changePassword(oldPassword: string, newPassword: string) {
    const response = await apiClient.put("/users/me/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // 3.3.1 Update User Password (Admin / HR / Manager / MD / GM direct reset)
  async updateUserPassword(payload: { email?: string; employeeId?: string; userId?: string; password: string }) {
    const response = await apiClient.post("/users/update-password", payload);
    return response.data;
  },

  // 3.3.2 Update User Password by User ID (PUT /users/:id/password)
  async updatePasswordById(id: string, password: string) {
    const response = await apiClient.put(`/users/${id}/password`, { password });
    return response.data;
  },

  // 3.3.3 Get Staff List for Dropdowns, Task Assignments & Institutional Roster
  async getStaffList() {
    const response = await apiClient.get<{ success?: boolean; count?: number; data: any[] }>("/users/staff-list");
    return response.data;
  },

  // 3.4 List All Employees with branch & search filter (Admin, HR, CEO)
  async getAllUsers(params?: { search?: string; department?: string; branch?: string; page?: number; limit?: number }) {
    const response = await apiClient.get("/users", { params });
    return response.data;
  },

  // 3.5 Get Single Employee Full Dossier
  async getUserById(id: string) {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // 3.6 Onboard Employee (Admin, HR, Manager, CEO)
  async onboardEmployee(payload: OnboardEmployeePayload) {
    const response = await apiClient.post("/users", payload);
    return response.data;
  },

  // 3.7 Update Specific Employee Details (HR / Admin)
  async updateEmployee(id: string, payload: Partial<OnboardEmployeePayload & { isActive: boolean }>) {
    const response = await apiClient.put(`/users/${id}`, payload);
    return response.data;
  },

  // 3.8 Delete / Remove Employee (HR / Admin)
  async deleteEmployee(id: string) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export default usersService;

