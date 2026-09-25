import apiClient from "@/lib/api-client";

export interface PunchPayload {
  latitude?: number;
  longitude?: number;
  notes?: string;
  workMode?: "office" | "wfh" | "on_duty";
}

export interface AttendanceCorrectionPayload {
  targetDate: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  attachmentUrl?: string;
}

export interface AttendanceCorrectionReviewPayload {
  action: "APPROVE" | "REJECT";
  remarks?: string;
}

export interface HrAttendanceAdjustmentPayload {
  userId: string;
  date: string;
  status: string; // "PRESENT", "ABSENT", "HALF_DAY", etc.
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
}

export interface BiometricSyncPayload {
  deviceId: string;
  logs: Array<{
    employeeId: string;
    timestamp: string;
    punchType: "IN" | "OUT";
  }>;
}

export interface AttendancePoliciesPayload {
  workStartTime: string; // "09:00"
  workEndTime: string;   // "18:00"
  gracePeriodMinutes: number;
  halfDayThresholdMinutes: number;
  fullDayThresholdMinutes: number;
}

export const attendanceService = {
  // 4.1 Punch In
  async checkIn(payload: PunchPayload) {
    const response = await apiClient.post("/attendance/check-in", payload);
    return response.data;
  },

  // 4.2 Punch Out
  async checkOut(payload: PunchPayload) {
    const response = await apiClient.post("/attendance/check-out", payload);
    return response.data;
  },

  // 4.3 Today's Status & Live Timer
  async getTodayStatus() {
    const response = await apiClient.get("/attendance/today");
    return response.data;
  },

  // 4.4 Monthly Attendance Calendar Grid
  async getMyCalendar(month: number, year: number) {
    const response = await apiClient.get(`/attendance/my-calendar?month=${month}&year=${year}`);
    return response.data;
  },

  // 4.5 Submit Attendance Correction
  async submitCorrection(payload: AttendanceCorrectionPayload) {
    const response = await apiClient.post("/attendance/corrections", payload);
    return response.data;
  },

  // 4.6 My Corrections List
  async getMyCorrections() {
    const response = await apiClient.get("/attendance/corrections/my");
    return response.data;
  },

  // 4.7 Manager: Team Attendance Today
  async getTeamAttendanceToday() {
    const response = await apiClient.get("/attendance/manager/team-today");
    return response.data;
  },

  // 4.8 Manager: Team Monthly Report
  async getTeamMonthly(month: number, year: number) {
    const response = await apiClient.get(`/attendance/manager/team-monthly?month=${month}&year=${year}`);
    return response.data;
  },

  // 4.9 Manager / HR: Pending Corrections List
  async getPendingCorrections(status: string = "PENDING") {
    const response = await apiClient.get(`/attendance/manager/corrections?status=${status}`);
    return response.data;
  },

  // 4.10 Manager / HR: Approve or Reject Correction
  async reviewCorrection(id: string, payload: AttendanceCorrectionReviewPayload) {
    const response = await apiClient.patch(`/attendance/manager/corrections/${id}`, payload);
    return response.data;
  },

  // 4.11 HR: Daily Attendance Master Sheet
  async getHrDailySheet(params: { date?: string; page?: number; limit?: number; search?: string }) {
    const response = await apiClient.get("/attendance/hr/daily-sheet", { params });
    return response.data;
  },

  // 4.12 HR: Manual Attendance Adjustment
  async adjustAttendance(payload: HrAttendanceAdjustmentPayload) {
    const response = await apiClient.put("/attendance/hr/adjust", payload);
    return response.data;
  },

  // 4.13 HR / CEO: Export Attendance to CSV
  getExportUrl(month: number, year: number) {
    return `${apiClient.defaults.baseURL}/attendance/hr/export?month=${month}&year=${year}`;
  },

  async exportAttendanceCsv(month: number, year: number) {
    const response = await apiClient.get(`/attendance/hr/export?month=${month}&year=${year}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // 4.14 HR: Biometric Machine Sync Webhook
  async syncBiometric(payload: BiometricSyncPayload) {
    const response = await apiClient.post("/attendance/hr/sync-biometric", payload);
    return response.data;
  },

  // 4.15 HR: Office Shift & Policy Settings
  async getPolicies() {
    const response = await apiClient.get("/attendance/hr/policies");
    return response.data;
  },

  async updatePolicies(payload: AttendancePoliciesPayload) {
    const response = await apiClient.put("/attendance/hr/policies", payload);
    return response.data;
  },

  // 4.16 CEO: Executive Attendance Overview
  async getCeoOverview() {
    const response = await apiClient.get("/attendance/ceo/overview");
    return response.data;
  },

  // 4.17 CEO: Department Breakdown
  async getCeoDepartmentStats() {
    const response = await apiClient.get("/attendance/ceo/department-stats");
    return response.data;
  },
};

export default attendanceService;
