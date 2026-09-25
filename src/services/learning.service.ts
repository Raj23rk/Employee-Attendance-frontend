import apiClient from "@/lib/api-client";

export interface UpdateCourseProgressPayload {
  progress: number;
}

export const learningService = {
  // 15.1 Get Enrolled Courses (POSH, Compliance, etc.)
  async getCourses() {
    const response = await apiClient.get("/learning/courses");
    return response.data;
  },

  // 15.2 Update Course Progress Percentage
  async updateProgress(id: string, payload: UpdateCourseProgressPayload) {
    const response = await apiClient.patch(`/learning/courses/${id}/progress`, payload);
    return response.data;
  },
};

export default learningService;
