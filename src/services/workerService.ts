import axios from "axios";

const API = axios.create({
  baseURL: "https://civicai-backend-lz1n.onrender.com/api",
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
  formData: FormData
) => {
  return API.patch(`/worker/update-status/${complaintId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};