import apiClient from "@/lib/api-client";

export interface AssetServiceRequestPayload {
  issue: string;
}

export const assetsService = {
  // 17.1 List Assigned Assets
  async getMyAssets() {
    const response = await apiClient.get("/assets/my");
    return response.data;
  },

  // 17.2 Asset Service / Repair Request
  async requestService(id: string, payload: AssetServiceRequestPayload) {
    const response = await apiClient.post(`/assets/${id}/service-request`, payload);
    return response.data;
  },
};

export default assetsService;
