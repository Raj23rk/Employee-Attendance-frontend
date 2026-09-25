import apiClient from "@/lib/api-client";

export interface ApplyLeavePayload {
  leaveType: string; // "CASUAL" | "SICK" | "MATERNITY" | "PATERNITY" | "UNPAID"
  fromDate: string;  // "2026-10-01"
  toDate: string;    // "2026-10-02"
  days: number;
  reason: string;
  documentUrl?: string;
}

export interface ReviewLeavePayload {
  action: "APPROVE" | "REJECT";
  comments?: string;
}

export const leavesService = {
  // 5.1 Get Leave Balances
  async getBalances() {
    const response = await apiClient.get("/leaves/balances");
    return response.data;
  },

  // 5.2 Apply for Leave
  async applyLeave(payload: ApplyLeavePayload) {
    const response = await apiClient.post("/leaves/apply", payload);
    return response.data;
  },

  // 5.3 My Leave History
  async getMyHistory() {
    const response = await apiClient.get("/leaves/my-history");
    return response.data;
  },

  // 5.4 Cancel Leave
  async cancelLeave(id: string) {
    const response = await apiClient.patch(`/leaves/${id}/cancel`);
    return response.data;
  },

  // 5.5 Manager: Team Leave Requests
  async getTeamRequests() {
    const response = await apiClient.get("/leaves/manager/team-requests");
    return response.data;
  },

  // 5.6 Manager / HR: Review Leave
  async reviewLeave(id: string, payload: ReviewLeavePayload) {
    const response = await apiClient.patch(`/leaves/manager/${id}/review`, payload);
    return response.data;
  },

  // 5.7 Org Public Leave Calendar
  async getCalendar(month: number, year: number) {
    const response = await apiClient.get(`/leaves/calendar?month=${month}&year=${year}`);
    return response.data;
  },
};

export default leavesService;
