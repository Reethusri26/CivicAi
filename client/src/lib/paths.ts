import type { Role } from "./types";

export const complaintPathFor = (role: Role, id: string) =>
  role === "admin" ? `/admin/complaints/${id}` : role === "worker" ? `/worker/tasks/${id}` : `/citizen/complaints/${id}`;
