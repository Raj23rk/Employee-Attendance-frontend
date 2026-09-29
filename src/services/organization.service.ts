import apiClient from "@/lib/api-client";

export const organizationService = {
  // 11.1 Search Employee Directory
  async getDirectory(params?: { search?: string; dept?: string; department?: string; campus?: string }) {
    const response = await apiClient.get("/directory", { params });
    return response.data;
  },

  // 11.2 Org Hierarchical Tree
  async getOrgTree() {
    const response = await apiClient.get("/organization/tree");
    return response.data;
  },

  // 11.3 List Departments & Leads
  async getDepartments() {
    const response = await apiClient.get("/organization/departments");
    return response.data;
  },

  // 11.4 Branches Management (Chennai, Bangalore, Hyderabad & Dynamic Branches)
  async getBranches() {
    const response = await apiClient.get("/branches");
    return response.data;
  },

  async createBranch(payload: {
    name: string;
    code: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  }) {
    const response = await apiClient.post("/branches", payload);
    return response.data;
  },
};

export default organizationService;
