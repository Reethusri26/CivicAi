import Complaint from "../models/Complaint.js";
import { analyzeComplaint } from "../ai/analyzeComplaint.js";
import { assertValidImages } from "../middleware/upload.js";
import AppError, { notFound } from "../utils/AppError.js";
import { escapeRegex } from "../utils/schemas.js";
import { departmentForCategory } from "../services/departmentService.js";
import { notify } from "../services/notificationService.js";
import { deleteFiles, saveImages } from "../services/storageService.js";
import {
  POPULATE,
  addTimeline,
  generateReference,
  serializeComplaint,
} from "../services/complaintService.js";

const findOwn = async (req) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user.id }).populate(POPULATE);
  if (!complaint) throw notFound("Complaint");
  return complaint;
};

// POST /api/complaints  (multipart: fields + images[])
export const createComplaint = async (req, res) => {
  const files = req.files || [];
  assertValidImages(files);

  const requestId = String(req.get("Idempotency-Key") || "").slice(0, 100) || undefined;
  if (requestId) {
    const existing = await Complaint.findOne({ citizen: req.user.id, clientRequestId: requestId }).populate(POPULATE);
    if (existing) {
      return res.status(200).json({ success: true, duplicate: true, complaint: serializeComplaint(existing, "citizen") });
    }
  }

  const { title, description, category, address, landmark, latitude, longitude } = req.body;

  const ai = await analyzeComplaint({
    title,
    description,
    image: files[0] ? { buffer: files[0].buffer, contentType: files[0].mimetype } : undefined,
  });

  const finalCategory = category && category !== "auto" ? category : ai.category;

  const complaint = new Complaint({
    reference: await generateReference(),
    citizen: req.user.id,
    clientRequestId: requestId,
    title,
    description,
    category: finalCategory,
    priority: ai.priority,
    department: await departmentForCategory(finalCategory),
    address,
    landmark,
    latitude,
    longitude,
    ai,
  });

  complaint.images = await saveImages(files, {
    complaint: complaint._id,
    kind: "citizen_evidence",
    uploadedBy: req.user.id,
  });

  addTimeline(complaint, {
    status: "Pending",
    event: "submitted",
    message: "Complaint submitted",
    user: req.user,
  });

  try {
    await complaint.save();
  } catch (error) {
    await deleteFiles(complaint.images);
    throw error;
  }

  await notify({
    audience: "admin",
    type: "complaint_submitted",
    complaint,
    title: `New ${complaint.priority.toLowerCase()} priority complaint`,
    message: `${complaint.reference}: ${complaint.title}`,
  });

  res.status(201).json({
    success: true,
    message: "Complaint submitted",
    complaint: serializeComplaint(complaint, "citizen"),
  });
};

// GET /api/complaints
export const getMyComplaints = async (req, res) => {
  const { page, limit, status, q } = req.validatedQuery;
  const filter = { citizen: req.user.id };
  if (status) filter.status = status;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: pattern }, { reference: pattern }, { address: pattern }];
  }

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.json({
    success: true,
    complaints: items.map((item) => serializeComplaint(item, "citizen")),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
};

// GET /api/complaints/stats
export const getMyStats = async (req, res) => {
  const rows = await Complaint.aggregate([
    { $match: { citizen: req.user.account._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const by = Object.fromEntries(rows.map((row) => [row._id, row.count]));

  res.json({
    success: true,
    stats: {
      total: rows.reduce((sum, row) => sum + row.count, 0),
      pending: (by.Pending || 0) + (by.Reviewed || 0),
      assigned: by.Assigned || 0,
      inProgress: by["In Progress"] || 0,
      completed: by.Completed || 0,
    },
  });
};

// GET /api/complaints/:id
export const getMyComplaint = async (req, res) => {
  const complaint = await findOwn(req);
  res.json({ success: true, complaint: serializeComplaint(complaint, "citizen") });
};

// PUT /api/complaints/:id — only while nobody has acted on it yet.
export const updateComplaint = async (req, res) => {
  const complaint = await findOwn(req);

  if (complaint.status !== "Pending") {
    throw new AppError(409, "This complaint is already being handled and can no longer be edited");
  }

  Object.assign(complaint, req.body);
  if (req.body.category) {
    complaint.department = await departmentForCategory(req.body.category);
  }
  addTimeline(complaint, { event: "edited", message: "Complaint details updated by citizen", user: req.user });
  await complaint.save();

  res.json({ success: true, message: "Complaint updated", complaint: serializeComplaint(complaint, "citizen") });
};

// DELETE /api/complaints/:id — only while Pending.
export const deleteComplaint = async (req, res) => {
  const complaint = await findOwn(req);

  if (complaint.status !== "Pending") {
    throw new AppError(409, "This complaint is already being handled and can no longer be withdrawn");
  }

  await deleteFiles([...complaint.images, ...complaint.completionImages]);
  await complaint.deleteOne();

  res.json({ success: true, message: "Complaint withdrawn" });
};

// POST /api/complaints/:id/feedback
export const submitFeedback = async (req, res) => {
  const complaint = await findOwn(req);

  if (complaint.status !== "Completed") {
    throw new AppError(409, "Feedback can be given once the complaint is resolved");
  }
  if (complaint.feedback?.rating) {
    throw new AppError(409, "You have already submitted feedback for this complaint");
  }

  complaint.feedback = { ...req.body, submittedAt: new Date() };
  addTimeline(complaint, {
    event: "feedback",
    message: `Citizen rated the resolution ${req.body.rating}/5`,
    user: req.user,
  });
  await complaint.save();

  await notify({
    audience: "admin",
    type: "feedback_received",
    complaint,
    title: `Feedback received (${req.body.rating}/5)`,
    message: complaint.reference,
  });

  res.json({ success: true, message: "Thank you for your feedback", complaint: serializeComplaint(complaint, "citizen") });
};
