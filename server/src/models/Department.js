import mongoose from "mongoose";
import { CATEGORIES } from "../config/constants.js";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    // Complaint categories routed to this department by default.
    categories: [{ type: String, enum: CATEGORIES }],
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
