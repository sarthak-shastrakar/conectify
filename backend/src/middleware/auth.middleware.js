import jwt from "jsonwebtoken";

/**
 * Auth Middleware — reads JWT from Authorization: Bearer <token> header ONLY.
 * Query params / body tokens are NEVER trusted (they end up in server logs).
 *
 * On expiry, returns { error: "TOKEN_EXPIRED" } so the frontend can trigger a refresh.
 * On any other failure, returns 401 Unauthorized.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // 1. Header must exist and start with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify — will throw if expired or tampered
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 3. Attach ONLY minimal user info — never expose full DB document on req
    req.user = { _id: decoded._id, username: decoded.username };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Frontend should catch this specific code and call /refresh
      return res.status(401).json({ success: false, error: "TOKEN_EXPIRED", message: "Access token expired" });
    }
    // JsonWebTokenError, NotBeforeError, etc.
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export { protect };
