import { Router } from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import crypto from "crypto";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
  getProfile,
  logout,
  deleteFromHistory,
  uploadAvatar,
  registerValidation,
  loginValidation,
} from "../controllers/user.controller.js";

const router = Router();

// ─── Google OAuth ────────────────────────────────────────────────────────────
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=google_failed`,
    session: true,
  }),
  async (req, res) => {
    try {
      // Create session token consistent with manual auth logic
      const token = crypto.randomBytes(32).toString("hex");
      req.user.token = token;
      await req.user.save();

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&name=${encodeURIComponent(
          req.user.name || ""
        )}`
      );
    } catch (err) {
      res.redirect(`${process.env.FRONTEND_URL}/auth?error=token_failed`);
    }
  }
);

// ─── Auth rate limiter — strict: 10 attempts per 15 min ──────────────────────
// Prevents brute-force on login and bot abuse on register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many attempts. Please try again in 15 minutes.",
  },
  skipSuccessfulRequests: true, // Don't count successful logins toward the limit
});

// ─── Auth routes — rate-limited + validated ───────────────────────────────────
router.route("/login").post(authLimiter, loginValidation, login);
router.route("/register").post(authLimiter, registerValidation, register);

// ─── Protected routes — no auth middleware yet (token-in-body legacy system) ──
// TODO: migrate to Bearer token + protect middleware when frontend is updated
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);
router.route("/delete_from_activity").delete(deleteFromHistory);
router.route("/profile").get(getProfile);
router.route("/logout").post(logout);
router.route("/upload_avatar").post(uploadAvatar);

export default router;
