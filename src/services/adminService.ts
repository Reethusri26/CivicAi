import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getDashboardStats = () =>
  API.get("/admin/stats");

export const getAllComplaints = () =>
  API.get("/admin/complaints");

export const searchComplaints = (query: string) =>
  API.get(`/admin/search?q=${query}`);

export const filterComplaints = (status: string) =>
  API.get(`/admin/filter?status=${status}`);

export const getWorkers = () =>
  API.get("/admin/workers");

export const assignWorker = (
  complaintId: string,
  workerId: string
) =>
  API.patch(`/admin/assign-worker/${complaintId}`, {
    workerId,
  });