import axios from "axios";

const api = axios.create({
  baseURL: "https://civicai-backend-lz1n.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;