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

export const getAssignedComplaints = (workerId: string) =>
  API.get(`/worker/complaints/${workerId}`);

export const updateComplaintStatus = (
  complaintId: string,
  status: string
) =>
  API.patch(`/worker/update-status/${complaintId}`, {
    status,
  });