import type { Priority, Role, Status } from "./types";

export const CATEGORIES = [
  "Garbage",
  "Pothole",
  "Water Leakage",
  "Street Light",
  "Drainage",
  "Dead Animal",
  "Other",
] as const;

export const STATUSES: Status[] = ["Pending", "Reviewed", "Assigned", "In Progress", "Completed"];
export const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export const MAX_IMAGES = 5;
export const MAX_IMAGE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const HOME_BY_ROLE: Record<Role, string> = {
  citizen: "/citizen",
  worker: "/worker",
  admin: "/admin",
};

export const STATUS_STYLES: Record<Status, string> = {
  Pending: "bg-amber-50 text-amber-800 ring-amber-200",
  Reviewed: "bg-sky-50 text-sky-800 ring-sky-200",
  Assigned: "bg-violet-50 text-violet-800 ring-violet-200",
  "In Progress": "bg-blue-50 text-blue-800 ring-blue-200",
  Completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export const STATUS_DOT: Record<Status, string> = {
  Pending: "bg-amber-500",
  Reviewed: "bg-sky-500",
  Assigned: "bg-violet-500",
  "In Progress": "bg-blue-500",
  Completed: "bg-emerald-500",
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  High: "bg-rose-50 text-rose-700 ring-rose-200",
  Medium: "bg-orange-50 text-orange-700 ring-orange-200",
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
};

// Chart colours keyed to the status palette above.
export const STATUS_CHART_COLORS: Record<Status, string> = {
  Pending: "#f59e0b",
  Reviewed: "#0ea5e9",
  Assigned: "#8b5cf6",
  "In Progress": "#6552ff",
  Completed: "#10b981",
};

export const PRIORITY_CHART_COLORS: Record<Priority, string> = {
  High: "#e11d48",
  Medium: "#f97316",
  Low: "#94a3b8",
};
