import apiClient from "@/lib/api-client";

export interface CreateTemplatePayload {
  code: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface UpdateTemplatePayload {
  subject: string;
  body: string;
}

export const notificationsService = {
  // 2.1 Get My Notifications & Unread Count
  async getNotifications() {
    const response = await apiClient.get("/notifications");
    return response.data;
  },

  // 2.2 Mark Notification as Read
  async markAsRead(id: string) {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // 2.3 Mark All Notifications as Read
  async markAllAsRead() {
    const response = await apiClient.patch("/notifications/read-all");
    return response.data;
  },

  // 2.4 List Email Notification Templates (HR / CEO)
  async getTemplates() {
    const response = await apiClient.get("/notifications/templates");
    return response.data;
  },

  // 2.5 Create Notification Template (HR)
  async createTemplate(payload: CreateTemplatePayload) {
    const response = await apiClient.post("/notifications/templates", payload);
    return response.data;
  },

  // 2.6 Update Notification Template (HR)
  async updateTemplate(code: string, payload: UpdateTemplatePayload) {
    const response = await apiClient.put(`/notifications/templates/${code}`, payload);
    return response.data;
  },
};

export default notificationsService;
