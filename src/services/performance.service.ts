import apiClient from "@/lib/api-client";

export const performanceService = {
  // 14.1 Personal Goals / OKRs
  async getGoals() {
    const response = await apiClient.get("/performance/goals");
    return response.data;
  },

  // 14.2 Appraisal & Monthly Check-In Reviews
  async getReviews() {
    const response = await apiClient.get("/performance/reviews");
    return response.data;
  },
};

export default performanceService;
