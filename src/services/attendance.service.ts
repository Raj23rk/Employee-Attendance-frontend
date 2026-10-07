import apiClient from "@/lib/api-client";
import { ATTENDANCE_POLICY_CONFIG } from "@/lib/constants";

export interface PunchPayload {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  branchId?: string;
  branchName?: string;
  locationAddress?: string;
  notes?: string;
  workMode?: "office" | "wfh" | "on_duty";
}

export interface PermissionRequestPayload {
  date: string;
  fromTime?: string;
  toTime?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  duration?: number;
  reason: string;
  approvers?: string[];
  assignedRoles?: string[]; // e.g. ["HR", "MD", "GM", "MANAGER"]
  approverRole?: string;
  sendNotification?: boolean;
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
  workStartTime: string; // "09:40"
  gracePeriodTime: string; // "09:45"
  workEndTime: string;   // "19:00"
  maxAllowedLateCount: number; // 3
  maxMonthlyPermissionHours: number; // 2
  casualLeaveMonthlyQuota: number; // 1
}

export const attendanceService = {
  // 4.1 Punch In with Location Coordinates
  async checkIn(payload: PunchPayload) {
    const response = await apiClient.post("/attendance/check-in", payload);
    return response.data;
  },

  // 4.2 Punch Out with Location Coordinates
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

  // 4.5 Permission Requests (2 Hours Monthly Quota)
  async submitPermissionRequest(payload: PermissionRequestPayload) {
    const fromTimeVal = payload.fromTime || payload.startTime || "09:40 AM";
    const toTimeVal = payload.toTime || payload.endTime || "10:40 AM";
    const approversVal = payload.approvers || payload.assignedRoles || ["HR", "MD", "GM", "MANAGER"];

    const body = {
      date: payload.date,
      fromTime: fromTimeVal,
      toTime: toTimeVal,
      startTime: payload.startTime || fromTimeVal,
      endTime: payload.endTime || toTimeVal,
      durationHours: payload.durationHours ?? payload.duration ?? 1.0,
      reason: payload.reason,
      approvers: approversVal,
      sendNotification: payload.sendNotification !== undefined ? payload.sendNotification : true,
    };

    try {
      const response = await apiClient.post("/attendance/permissions", body);
      return response.data;
    } catch {
      const response = await apiClient.post("/attendance/permissions/apply", body);
      return response.data;
    }
  },

  async getMyPermissions(params?: { month?: number; year?: number }) {
    const response = await apiClient.get("/attendance/permissions/my", { params });
    return response.data;
  },

  async getTeamPermissions(params?: { branch?: string; status?: string } | string) {
    const queryParams = typeof params === "string" ? { branch: params } : params;
    const response = await apiClient.get("/attendance/permissions/team", { params: queryParams });
    return response.data;
  },

  async reviewPermission(
    id: string,
    actionOrPayload: "APPROVE" | "REJECT" | { action: "APPROVE" | "REJECT"; remarks?: string; comments?: string },
    comments?: string
  ) {
    const body =
      typeof actionOrPayload === "string"
        ? { action: actionOrPayload, remarks: comments, comments }
        : {
            action: actionOrPayload.action,
            remarks: actionOrPayload.remarks || actionOrPayload.comments,
            comments: actionOrPayload.comments || actionOrPayload.remarks,
          };

    try {
      const response = await apiClient.patch(`/attendance/permissions/${id}/review`, body);
      return response.data;
    } catch {
      const response = await apiClient.patch(`/attendance/permissions/${id}`, body);
      return response.data;
    }
  },

  // 4.6 Submit Attendance Correction
  async submitCorrection(payload: AttendanceCorrectionPayload) {
    const response = await apiClient.post("/attendance/corrections", payload);
    return response.data;
  },

  // 4.7 My Corrections List
  async getMyCorrections() {
    const response = await apiClient.get("/attendance/corrections/my");
    return response.data;
  },

  // 4.8 Manager: Team Attendance Today
  async getTeamAttendanceToday(branchId?: string) {
    const response = await apiClient.get("/attendance/manager/team-today", {
      params: { branchId },
    });
    return response.data;
  },

  // 4.9 Manager: Team Monthly Report
  async getTeamMonthly(month: number, year: number, branchId?: string) {
    const response = await apiClient.get(`/attendance/manager/team-monthly`, {
      params: { month, year, branchId },
    });
    return response.data;
  },

  // 4.10 Manager / HR: Pending Corrections List
  async getPendingCorrections(status: string = "PENDING") {
    const response = await apiClient.get(`/attendance/manager/corrections?status=${status}`);
    return response.data;
  },

  // 4.11 Manager / HR: Approve or Reject Correction
  async reviewCorrection(id: string, payload: AttendanceCorrectionReviewPayload) {
    const response = await apiClient.patch(`/attendance/manager/corrections/${id}`, payload);
    return response.data;
  },

  // 4.12 HR: Daily Attendance Master Sheet
  async getHrDailySheet(params: { date?: string; branch?: string; page?: number; limit?: number; search?: string }) {
    const response = await apiClient.get("/attendance/hr/daily-sheet", { params });
    return response.data;
  },

  // 4.13 HR: Manual Attendance Adjustment
  async adjustAttendance(payload: HrAttendanceAdjustmentPayload) {
    const response = await apiClient.put("/attendance/hr/adjust", payload);
    return response.data;
  },

  // 4.14 HR / CEO: Export Attendance to CSV
  getExportUrl(month: number, year: number, branch?: string) {
    let url = `${apiClient.defaults.baseURL}/attendance/hr/export?month=${month}&year=${year}`;
    if (branch) url += `&branch=${encodeURIComponent(branch)}`;
    return url;
  },

  async exportAttendanceCsv(month: number, year: number, branch?: string) {
    const response = await apiClient.get(`/attendance/hr/export`, {
      params: { month, year, branch },
      responseType: "blob",
    });
    return response.data;
  },

  // 4.15 HR: Biometric Machine Sync Webhook
  async syncBiometric(payload: BiometricSyncPayload) {
    const response = await apiClient.post("/attendance/hr/sync-biometric", payload);
    return response.data;
  },

  // 4.16 HR: Office Shift & Policy Settings (9:40 AM standard, 9:45 AM grace, 7:00 PM out)
  async getPolicies() {
    try {
      const response = await apiClient.get("/attendance/hr/policies");
      return response.data;
    } catch {
      return { data: ATTENDANCE_POLICY_CONFIG };
    }
  },

  async updatePolicies(payload: AttendancePoliciesPayload) {
    const response = await apiClient.put("/attendance/hr/policies", payload);
    return response.data;
  },

  // 4.17 CEO: Executive Attendance Overview
  async getCeoOverview(branch?: string) {
    const response = await apiClient.get("/attendance/ceo/overview", { params: { branch } });
    return response.data;
  },

  // 4.18 CEO: Department Breakdown
  async getCeoDepartmentStats(branch?: string) {
    const response = await apiClient.get("/attendance/ceo/department-stats", { params: { branch } });
    return response.data;
  },

  // 4.19 Daywise Multi-Branch Irregularities Report (Late comers, Half-days, Approved Leaves, Absentees)
  async getDailyBranchIrregularities(date?: string, branch?: string) {
    const response = await apiClient.get("/attendance/reports/daily-branch-irregularities", {
      params: { date, branch },
    });
    return response.data;
  },
};

export default attendanceService;

