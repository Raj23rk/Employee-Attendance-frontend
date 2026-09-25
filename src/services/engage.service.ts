import apiClient from "@/lib/api-client";

export interface CreateAnnouncementPayload {
  title: string;
  category?: string;
  body: string;
}

export interface TravelRequestPayload {
  purpose: string;
  destination: string;
  fromDate: string; // "2026-10-15"
  toDate: string;   // "2026-10-18"
  estimatedCost: number;
}

export const engageService = {
  // 12.1 List Announcements
  async getAnnouncements() {
    const response = await apiClient.get("/announcements");
    return response.data;
  },

  // 12.2 Create Announcement (HR / CEO)
  async createAnnouncement(payload: CreateAnnouncementPayload) {
    const response = await apiClient.post("/announcements", payload);
    return response.data;
  },

  // 12.3 Like / Unlike Announcement
  async toggleLikeAnnouncement(id: string) {
    const response = await apiClient.post(`/announcements/${id}/like`);
    return response.data;
  },

  // 12.4 List Events & Campus Drives
  async getEvents() {
    const response = await apiClient.get("/events");
    return response.data;
  },

  // 12.5 RSVP Event / Volunteer
  async toggleRsvp(id: string) {
    const response = await apiClient.post(`/events/${id}/rsvp`);
    return response.data;
  },

  // 12.6 Create Travel Booking Request
  async submitTravelRequest(payload: TravelRequestPayload) {
    const response = await apiClient.post("/events/travel-request", payload);
    return response.data;
  },
};

export default engageService;
