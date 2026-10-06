import axios from "axios";
import { authStorage } from "./auth-storage";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.PUBLIC_API_URL ||
  "http://localhost:5000/api/v1"
).trim();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Auto-inject JWT token from sessionStorage/localStorage/cookie for authenticated endpoints
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = authStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const reqUrl = error.config?.url || "";
        if (reqUrl.includes("/users/me") || reqUrl.includes("/auth/me")) {
          authStorage.clearSession();

          const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
          if (currentPath !== "/login") {
            window.location.replace("/login");
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
