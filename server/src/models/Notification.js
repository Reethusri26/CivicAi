import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Either a specific account, or every admin when audience is "admin".
    recipient: { type: mongoose.Schema.Types.ObjectId, default: null },
    audience: { type: String, enum: ["citizen", "worker", "admin"], required: true },
    type: {
      type: String,
      enum: [
        "complaint_submitted",
        "complaint_reviewed",
        "complaint_assigned",
        "task_assigned",
        "task_unassigned",
        "work_started",
        "complaint_completed",
        "feedback_requested",
        "feedback_received",
      ],
      required: true,
    },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
    // Prevents duplicate notifications when a request is retried.
    dedupeKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
