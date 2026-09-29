import axios, { type AxiosResponse } from "axios";
import { getMockApiResponse } from "./mock-api-handler";

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

// Auto-inject JWT token from localStorage or serve mock data for mock sessions
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

// Response interceptor for error handling, fallback mock resolution & session management
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token") || localStorage.getItem("wg_token") || "";

        // Provide seamless fallback data if running on mock session or if endpoint is simulated
        const reqUrl = error.config?.url || "";
        const fallback = getMockApiResponse(reqUrl, error.config?.method?.toUpperCase());
        if (fallback !== null && (token.startsWith("mock_jwt_token_") || !reqUrl.includes("/auth/login"))) {
          return {
            data: fallback,
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          } as AxiosResponse;
        }

        // Only clear credentials if real backend user info endpoint fails
        if (!token.startsWith("mock_jwt_token_") && (reqUrl.includes("/users/me") || reqUrl.includes("/auth/me"))) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("wg_user");
          localStorage.removeItem("wg_token");
          localStorage.removeItem("last_visited_path");
          sessionStorage.removeItem("wg_greeting_played");
          sessionStorage.removeItem("justLoggedIn");
          document.cookie = "wg_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

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

// Custom adapter to handle mock sessions directly without generating 401s on remote servers
const defaultAdapter = axios.defaults.adapter;
apiClient.defaults.adapter = async (config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token") || localStorage.getItem("wg_token") || "";
    // If it's a mock token session, serve mock responses directly
    if (token.startsWith("mock_jwt_token_") && config.url && !config.url.includes("/auth/login")) {
      const mockData = getMockApiResponse(config.url, config.method?.toUpperCase(), config.data);
      if (mockData !== null) {
        return {
          data: mockData,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          request: {},
        } as AxiosResponse;
      }
    }
  }

  // Otherwise, use real network transport
  if (typeof defaultAdapter === "function") {
    return defaultAdapter(config);
  } else {
    return axios.getAdapter("fetch")(config);
  }
};

export default apiClient;
