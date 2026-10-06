import apiClient from "@/lib/api-client";

export interface CreateTicketPayload {
  title: string;
  category: "IT" | "HR" | "PAYROLL" | "ADMIN" | string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  assignedTo?: string;
  assigneeId?: string;
  sendNotification?: boolean;
}

export interface ReplyTicketPayload {
  message: string;
  attachmentUrl?: string;
}

export interface UpdateTicketStatusPayload {
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
}

export const helpdeskService = {
  // 13.1 Raise Support Ticket
  async createTicket(payload: CreateTicketPayload) {
    const response = await apiClient.post("/helpdesk/tickets", payload);
    return response.data;
  },

  // 13.2 My Raised Tickets
  async getMyTickets() {
    const response = await apiClient.get("/helpdesk/tickets/my");
    return response.data;
  },

  // 13.3 Ticket Details & Thread
  async getTicketById(id: string) {
    const response = await apiClient.get(`/helpdesk/tickets/${id}`);
    return response.data;
  },

  // 13.4 Reply in Ticket Thread
  async replyTicket(id: string, payload: ReplyTicketPayload) {
    const response = await apiClient.post(`/helpdesk/tickets/${id}/reply`, payload);
    return response.data;
  },

  // 13.5 Update Ticket Status (HR / Manager / CEO)
  async updateTicketStatus(id: string, payload: UpdateTicketStatusPayload) {
    const response = await apiClient.patch(`/helpdesk/tickets/${id}/status`, payload);
    return response.data;
  },
};

export default helpdeskService;
