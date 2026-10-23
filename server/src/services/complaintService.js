import crypto from "crypto";
import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import { signedFileUrl } from "./storageService.js";

// Unambiguous characters (no 0/O, 1/I) so references are easy to read aloud.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateReference = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bytes = crypto.randomBytes(6);
    const suffix = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const reference = `CIV-${date}-${suffix}`;
    if (!(await Complaint.exists({ reference }))) return reference;
  }
  throw new Error("Could not generate a unique complaint reference");
};

// Allowed status changes and who may perform them. Enforced on the server
// regardless of what the client sends.
const TRANSITIONS = {
  review: { from: ["Pending"], to: "Reviewed", roles: ["admin"] },
  assign: { from: ["Pending", "Reviewed", "Assigned", "In Progress"], to: "Assigned", roles: ["admin"] },
  start: { from: ["Assigned"], to: "In Progress", roles: ["worker"] },
  complete: { from: ["In Progress"], to: "Completed", roles: ["worker"] },
};

export const assertTransition = (complaint, action, role) => {
  const rule = TRANSITIONS[action];
  if (!rule || !rule.roles.includes(role)) {
    throw new AppError(403, "You are not allowed to perform this action");
  }
  if (!rule.from.includes(complaint.status)) {
    throw new AppError(409, `Cannot ${action} a complaint that is ${complaint.status}`);
  }
  return rule.to;
};

export const addTimeline = (complaint, { status = complaint.status, event, message, user }) => {
  complaint.timeline.push({
    status,
    event,
    message,
    actorRole: user?.role || "system",
    actorName: user?.role === "citizen" ? undefined : user?.name,
    date: new Date(),
  });
};

const fileList = (refs = [], legacy) => {
  const files = refs.map((ref) => ({
    id: String(ref.fileId),
    url: signedFileUrl(ref.fileId),
    filename: ref.filename,
    uploadedAt: ref.uploadedAt,
  }));
  if (legacy) files.push({ id: legacy, url: legacy, filename: "legacy upload", legacy: true });
  return files;
};

// Builds the API representation of a complaint for the given role, leaving
// out anything that role should not see.
export const serializeComplaint = (complaint, role) => {
  const c = complaint.toObject ? complaint.toObject() : complaint;
  const citizen = c.citizen && typeof c.citizen === "object" ? c.citizen : null;
  const worker = c.assignedWorker && typeof c.assignedWorker === "object" ? c.assignedWorker : null;

  const notes = (c.notes || [])
    .filter((note) => role !== "citizen" || note.visibleToCitizen)
    .map((note) => ({
      id: String(note._id),
      text: note.text,
      authorRole: note.authorRole,
      authorName: note.authorName,
      visibleToCitizen: note.visibleToCitizen,
      date: note.date,
    }));

  if (c.workerNotes && !notes.length) {
    notes.push({ id: "legacy", text: c.workerNotes, authorRole: "worker", visibleToCitizen: true });
  }

  const base = {
    id: String(c._id),
    reference: c.reference,
    title: c.title,
    description: c.description,
    category: c.category,
    priority: c.priority,
    department: c.department,
    status: c.status,
    address: c.address,
    landmark: c.landmark,
    latitude: c.latitude,
    longitude: c.longitude,
    images: fileList(c.images, c.image),
    completionImages: fileList(c.completionImages, c.completionImage),
    notes,
    ai: c.ai
      ? {
          source: c.ai.source,
          category: c.ai.category,
          priority: c.ai.priority,
          department: c.ai.department,
          explanation: c.ai.explanation,
          confidence: c.ai.confidence,
          model: c.ai.model,
          usedImage: c.ai.usedImage,
          fallbackReason: c.ai.fallbackReason,
          analyzedAt: c.ai.analyzedAt,
        }
      : null,
    feedback: c.feedback?.rating ? c.feedback : null,
    timeline: (c.timeline || []).map((entry) => ({
      status: entry.status,
      event: entry.event,
      message: entry.message,
      actorRole: entry.actorRole,
      actorName: role === "admin" || entry.actorRole === "worker" ? entry.actorName : undefined,
      date: entry.date,
    })),
    assignedAt: c.assignedAt,
    reviewedAt: c.reviewedAt,
    startedAt: c.startedAt,
    completedAt: c.completedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    worker: worker ? { id: String(worker._id), name: worker.name, department: worker.department } : null,
  };

  if (role === "admin") {
    base.citizen = citizen
      ? { id: String(citizen._id), name: citizen.fullName, email: citizen.email, phone: citizen.phone }
      : null;
    if (worker) {
      base.worker.email = worker.email;
      base.worker.phone = worker.phone;
    }
  } else {
    // While work is open, the resident and the assigned worker can see each
    // other's phone number so they can coordinate on site. Emails stay
    // private, and phones are hidden again once the work is completed.
    const workIsOpen = ["Assigned", "In Progress"].includes(c.status);

    if (role === "worker") {
      base.citizen = citizen
        ? { name: citizen.fullName, ...(workIsOpen && citizen.phone ? { phone: citizen.phone } : {}) }
        : null;
    } else if (worker && workIsOpen && worker.phone) {
      base.worker.phone = worker.phone;
    }
  }

  return base;
};

export const POPULATE = [
  { path: "citizen", select: "fullName email phone" },
  { path: "assignedWorker", select: "name department email phone" },
];
