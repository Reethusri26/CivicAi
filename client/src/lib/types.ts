export type Role = "citizen" | "worker" | "admin";

export type Status = "Pending" | "Reviewed" | "Assigned" | "In Progress" | "Completed";
export type Priority = "Low" | "Medium" | "High";

export interface Account {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  department?: string;
  createdAt?: string;
}

export interface EvidenceFile {
  id: string;
  url: string;
  filename?: string;
  uploadedAt?: string;
  legacy?: boolean;
}

export interface TimelineEntry {
  status: Status;
  event: string;
  message?: string;
  actorRole?: string;
  actorName?: string;
  date: string;
}

export interface Note {
  id: string;
  text: string;
  authorRole: "worker" | "admin";
  authorName?: string;
  visibleToCitizen: boolean;
  date?: string;
}

export interface AiResult {
  source: "gemini" | "rules";
  category: string;
  priority: Priority;
  department?: string;
  explanation?: string;
  confidence: number | null;
  model?: string;
  usedImage?: boolean;
  fallbackReason?: string;
  analyzedAt?: string;
}

export interface Complaint {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  department: string;
  status: Status;
  address: string;
  landmark?: string;
  latitude: number | null;
  longitude: number | null;
  images: EvidenceFile[];
  completionImages: EvidenceFile[];
  notes: Note[];
  ai: AiResult | null;
  feedback: { rating: number; comment?: string; submittedAt?: string } | null;
  timeline: TimelineEntry[];
  assignedAt?: string | null;
  reviewedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  worker: { id: string; name: string; department: string; email?: string; phone?: string } | null;
  citizen?: { id?: string; name: string; email?: string; phone?: string } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface WorkerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  isActive: boolean;
  activeTasks: number;
  completedTasks: number;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  categories: string[];
  workers: number;
  openComplaints: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  complaintId: string | null;
  createdAt: string;
  read: boolean;
}
