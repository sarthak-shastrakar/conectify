import axios from "axios";
import server from "../environment";

/**
 * Single shared axios instance for all API calls.
 *
 * Uses the central server URL from environment.js to guarantee
 * that API calls and WebRTC/Socket.IO connections hit the exact same server.
 */
const api = axios.create({
  baseURL: `${server}/api/v1/users`,
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
