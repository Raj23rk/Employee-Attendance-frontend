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

// Response interceptor for error handling & session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token") || localStorage.getItem("wg_token") || "";
        // If user logged in via mock demo seed, do not kill session on remote 401
        if (token.startsWith("mock_jwt_token_")) {
          return Promise.reject(error);
        }

        // Only clear credentials if user info endpoint fails with 401
        const reqUrl = error.config?.url || "";
        if (reqUrl.includes("/users/me") || reqUrl.includes("/auth/me") || reqUrl.includes("/auth/refresh")) {
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

export default apiClient;
