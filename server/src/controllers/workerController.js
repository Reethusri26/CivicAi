import Complaint from "../models/Complaint.js";
import { assertValidImages } from "../middleware/upload.js";
import AppError, { badRequest, notFound } from "../utils/AppError.js";
import { notify } from "../services/notificationService.js";
import { saveImages } from "../services/storageService.js";
import {
  POPULATE,
  addTimeline,
  assertTransition,
  serializeComplaint,
} from "../services/complaintService.js";

const STATUS_ORDER = { "In Progress": 0, Assigned: 1, Completed: 2 };
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
const MAX_COMPLETION_IMAGES = 10;

// The worker's identity always comes from the verified token, never the request.
const loadOwnTask = async (req) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, assignedWorker: req.user.id }).populate(POPULATE);
  if (!complaint) throw notFound("Task");
  return complaint;
};

const respond = (res, complaint, message) =>
  res.json({ success: true, message, complaint: serializeComplaint(complaint, "worker") });

// GET /api/worker/tasks
export const listTasks = async (req, res) => {
  const filter = { assignedWorker: req.user.id };
  if (req.query.status && ["Assigned", "In Progress", "Completed"].includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const tasks = await Complaint.find(filter).populate(POPULATE).sort({ assignedAt: -1 }).limit(300);

  tasks.sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) ||
      (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3) ||
      new Date(a.assignedAt) - new Date(b.assignedAt)
  );

  const all = await Complaint.aggregate([
    { $match: { assignedWorker: req.user.account._id } },
    {
      $group: {
        _id: null,
        assigned: { $sum: { $cond: [{ $eq: ["$status", "Assigned"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        highPriorityOpen: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$priority", "High"] }, { $ne: ["$status", "Completed"] }] }, 1, 0],
          },
        },
      },
    },
  ]);

  res.json({
    success: true,
    stats: all[0] ? { ...all[0], _id: undefined } : { assigned: 0, inProgress: 0, completed: 0, highPriorityOpen: 0 },
    tasks: tasks.map((task) => serializeComplaint(task, "worker")),
  });
};

// GET /api/worker/tasks/:id
export const getTask = async (req, res) => {
  respond(res, await loadOwnTask(req));
};

// POST /api/worker/tasks/:id/start
export const startTask = async (req, res) => {
  const complaint = await loadOwnTask(req);
  complaint.status = assertTransition(complaint, "start", "worker");
  complaint.startedAt = new Date();
  addTimeline(complaint, { event: "started", message: "Work started on site", user: req.user });
  await complaint.save();

  await notify({
    audience: "citizen",
    recipient: complaint.citizen._id,
    type: "work_started",
    complaint,
    title: "Work has started",
    message: `A field worker has started work on ${complaint.reference}.`,
    dedupeKey: `work_started:${complaint._id}:${complaint.startedAt.getTime()}`,
  });

  respond(res, complaint, "Work started");
};

// POST /api/worker/tasks/:id/notes
export const addNote = async (req, res) => {
  const complaint = await loadOwnTask(req);
  if (complaint.status === "Completed") {
    throw new AppError(409, "This task is already completed");
  }

  complaint.notes.push({ ...req.body, authorRole: "worker", authorName: req.user.name });
  addTimeline(complaint, { event: "note", message: "Progress note added", user: req.user });
  await complaint.save();
  respond(res, complaint, "Note added");
};

// POST /api/worker/tasks/:id/evidence  (multipart images[])
export const uploadEvidence = async (req, res) => {
  const complaint = await loadOwnTask(req);
  const files = req.files || [];

  if (complaint.status !== "In Progress") {
    throw new AppError(409, "Start work before uploading completion evidence");
  }
  if (!files.length) throw badRequest("Choose at least one image");
  if (complaint.completionImages.length + files.length > MAX_COMPLETION_IMAGES) {
    throw badRequest(`A task can have at most ${MAX_COMPLETION_IMAGES} evidence images`);
  }

  assertValidImages(files);
  complaint.completionImages.push(
    ...(await saveImages(files, { complaint: complaint._id, kind: "completion_evidence", uploadedBy: req.user.id }))
  );
  addTimeline(complaint, {
    event: "evidence",
    message: `${files.length} evidence photo${files.length > 1 ? "s" : ""} uploaded`,
    user: req.user,
  });
  await complaint.save();
  respond(res, complaint, "Evidence uploaded");
};

// POST /api/worker/tasks/:id/complete  (multipart: optional images[] + note)
export const completeTask = async (req, res) => {
  const complaint = await loadOwnTask(req);
  const files = req.files || [];
  const nextStatus = assertTransition(complaint, "complete", "worker");

  if (files.length) {
    assertValidImages(files);
    complaint.completionImages.push(
      ...(await saveImages(files, { complaint: complaint._id, kind: "completion_evidence", uploadedBy: req.user.id }))
    );
  }

  if (!complaint.completionImages.length && !complaint.completionImage) {
    throw badRequest("Upload at least one photo of the completed work before marking it complete");
  }

  const note = String(req.body?.note || "").trim().slice(0, 1000);
  if (note) {
    complaint.notes.push({ text: note, authorRole: "worker", authorName: req.user.name, visibleToCitizen: true });
  }

  complaint.status = nextStatus;
  complaint.completedAt = new Date();
  addTimeline(complaint, { event: "completed", message: "Work completed and evidence submitted", user: req.user });
  await complaint.save();

  await notify({
    audience: "citizen",
    recipient: complaint.citizen._id,
    type: "feedback_requested",
    complaint,
    title: "Your complaint has been resolved",
    message: `${complaint.reference} is complete. Let us know how we did.`,
  });
  await notify({
    audience: "admin",
    type: "complaint_completed",
    complaint,
    title: "Task completed",
    message: `${complaint.reference} was completed by ${req.user.name}.`,
  });

  respond(res, complaint, "Task completed");
};
