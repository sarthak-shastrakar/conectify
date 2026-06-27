import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import axios from "axios";
import { Meeting } from "../models/meeting.model.js";
import { body, validationResult } from "express-validator";
import { sendVerificationEmail } from "../utils/mail.js";
// ─── Validation rule chains (used in routes) ─────────────────────────────────
const registerValidation = [
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
const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").isLength({ min: 8, max: 128 }).withMessage("Password must be 8–128 characters"),
];
const forgotPasswordValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required").normalizeEmail(),
];

const verifyResetCodeValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("code").trim().notEmpty().withMessage("Code is required").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
];

const resetPasswordValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").isLength({ min: 8, max: 128 }).withMessage("Password must be 8–128 characters"),
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

    // Find all meetings where this user was a participant (case-insensitive query)
    const myMeetings = await Meeting.find({
      "participants.username": { $regex: new RegExp(`^${user.username}$`, "i") }
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
    const user = await User.findOne({ token }).select("-password -__v").lean();
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

// ─── Forgot Password ───────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  if (!validate(req, res)) return;

  const { email } = req.body;
  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }
    return res.status(httpStatus.OK).json({ message: "Email verified. Please set your new password." });
  } catch (e) {
    return res.status(500).json({ message: "Failed to process forgot password" });
  }
};

// ─── Verify Reset Code ───────────────────────────────────────────────────────
const verifyResetCode = async (req, res) => {
  if (!validate(req, res)) return;

  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email }).lean();
    if (!user || user.resetPasswordCode !== code) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "Invalid code" });
    }
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "Code expired" });
    }
    return res.status(httpStatus.OK).json({ message: "Code verified" });
  } catch (e) {
    return res.status(500).json({ message: "Failed to verify code" });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  if (!validate(req, res)) return;

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.status(httpStatus.OK).json({ message: "Password reset successful" });
  } catch (e) {
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

const chatWithAI = async (req, res) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "OpenRouter API Key is missing on the server" });
    }

    const messages = [];
    // Only send the last 4 messages to dramatically reduce input token overhead
    const shortHistory = chatHistory && Array.isArray(chatHistory) ? chatHistory.slice(-4) : [];

    shortHistory.forEach(msg => {
      if (!msg.text?.trim()) return;

      const role = msg.sender === 'AI' ? 'assistant' : 'user';

      // Avoid consecutive identical roles (required by strict APIs like Claude, Llama, Gemini)
      if (messages.length > 0 && messages[messages.length - 1].role === role) {
        messages[messages.length - 1].content += "\n" + msg.text;
      } else {
        messages.push({
          role: role,
          content: msg.text
        });
      }
    });

    // Append current query, merging it if the last message is already a user message
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      if (messages[messages.length - 1].content !== message) {
        messages[messages.length - 1].content += "\n" + message;
      }
    } else {
      messages.push({ role: 'user', content: message });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // model: "openai/gpt-oss-120b:free",
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are Conectify Bot. Assist with video calls, general help, or tech issues. Be extremely brief; answer in 1-2 short sentences max. Reject NSFW/harmful."
          },
          ...messages
        ],
        max_tokens: 75 // Strict limit on completion token usage
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Conectify AI"
        }
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenRouter Error:", error.response?.data || error.message);
    return res.status(500).json({ message: "Failed to connect to AI server" });
  }
};

const deleteAccount = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Token required" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    // Delete user's meeting history
    await Meeting.deleteMany({ user_id: user.username });

    // Delete user profile
    await User.deleteOne({ _id: user._id });

    return res.status(httpStatus.OK).json({ message: "Account deleted successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Failed to delete account" });
  }
};

export {
  login,
  register,
  getUserHistory,
  addToHistory,
  getProfile,
  logout,
  deleteAccount,
  deleteFromHistory,
  uploadAvatar,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  chatWithAI,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyResetCodeValidation,
  resetPasswordValidation,
};
