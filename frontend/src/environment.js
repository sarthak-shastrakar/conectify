// ─── Backend URL Configuration ─────────────────────────────────────────────
// Auto-detects production (via build or env var) vs local development
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.REACT_APP_IS_PROD === "true";

const configuredBackend =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL;

// When building for production, use configured backend URL or default Render backend
const server = isProduction
  ? (configuredBackend || "https://conectify-backend-8k7d.onrender.com").replace(/\/+$/, "")
  : "http://localhost:8002";

export default server;
