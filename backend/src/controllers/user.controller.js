import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import { body, validationResult } from "express-validator";

// ─── Validation rule chains (used in routes) ─────────────────────────────────
export const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isAlphanumeric().withMessage("Username must be alphanumeric (letters and numbers only)")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be 3–30 characters")
    .toLowerCase(),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8, max: 128 }).withMessage("Password must be 8–128 characters"),
];

export const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ─── Helper: extract validation errors ───────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  // 1. Validate inputs
  if (!validate(req, res)) return;

  const { name, username, email, password } = req.body;

  try {
    // 2. Check duplicate BEFORE hashing (saves bcrypt CPU on known-bad input)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] }).lean();
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(httpStatus.CONFLICT).json({ message: "Email already registered" });
      }
      return res.status(httpStatus.CONFLICT).json({ message: "Username already taken" });
    }

    // 3. Hash with cost factor 12 (OWASP minimum for bcrypt)
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({ name, username, email, password: hashedPassword });
    await newUser.save();

    // toJSON on the model strips password automatically
    res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
  } catch (e) {
    // Delegate to centralized error handler
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  if (!validate(req, res)) return;

  const { email, password } = req.body;

  try {
    // Always select password explicitly here — it's needed for bcrypt.compare
    // but will be stripped before any JSON response via toJSON override
    const user = await User.findOne({ email }).select("+password");

    // ⚠️ GENERIC message for BOTH "user not found" AND "wrong password"
    // Distinct messages allow email enumeration attacks
    const GENERIC_ERROR = "Invalid email or password";

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: GENERIC_ERROR });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: GENERIC_ERROR });
    }

    // Generate a random session token (keeping original token-in-DB approach)
    const token = crypto.randomBytes(32).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({ token });
  } catch (e) {
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// ─── Get User History ─────────────────────────────────────────────────────────
const getUserHistory = async (req, res) => {
  const token = req.query.token;

  try {
    const user = await User.findOne({ token }).lean();
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    // Find all meetings where this user was a participant
    const myMeetings = await Meeting.find({
      "participants.username": user.username
    })
      .sort({ date: -1 })
      .lean();

    res.json(myMeetings);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

// ─── Add to History ───────────────────────────────────────────────────────────
const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  if (!meeting_code) {
    return res.status(400).json({ message: "Meeting code is required" });
  }

  try {
    const user = await User.findOne({ token }).lean();
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    const newMeeting = new Meeting({ user_id: user.username, meetingCode: meeting_code });
    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added to history" });
  } catch (e) {
    res.status(500).json({ message: "Failed to add meeting to history" });
  }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Token required" });
  }

  try {
    // .select("-password") is explicit — toJSON also strips it as defence-in-depth
    const user = await User.findOne({ token }).select("-password -__v");
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }
    return res.status(httpStatus.OK).json(user);
  } catch (e) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ─── Delete from History ──────────────────────────────────────────────────────
const deleteFromHistory = async (req, res) => {
  const { token, meeting_code } = req.query;

  if (!meeting_code) {
    return res.status(400).json({ message: "Meeting code is required" });
  }

  try {
    const user = await User.findOne({ token }).lean();
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    await Meeting.deleteMany({ user_id: user.username, meetingCode: meeting_code });

    res.status(httpStatus.OK).json({ message: "Deleted from history" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete meeting from history" });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Token required" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      // Still respond 200 — logout is idempotent
      return res.status(httpStatus.OK).json({ message: "Logged out" });
    }

    // Invalidate session token in DB — prevents replay attacks
    user.token = null;
    await user.save();

    return res.status(httpStatus.OK).json({ message: "Logged out successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Logout failed" });
  }
};

// ─── Upload Avatar ────────────────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  const { token, avatar } = req.body;

  if (!avatar) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Avatar is required" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    user.avatar = avatar;
    await user.save();

    return res.status(httpStatus.OK).json({ message: "Avatar updated successfully", avatar });
  } catch (e) {
    return res.status(500).json({ message: "Failed to upload avatar" });
  }
};

export { login, register, getUserHistory, addToHistory, getProfile, logout, deleteFromHistory, uploadAvatar };
