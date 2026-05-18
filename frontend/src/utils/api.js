import axios from "axios";

/**
 * Single shared axios instance for all API calls.
 *
 * baseURL from env variable — never hardcode localhost in source code.
 * Falls back to localhost:8002 only for local development.
 *
 * NOTE on token storage tradeoff:
 * - Access token is stored in React memory (AuthContext state) — safer against XSS.
 * - On page refresh, token is lost — the app uses the session token from localStorage
 *   to re-authenticate silently (see AuthContext → initializeAuth).
 * - localStorage IS vulnerable to XSS. A proper production fix would use
 *   httpOnly cookies for the refresh token, but that requires HTTPS + backend cookie
 *   support. Documented here for awareness.
 */
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || "http://localhost:8002"}/api/v1/users`,
  withCredentials: true,
  timeout: 10000, // 10 second timeout — prevents hanging requests
});

/**
 * Request interceptor — attaches session token from localStorage to every request.
 * The token is sent in the request body/params as the backend currently expects.
 * (This can be upgraded to Authorization: Bearer header once backend auth middleware is in place.)
 */
api.interceptors.request.use(
  (config) => {
    // No-op for now — token is passed per-request in body/params
    // as the backend uses session tokens, not JWTs
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles 401 globally.
 * If server returns 401, clear local session and redirect to /auth.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session invalid — clear and let AuthContext handle redirect
      localStorage.removeItem("token");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
