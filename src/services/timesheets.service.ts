import apiClient from "@/lib/api-client";

export interface TimesheetEntry {
  project: string;
  taskDescription: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday?: number;
  sunday?: number;
}

export interface SubmitTimesheetPayload {
  weekStartDate: string; // "2026-09-21"
  entries: TimesheetEntry[];
}

export interface ReviewTimesheetPayload {
  action: "APPROVE" | "REJECT";
  remarks?: string;
}

export const timesheetsService = {
  // 8.1 Weekly Timesheet
  async getWeeklyTimesheet(weekStartDate: string) {
    const response = await apiClient.get(`/timesheets/weekly?weekStartDate=${weekStartDate}`);
    return response.data;
  },

  // 8.2 Submit Weekly Timesheet
  async submitTimesheet(payload: SubmitTimesheetPayload) {
    const response = await apiClient.post("/timesheets/submit", payload);
    return response.data;
  },

  // 8.3 Past Timesheet History
  async getHistory() {
    const response = await apiClient.get("/timesheets/history");
    return response.data;
  },

  // 8.4 Manager: Pending Timesheets
  async getPendingTimesheets() {
    const response = await apiClient.get("/timesheets/manager/pending");
    return response.data;
  },

  // 8.5 Manager: Review Timesheet
  async reviewTimesheet(id: string, payload: ReviewTimesheetPayload) {
    const response = await apiClient.patch(`/timesheets/manager/${id}/review`, payload);
    return response.data;
  },
};

export default timesheetsService;
