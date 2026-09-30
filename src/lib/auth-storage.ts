import type { User } from "@/lib/constants";
import { safeJsonParse } from "@/lib/helpers";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  WG_TOKEN: "wg_token",
  REFRESH_TOKEN: "refreshToken",
  USER: "wg_user",
  LAST_VISITED_PATH: "last_visited_path",
  GREETING_PLAYED: "wg_greeting_played",
  JUST_LOGGED_IN: "justLoggedIn",
} as const;

export const authStorage = {
  /**
   * Get current auth token (prefers sessionStorage for fresh active sessions, falls back to localStorage if rememberMe was set)
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.WG_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.WG_TOKEN)
    );
  },

  /**
   * Get current stored user object
   */
  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw =
      sessionStorage.getItem(STORAGE_KEYS.USER) ||
      localStorage.getItem(STORAGE_KEYS.USER);
    return safeJsonParse<User | null>(raw, null);
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    );
  },

  /**
   * Get last visited path
   */
  getLastVisitedPath(): string | null {
    if (typeof window === "undefined") return null;
    return (
      sessionStorage.getItem(STORAGE_KEYS.LAST_VISITED_PATH) ||
      localStorage.getItem(STORAGE_KEYS.LAST_VISITED_PATH)
    );
  },

  /**
   * Save last visited route
   */
  setLastVisitedPath(path: string): void {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.LAST_VISITED_PATH, path);
      // If user had a persistent rememberMe session in localStorage, sync it
      if (localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.WG_TOKEN)) {
        localStorage.setItem(STORAGE_KEYS.LAST_VISITED_PATH, path);
      }
    } catch {}
  },

  /**
   * Save active authentication session.
   * If rememberMe is false, storage is strictly scoped to sessionStorage so closing the browser/laptop terminates the session automatically.
   */
  saveSession({
    token,
    refreshToken,
    user,
    rememberMe = false,
  }: {
    token: string;
    refreshToken?: string;
    user: User;
    rememberMe?: boolean;
  }): void {
    if (typeof window === "undefined") return;

    // Always store in sessionStorage for the active window/tab
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.WG_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (refreshToken) {
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    sessionStorage.removeItem(STORAGE_KEYS.GREETING_PLAYED);

    if (rememberMe) {
      // Store in localStorage for long-lived persistence across laptop/browser restarts
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.WG_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      document.cookie = `wg_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      // Pure session mode: wipe any leftover localStorage tokens so reopening browser/laptop requires new login
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.WG_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.LAST_VISITED_PATH);

      // Session cookie without max-age / expires (automatically removed when browser session ends)
      document.cookie = `wg_token=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
    }
  },

  /**
   * Update cached user data
   */
  updateUser(user: User): void {
    if (typeof window === "undefined") return;
    const str = JSON.stringify(user);
    sessionStorage.setItem(STORAGE_KEYS.USER, str);
    if (localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.WG_TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.USER, str);
    }
  },

  /**
   * Clear all auth session data (both sessionStorage and localStorage) and cookies
   */
  clearSession(): void {
    if (typeof window === "undefined") return;

    // Clear sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.WG_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.LAST_VISITED_PATH);
    sessionStorage.removeItem(STORAGE_KEYS.GREETING_PLAYED);
    sessionStorage.removeItem(STORAGE_KEYS.JUST_LOGGED_IN);

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.WG_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.LAST_VISITED_PATH);

    // Expire cookie immediately
    document.cookie = "wg_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax";
  },
};

export default authStorage;
