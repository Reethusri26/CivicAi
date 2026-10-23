import Complaint from "../models/Complaint.js";
import Worker from "../models/Worker.js";
import { STATUSES } from "../config/constants.js";

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const resolutionHours = { $divide: [{ $subtract: ["$completedAt", "$createdAt"] }, HOUR] };

const countBy = async (field, match = {}) => {
  const rows = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((row) => ({ key: row._id || "Unspecified", count: row.count }));
};

export const getOverview = async () => {
  const [statusRows, highPriorityOpen, resolution] = await Promise.all([
    countBy("status"),
    Complaint.countDocuments({ priority: "High", status: { $ne: "Completed" } }),
    Complaint.aggregate([
      { $match: { status: "Completed", completedAt: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: resolutionHours }, count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const row of statusRows) byStatus[row.key] = row.count;
  const total = Object.values(byStatus).reduce((sum, value) => sum + value, 0);

  return {
    total,
    pending: byStatus.Pending,
    reviewed: byStatus.Reviewed,
    assigned: byStatus.Assigned,
    inProgress: byStatus["In Progress"],
    completed: byStatus.Completed,
    highPriorityOpen,
    resolutionRate: total ? byStatus.Completed / total : null,
    // Only meaningful once something has been resolved.
    avgResolutionHours: resolution[0]?.count ? resolution[0].avg : null,
    resolvedSampleSize: resolution[0]?.count || 0,
  };
};

export const getAnalytics = async ({ months = 6 } = {}) => {
  // Month buckets are computed in UTC, matching MongoDB's $dateToString.
  const now = new Date();
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const [byStatus, byCategory, byPriority, created, completed, departments, workers, resolutionByCategory] =
    await Promise.all([
      countBy("status"),
      countBy("category"),
      countBy("priority"),
      Complaint.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { completedAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } }, count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: "$department",
            open: { $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          },
        },
        { $sort: { open: -1 } },
      ]),
      Complaint.aggregate([
        { $match: { assignedWorker: { $ne: null } } },
        {
          $group: {
            _id: "$assignedWorker",
            active: { $sum: { $cond: [{ $in: ["$status", ["Assigned", "In Progress"]] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            avgHours: {
              $avg: { $cond: [{ $eq: ["$status", "Completed"] }, resolutionHours, null] },
            },
          },
        },
      ]),
      Complaint.aggregate([
        { $match: { status: "Completed", completedAt: { $ne: null } } },
        { $group: { _id: "$category", avgHours: { $avg: resolutionHours }, count: { $sum: 1 } } },
        { $sort: { avgHours: -1 } },
      ]),
    ]);

  const monthKeys = [];
  for (let i = 0; i < months; i += 1) {
    const date = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + i, 1));
    monthKeys.push(date.toISOString().slice(0, 7));
  }
  const lookup = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
  const createdMap = lookup(created);
  const completedMap = lookup(completed);

  const workerDocs = await Worker.find({ _id: { $in: workers.map((w) => w._id) } }, "name department").lean();
  const workerNames = Object.fromEntries(workerDocs.map((w) => [String(w._id), w]));

  return {
    byStatus,
    byCategory,
    byPriority,
    trend: monthKeys.map((month) => ({
      month,
      created: createdMap[month] || 0,
      completed: completedMap[month] || 0,
    })),
    departmentWorkload: departments.map((row) => ({
      department: row._id || "Unassigned",
      open: row.open,
      completed: row.completed,
    })),
    workerPerformance: workers
      .map((row) => ({
        workerId: String(row._id),
        name: workerNames[String(row._id)]?.name || "Removed worker",
        department: workerNames[String(row._id)]?.department || "",
        active: row.active,
        completed: row.completed,
        avgResolutionHours: row.avgHours,
      }))
      .sort((a, b) => b.completed - a.completed),
    resolutionByCategory: resolutionByCategory.map((row) => ({
      category: row._id,
      avgHours: row.avgHours,
      count: row.count,
    })),
  };
};

// Plain-language observations derived from real aggregates. Returns nothing
// rather than inventing a trend when there is too little data.
export const getInsights = async () => {
  const now = Date.now();
  const recentStart = new Date(now - 30 * DAY);
  const priorStart = new Date(now - 60 * DAY);
  const insights = [];

  const [recent, prior, oldestOpen, backlog] = await Promise.all([
    countBy("category", { createdAt: { $gte: recentStart } }),
    countBy("category", { createdAt: { $gte: priorStart, $lt: recentStart } }),
    Complaint.findOne({ status: { $ne: "Completed" } }, "reference createdAt").sort({ createdAt: 1 }).lean(),
    Complaint.aggregate([
      { $match: { status: { $ne: "Completed" }, department: { $nin: ["", null] } } },
      { $group: { _id: "$department", open: { $sum: 1 } } },
      { $sort: { open: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const priorMap = Object.fromEntries(prior.map((row) => [row.key, row.count]));
  for (const row of recent) {
    const before = priorMap[row.key] || 0;
    if (row.count >= 3 && row.count >= before * 1.5 && row.count - before >= 2) {
      insights.push({
        kind: "category_increase",
        text: `${row.key} reports rose to ${row.count} in the last 30 days, up from ${before} in the previous 30 days.`,
      });
    }
  }

  if (backlog[0]?.open >= 3) {
    insights.push({
      kind: "department_backlog",
      text: `${backlog[0]._id} has the largest open backlog with ${backlog[0].open} unresolved complaints.`,
    });
  }

  if (oldestOpen) {
    const days = Math.floor((now - new Date(oldestOpen.createdAt).getTime()) / DAY);
    if (days >= 7) {
      insights.push({
        kind: "oldest_open",
        text: `The oldest open complaint (${oldestOpen.reference || "legacy record"}) has been waiting ${days} days.`,
      });
    }
  }

  return insights;
};

export const getPublicStats = async () => {
  const [total, completed] = await Promise.all([
    Complaint.estimatedDocumentCount(),
    Complaint.countDocuments({ status: "Completed" }),
  ]);
  return { total, completed };
};
