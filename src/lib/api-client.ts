import axios from "axios";

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.PUBLIC_API_URL || import.meta.env.VITE_API_URL)) ||
  (typeof process !== "undefined" && process.env && (process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL)) ||
  "https://employee-attendance-backend-1t56.onrender.com/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Auto-inject JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token") || localStorage.getItem("wg_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling & token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear invalid auth data
        // If not already on login page, can handle redirection or refresh
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
