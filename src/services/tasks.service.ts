import apiClient from "@/lib/api-client";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  project?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskStatusPayload {
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | string;
}

export const tasksService = {
  // 7.1 My Kanban Tasks
  async getMyTasks() {
    const response = await apiClient.get("/tasks/my");
    return response.data;
  },

  // 7.2 Create Task (Manager / HR / CEO)
  async createTask(payload: CreateTaskPayload) {
    const response = await apiClient.post("/tasks", payload);
    return response.data;
  },

  // 7.3 Update Task Status
  async updateTaskStatus(id: string, payload: UpdateTaskStatusPayload) {
    const response = await apiClient.patch(`/tasks/${id}/status`, payload);
    return response.data;
  },
};

export default tasksService;
