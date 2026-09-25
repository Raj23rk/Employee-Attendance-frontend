import apiClient from "@/lib/api-client";

export interface SendWishPayload {
  type: "BIRTHDAY" | "ANNIVERSARY" | string;
  message: string;
}

export const dashboardService = {
  // 6.1 Dashboard Overview
  async getOverview() {
    const response = await apiClient.get("/dashboard/overview");
    return response.data;
  },

  // 6.2 Celebrations (Birthdays & Anniversaries)
  async getCelebrations() {
    const response = await apiClient.get("/dashboard/celebrations");
    return response.data;
  },

  // 6.3 Send Wish to Colleague
  async sendWish(targetUserId: string, payload: SendWishPayload) {
    const response = await apiClient.post(`/dashboard/celebrations/${targetUserId}/wish`, payload);
    return response.data;
  },

  // 6.4 Holidays Spotlight
  async getHolidaysSpotlight() {
    const response = await apiClient.get("/dashboard/holidays-spotlight");
    return response.data;
  },

  // 6.5 On Leave Today
  async getOnLeaveToday() {
    const response = await apiClient.get("/dashboard/on-leave-today");
    return response.data;
  },

  // 6.6 Weekly Work Hours Logged Chart
  async getHoursLoggedChart() {
    const response = await apiClient.get("/dashboard/hours-logged-chart");
    return response.data;
  },
};

export default dashboardService;
