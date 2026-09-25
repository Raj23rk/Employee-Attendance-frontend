import apiClient from "@/lib/api-client";

export interface UploadDocumentPayload {
  title: string;
  category: string;
  fileUrl: string;
}

export const documentsService = {
  // 16.1 List Documents
  async getDocuments() {
    const response = await apiClient.get("/documents");
    return response.data;
  },

  // 16.2 Upload Document Metadata
  async uploadDocument(payload: UploadDocumentPayload) {
    const response = await apiClient.post("/documents/upload", payload);
    return response.data;
  },
};

export default documentsService;
