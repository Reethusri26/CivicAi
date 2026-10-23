import mongoose from "mongoose";
import { CATEGORIES, PRIORITIES, STATUSES } from "../config/constants.js";

const fileRefSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: String,
    contentType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: String,
    event: String,
    message: String,
    actorRole: String,
    actorName: String,
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 1000 },
  authorRole: { type: String, enum: ["worker", "admin"] },
  authorName: String,
  visibleToCitizen: { type: Boolean, default: true },
  date: { type: Date, default: Date.now },
});

const aiSchema = new mongoose.Schema(
  {
    // "gemini" = model output that passed schema validation.
    // "rules"  = keyword fallback used when Gemini is unavailable.
    source: { type: String, enum: ["gemini", "rules"] },
    category: { type: String, enum: CATEGORIES },
    priority: { type: String, enum: PRIORITIES },
    department: String,
    explanation: String,
    // The model's self-reported confidence (0-1). Not a calibrated accuracy figure.
    confidence: { type: Number, min: 0, max: 1, default: null },
    model: String,
    usedImage: { type: Boolean, default: false },
    fallbackReason: String,
    analyzedAt: Date,
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Idempotency key sent by the client so a double-submit creates one complaint.
    clientRequestId: { type: String, default: undefined },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true },
    priority: { type: String, enum: PRIORITIES, default: "Medium" },
    department: { type: String, default: "" },
    status: { type: String, enum: STATUSES, default: "Pending" },

    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", default: null },
    assignedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    images: [fileRefSchema],
    completionImages: [fileRefSchema],
    // Legacy single-image fields from the earlier disk-storage version.
    image: { type: String, default: "" },
    completionImage: { type: String, default: "" },

    latitude: { type: Number, default: null, min: -90, max: 90 },
    longitude: { type: Number, default: null, min: -180, max: 180 },
    address: { type: String, default: "", maxlength: 300 },
    landmark: { type: String, default: "", maxlength: 120 },

    notes: [noteSchema],
    // Legacy single notes field.
    workerNotes: { type: String, default: "" },

    ai: { type: aiSchema, default: null },

    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 1000 },
      submittedAt: Date,
    },

    timeline: [timelineSchema],
  },
  { timestamps: true }
);

complaintSchema.index({ citizen: 1, createdAt: -1 });
complaintSchema.index(
  { citizen: 1, clientRequestId: 1 },
  { unique: true, partialFilterExpression: { clientRequestId: { $type: "string" } } }
);
complaintSchema.index({ assignedWorker: 1, status: 1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });

export default mongoose.model("Complaint", complaintSchema);
