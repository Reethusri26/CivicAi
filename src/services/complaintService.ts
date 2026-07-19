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

export const getMyComplaints = () => API.get("/complaints");

// Updated for image upload
export const createComplaint = (formData: FormData) =>
  API.post("/complaints", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const updateComplaint = (
  id: string,
  data: {
    title: string;
    description: string;
    category: string;
  }
) => API.put(`/complaints/${id}`, data);

export const deleteComplaint = (id: string) =>
  API.delete(`/complaints/${id}`);