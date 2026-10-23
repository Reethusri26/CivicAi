import mongoose from "mongoose";
import Complaint from "../models/Complaint.js";
import AppError, { notFound } from "../utils/AppError.js";
import { getPublicStats } from "../services/analyticsService.js";
import { listNotifications, markRead } from "../services/notificationService.js";
import { findFile, openDownloadStream, verifyFileSignature } from "../services/storageService.js";
import { CATEGORIES } from "../config/constants.js";

// GET /api/files/:id?exp=&sig= — signed, short-lived evidence URLs.
export const getFile = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !verifyFileSignature(id, req.query.exp, req.query.sig)) {
    throw new AppError(403, "This link has expired. Reload the page to view the image.");
  }

  const file = await findFile(id);
  if (!file) throw notFound("File");

  res.setHeader("Content-Type", file.metadata?.contentType || "application/octet-stream");
  res.setHeader("Content-Length", file.length);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("Content-Disposition", "inline");
  // Evidence images are loaded cross-origin by the frontend.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  openDownloadStream(id).on("error", () => res.destroy()).pipe(res);
};

export const getNotifications = async (req, res) => {
  res.json({ success: true, ...(await listNotifications(req.user)) });
};

export const readNotifications = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
    : undefined;
  await markRead(req.user, ids);
  res.json({ success: true });
};

// Public, aggregate-only numbers for the landing page.
export const publicStats = async (req, res) => {
  res.json({ success: true, stats: await getPublicStats(), categories: CATEGORIES });
};

// Public tracking by reference. Returns status information only — no
// description, address, images or personal details.
export const trackByReference = async (req, res) => {
  const reference = String(req.params.reference || "").trim().toUpperCase();
  if (!/^CIV-\d{6}-[A-Z0-9]{6}$/.test(reference)) {
    throw new AppError(400, "Enter a reference in the format CIV-YYMMDD-XXXXXX");
  }

  const complaint = await Complaint.findOne({ reference }, "reference category department status timeline createdAt updatedAt completedAt").lean();
  if (!complaint) throw notFound("Complaint");

  res.json({
    success: true,
    complaint: {
      reference: complaint.reference,
      category: complaint.category,
      department: complaint.department,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      completedAt: complaint.completedAt,
      timeline: complaint.timeline
        .filter((entry) => ["submitted", "reviewed", "assigned", "reassigned", "started", "completed"].includes(entry.event))
        .map((entry) => ({ status: entry.status, event: entry.event, date: entry.date })),
    },
  });
};
