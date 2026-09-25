import apiClient from "@/lib/api-client";

export interface SubmitFeedbackPayload {
  title: string;
  category: "INFRASTRUCTURE" | "WORK_CULTURE" | "MANAGEMENT" | "GRIEVANCE" | "SUGGESTION" | string;
  message: string;
  suggestions?: string;
}

export interface UpdateFeedbackStatusPayload {
  status: "OPEN" | "REVIEWED" | "ACTION_TAKEN" | string;
  ceoNotes?: string;
}

export const feedbackService = {
  // 18.1 Submit Confidential Feedback (All Employees)
  async submitFeedback(payload: SubmitFeedbackPayload) {
    const response = await apiClient.post("/feedback", payload);
    return response.data;
  },

  // 18.2 View My Submitted Feedback
  async getMyFeedback() {
    const response = await apiClient.get("/feedback/my");
    return response.data;
  },

  // 18.3 View All Feedback (Strictly CEO Only)
  async getAllFeedback() {
    const response = await apiClient.get("/feedback");
    return response.data;
  },

  // 18.4 Update Feedback Status & Notes (CEO Only)
  async updateFeedbackStatus(id: string, payload: UpdateFeedbackStatusPayload) {
    const response = await apiClient.patch(`/feedback/${id}`, payload);
    return response.data;
  },
};

export default feedbackService;
