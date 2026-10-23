import mongoose from "mongoose";

// Citizen accounts. Admins and workers live in their own collections.
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Google-only accounts get a random, unusable password hash.
    password: { type: String, required: true, select: false },
    googleId: { type: String, default: undefined, index: { unique: true, sparse: true } },
    authProviders: { type: [String], default: ["password"] },
    phone: { type: String, default: "", trim: true },
    role: { type: String, enum: ["citizen"], default: "citizen" },
    profileImage: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
