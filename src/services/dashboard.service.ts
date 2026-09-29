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

  // 6.7 HR/CEO Employee Details Dashboard with branch filter, DOJ, checkin, checkout
  async getHrCeoEmployees(params?: { branch?: string; search?: string; page?: number; limit?: number }) {
    const response = await apiClient.get("/dashboard/hr-ceo/employees", { params });
    return response.data;
  },

  // 6.8 HR/CEO Full details popup (Bank account info, user details, checkin, active state)
  async getEmployeePopupDetails(employeeId: string) {
    const response = await apiClient.get(`/dashboard/hr-ceo/employees/${employeeId}/popup`);
    return response.data;
  },

  // 6.9 HR/CEO Download individual employee detailed report URL & method
  getEmployeeReportDownloadUrl(employeeId: string, month?: number, year?: number) {
    let url = `${apiClient.defaults.baseURL}/dashboard/hr-ceo/employees/${employeeId}/export-report`;
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  },

  async exportEmployeeReport(employeeId: string, month?: number, year?: number) {
    const response = await apiClient.get(`/dashboard/hr-ceo/employees/${employeeId}/export-report`, {
      params: { month, year },
      responseType: "blob",
    });
    return response.data;
  },
};

export default dashboardService;
