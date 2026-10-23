export const CATEGORIES = [
  "Garbage",
  "Pothole",
  "Water Leakage",
  "Street Light",
  "Drainage",
  "Dead Animal",
  "Other",
];

export const PRIORITIES = ["Low", "Medium", "High"];

export const STATUSES = ["Pending", "Reviewed", "Assigned", "In Progress", "Completed"];

// Default department structure. Written to MongoDB on first start so admins
// can edit the category-to-department mapping without code changes.
export const DEFAULT_DEPARTMENTS = [
  { name: "Roads", description: "Road surfaces, potholes and footpaths", categories: ["Pothole"] },
  { name: "Water", description: "Water supply and pipeline leakage", categories: ["Water Leakage"] },
  { name: "Electricity", description: "Street lighting and public electrical fixtures", categories: ["Street Light"] },
  { name: "Sanitation", description: "Garbage collection and carcass removal", categories: ["Garbage", "Dead Animal"] },
  { name: "Drainage", description: "Storm drains, sewers and waterlogging", categories: ["Drainage"] },
  { name: "General", description: "Issues that do not fit another department", categories: ["Other"] },
];

// Departments used by the original seed data; mapped onto the new names.
export const LEGACY_DEPARTMENT_NAMES = { Garbage: "Sanitation", Others: "General" };
