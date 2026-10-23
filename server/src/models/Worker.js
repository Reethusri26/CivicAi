import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    // Department name; validated against the Department collection on write.
    department: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    role: { type: String, enum: ["worker"], default: "worker" },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

workerSchema.index({ department: 1 });

export default mongoose.model("Worker", workerSchema);
