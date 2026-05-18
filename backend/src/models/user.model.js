import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    password: {
      type: String,
      default: null,
      // Optional now for Google OAuth
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    email: {
      type: String,
      default: null,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // Token stored as a random hex for session identification (legacy approach).
    // This is NOT a JWT — it's a random session token stored in DB.
    token: { type: String },
  },
  { timestamps: true }
);

// ─── Strip password from ALL JSON responses — defence-in-depth ───────────────
// Even if a controller forgets to .select("-password"), this ensures it's never
// included in any response serialized via res.json().
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export { User };