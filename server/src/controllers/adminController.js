import mongoose from "mongoose";
import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";
import Worker from "../models/Worker.js";
import { analyzeComplaint } from "../ai/analyzeComplaint.js";
import AppError, { badRequest, notFound } from "../utils/AppError.js";
import { escapeRegex } from "../utils/schemas.js";
import { toCsv } from "../utils/csv.js";
import { hashPassword } from "./authController.js";
import { getAnalytics, getInsights, getOverview } from "../services/analyticsService.js";
import { notify } from "../services/notificationService.js";
import { readFileBuffer } from "../services/storageService.js";
import {
  POPULATE,
  addTimeline,
  assertTransition,
  serializeComplaint,
} from "../services/complaintService.js";

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const loadComplaint = async (id) => {
  const complaint = await Complaint.findById(id).populate(POPULATE);
  if (!complaint) throw notFound("Complaint");
  return complaint;
};

const respond = (res, complaint, message) =>
  res.json({ success: true, message, complaint: serializeComplaint(complaint, "admin") });

const assertDepartmentExists = async (name) => {
  if (name && !(await Department.exists({ name }))) {
    throw badRequest(`Department "${name}" does not exist`);
  }
};

// ---------- Overview & analytics ----------

export const overview = async (req, res) => {
  res.json({ success: true, overview: await getOverview() });
};

export const analytics = async (req, res) => {
  const [data, insights] = await Promise.all([getAnalytics(), getInsights()]);
  res.json({ success: true, analytics: data, insights });
};

// ---------- Complaints ----------

const buildFilter = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.department) filter.department = query.department;
  if (query.worker === "unassigned") filter.assignedWorker = null;
  else if (query.worker) filter.assignedWorker = new mongoose.Types.ObjectId(query.worker);
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ title: pattern }, { description: pattern }, { reference: pattern }, { address: pattern }];
  }
  return filter;
};

export const listComplaints = async (req, res) => {
  const query = req.validatedQuery;
  const filter = buildFilter(query);
  const skip = (query.page - 1) * query.limit;

  let items;
  if (query.sort === "priority") {
    const ids = await Complaint.aggregate([
      { $match: filter },
      {
        $addFields: {
          rank: { $indexOfArray: [Object.keys(PRIORITY_RANK), "$priority"] },
        },
      },
      { $sort: { rank: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: query.limit },
      { $project: { _id: 1 } },
    ]);
    const docs = await Complaint.find({ _id: { $in: ids.map((row) => row._id) } }).populate(POPULATE);
    const order = Object.fromEntries(ids.map((row, index) => [String(row._id), index]));
    items = docs.sort((a, b) => order[String(a._id)] - order[String(b._id)]);
  } else {
    const sort = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, updated: { updatedAt: -1 } }[query.sort];
    items = await Complaint.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(query.limit);
  }

  const total = await Complaint.countDocuments(filter);

  res.json({
    success: true,
    complaints: items.map((item) => serializeComplaint(item, "admin")),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) },
  });
};

export const getComplaint = async (req, res) => {
  respond(res, await loadComplaint(req.params.id));
};

export const reviewComplaint = async (req, res) => {
  const complaint = await loadComplaint(req.params.id);
  complaint.status = assertTransition(complaint, "review", "admin");
  complaint.reviewedAt = new Date();
  addTimeline(complaint, { event: "reviewed", message: "Reviewed by the operations team", user: req.user });
  await complaint.save();

  await notify({
    audience: "citizen",
    recipient: complaint.citizen._id,
    type: "complaint_reviewed",
    complaint,
    title: "Your complaint was reviewed",
    message: `${complaint.reference} has been reviewed and will be assigned to a field team.`,
  });

  respond(res, complaint, "Complaint marked as reviewed");
};

export const assignComplaint = async (req, res) => {
  const { workerId, reason } = req.body;
  const complaint = await loadComplaint(req.params.id);
  const worker = await Worker.findById(workerId);

  if (!worker || !worker.isActive) throw badRequest("Choose an active worker");

  const previous = complaint.assignedWorker;
  const isReassign = Boolean(previous);

  if (isReassign && String(previous._id) === String(worker._id)) {
    throw new AppError(409, "This complaint is already assigned to that worker");
  }
  if (isReassign && !reason) {
    throw badRequest("Give a reason for reassigning this complaint");
  }

  complaint.status = assertTransition(complaint, "assign", "admin");
  complaint.assignedWorker = worker._id;
  complaint.assignedAt = new Date();
  complaint.startedAt = null;
  if (!complaint.reviewedAt) complaint.reviewedAt = new Date();

  addTimeline(complaint, {
    event: isReassign ? "reassigned" : "assigned",
    message: isReassign
      ? `Reassigned to ${worker.name} (${worker.department}). Reason: ${reason}`
      : `Assigned to ${worker.name} (${worker.department})`,
    user: req.user,
  });
  await complaint.save();
  await complaint.populate(POPULATE);

  const stamp = complaint.assignedAt.getTime();
  await notify({
    audience: "worker",
    recipient: worker._id,
    type: "task_assigned",
    complaint,
    title: `New ${complaint.priority.toLowerCase()} priority task`,
    message: `${complaint.reference}: ${complaint.title}`,
    dedupeKey: `task_assigned:${complaint._id}:${worker._id}:${stamp}`,
  });
  if (isReassign) {
    await notify({
      audience: "worker",
      recipient: previous._id,
      type: "task_unassigned",
      complaint,
      title: "Task reassigned",
      message: `${complaint.reference} has been moved to another worker.`,
      dedupeKey: `task_unassigned:${complaint._id}:${previous._id}:${stamp}`,
    });
  }
  await notify({
    audience: "citizen",
    recipient: complaint.citizen._id,
    type: "complaint_assigned",
    complaint,
    title: "A field worker has been assigned",
    message: `${complaint.reference} is now with the ${worker.department} team.`,
    dedupeKey: `complaint_assigned:${complaint._id}:${stamp}`,
  });

  respond(res, complaint, isReassign ? "Complaint reassigned" : "Worker assigned");
};

export const updateComplaintFields = async (req, res) => {
  const complaint = await loadComplaint(req.params.id);
  const changes = [];

  if (req.body.department !== undefined) await assertDepartmentExists(req.body.department);

  for (const field of ["category", "priority", "department"]) {
    if (req.body[field] !== undefined && req.body[field] !== complaint[field]) {
      changes.push(`${field} ${complaint[field] || "none"} → ${req.body[field]}`);
      complaint[field] = req.body[field];
    }
  }

  if (!changes.length) return respond(res, complaint, "Nothing changed");

  addTimeline(complaint, { event: "updated", message: `Updated: ${changes.join(", ")}`, user: req.user });
  await complaint.save();
  respond(res, complaint, "Complaint updated");
};

// Applies the stored AI/rule suggestion to the complaint's live fields.
export const applyAiSuggestion = async (req, res) => {
  const complaint = await loadComplaint(req.params.id);
  if (!complaint.ai) throw badRequest("No AI suggestion is available for this complaint");

  complaint.category = complaint.ai.category;
  complaint.priority = complaint.ai.priority;
  if (complaint.ai.department) complaint.department = complaint.ai.department;

  addTimeline(complaint, {
    event: "ai_applied",
    message: `Applied ${complaint.ai.source === "gemini" ? "Gemini" : "rule-based"} suggestion`,
    user: req.user,
  });
  await complaint.save();
  respond(res, complaint, "Suggestion applied");
};

export const reanalyzeComplaint = async (req, res) => {
  const complaint = await loadComplaint(req.params.id);
  const first = complaint.images[0];
  const image = first
    ? { buffer: await readFileBuffer(first.fileId), contentType: first.contentType }
    : undefined;

  complaint.ai = await analyzeComplaint({ title: complaint.title, description: complaint.description, image });
  await complaint.save();
  respond(res, complaint, complaint.ai.source === "gemini" ? "Gemini analysis updated" : "Rule-based analysis used");
};

export const addAdminNote = async (req, res) => {
  const complaint = await loadComplaint(req.params.id);
  complaint.notes.push({ ...req.body, authorRole: "admin", authorName: req.user.name });
  await complaint.save();
  respond(res, complaint, "Note added");
};

// ---------- Workers ----------

export const listWorkers = async (req, res) => {
  const [workers, workload] = await Promise.all([
    Worker.find().sort({ name: 1 }).lean(),
    Complaint.aggregate([
      { $match: { assignedWorker: { $ne: null } } },
      {
        $group: {
          _id: "$assignedWorker",
          active: { $sum: { $cond: [{ $in: ["$status", ["Assigned", "In Progress"]] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const byWorker = Object.fromEntries(workload.map((row) => [String(row._id), row]));

  res.json({
    success: true,
    workers: workers.map((worker) => ({
      id: String(worker._id),
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      department: worker.department,
      isActive: worker.isActive !== false,
      activeTasks: byWorker[String(worker._id)]?.active || 0,
      completedTasks: byWorker[String(worker._id)]?.completed || 0,
      createdAt: worker.createdAt,
    })),
  });
};

export const createWorker = async (req, res) => {
  const { name, email, password, department, phone } = req.body;
  await assertDepartmentExists(department);

  if (await Worker.exists({ email })) throw new AppError(409, "A worker with this email already exists");

  const worker = await Worker.create({ name, email, phone, department, password: await hashPassword(password) });
  res.status(201).json({
    success: true,
    message: "Worker account created",
    worker: { id: String(worker._id), name, email, phone, department, isActive: true },
  });
};

export const updateWorker = async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw notFound("Worker");
  if (req.body.department) await assertDepartmentExists(req.body.department);

  Object.assign(worker, req.body);
  if (req.body.isActive === false) worker.tokenVersion = (worker.tokenVersion || 0) + 1;
  await worker.save();

  res.json({
    success: true,
    message: "Worker updated",
    worker: {
      id: String(worker._id),
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      department: worker.department,
      isActive: worker.isActive,
    },
  });
};

export const resetWorkerPassword = async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) throw notFound("Worker");

  worker.password = await hashPassword(req.body.password);
  worker.tokenVersion = (worker.tokenVersion || 0) + 1;
  await worker.save();
  res.json({ success: true, message: "Password reset. Share it with the worker securely." });
};

// ---------- Departments ----------

export const listDepartments = async (req, res) => {
  const [departments, workerCounts, openCounts] = await Promise.all([
    Department.find().sort({ name: 1 }).lean(),
    Worker.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { status: { $ne: "Completed" } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
  ]);
  const workersBy = Object.fromEntries(workerCounts.map((row) => [row._id, row.count]));
  const openBy = Object.fromEntries(openCounts.map((row) => [row._id, row.count]));

  res.json({
    success: true,
    departments: departments.map((department) => ({
      id: String(department._id),
      name: department.name,
      description: department.description,
      categories: department.categories,
      workers: workersBy[department.name] || 0,
      openComplaints: openBy[department.name] || 0,
    })),
  });
};

// A category routes to exactly one department, so claiming it here removes it elsewhere.
const claimCategories = async (departmentId, categories) => {
  if (categories.length) {
    await Department.updateMany({ _id: { $ne: departmentId } }, { $pull: { categories: { $in: categories } } });
  }
};

export const createDepartment = async (req, res) => {
  const department = await Department.create(req.body);
  await claimCategories(department._id, department.categories);
  res.status(201).json({ success: true, message: "Department created", department });
};

export const updateDepartment = async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw notFound("Department");

  const oldName = department.name;
  Object.assign(department, req.body);
  await department.save();
  await claimCategories(department._id, department.categories);

  if (oldName !== department.name) {
    await Worker.updateMany({ department: oldName }, { department: department.name });
    await Complaint.updateMany({ department: oldName }, { department: department.name });
  }

  res.json({ success: true, message: "Department updated", department });
};

export const deleteDepartment = async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw notFound("Department");

  if (await Worker.exists({ department: department.name })) {
    throw new AppError(409, "Move this department's workers to another department before deleting it");
  }
  await department.deleteOne();
  res.json({ success: true, message: "Department deleted" });
};

// ---------- Reports ----------

const hoursBetween = (start, end) => (start && end ? ((end - start) / 36e5).toFixed(1) : "");

// CSV export. Deliberately excludes citizen names and contact details.
export const exportComplaints = async (req, res) => {
  const { status, from, to } = req.validatedQuery;
  const filter = buildFilter({ status, from, to });
  const complaints = await Complaint.find(filter)
    .populate({ path: "assignedWorker", select: "name" })
    .sort({ createdAt: -1 })
    .limit(10000)
    .lean();

  const csv = toCsv(
    [
      "Reference",
      "Title",
      "Category",
      "Priority",
      "Department",
      "Status",
      "Assigned worker",
      "Created",
      "Assigned",
      "Completed",
      "Resolution hours",
      "AI source",
      "AI category",
      "AI matched final category",
      "Feedback rating",
    ],
    complaints.map((c) => [
      c.reference || String(c._id),
      c.title,
      c.category,
      c.priority,
      c.department,
      c.status,
      c.assignedWorker?.name || "",
      c.createdAt?.toISOString(),
      c.assignedAt?.toISOString() || "",
      c.completedAt?.toISOString() || "",
      hoursBetween(c.createdAt, c.completedAt),
      c.ai?.source || "",
      c.ai?.category || "",
      c.ai ? (c.ai.category === c.category ? "yes" : "no") : "",
      c.feedback?.rating || "",
    ])
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="civicai-complaints-${Date.now()}.csv"`);
  res.send(csv);
};

// AI evaluation: how often the admin-confirmed category matches the suggestion.
// Only complaints an admin has reviewed are counted, since unreviewed ones
// still carry the suggestion unchanged.
export const aiEvaluation = async (req, res) => {
  const rows = await Complaint.aggregate([
    { $match: { ai: { $ne: null }, reviewedAt: { $ne: null } } },
    {
      $group: {
        _id: "$ai.source",
        total: { $sum: 1 },
        categoryMatches: { $sum: { $cond: [{ $eq: ["$ai.category", "$category"] }, 1, 0] } },
        priorityMatches: { $sum: { $cond: [{ $eq: ["$ai.priority", "$priority"] }, 1, 0] } },
      },
    },
  ]);

  res.json({
    success: true,
    evaluation: rows.map((row) => ({
      source: row._id,
      reviewed: row.total,
      categoryAgreement: row.total ? row.categoryMatches / row.total : null,
      priorityAgreement: row.total ? row.priorityMatches / row.total : null,
    })),
  });
};
