import axios, { AxiosError } from "axios";

const configured = import.meta.env.VITE_API_URL as string | undefined;

if (!configured && import.meta.env.PROD) {
  console.error("VITE_API_URL is not set; API requests will fail. Set it in the hosting environment.");
}

export const API_ORIGIN = (configured || "http://localhost:5000").replace(/\/+$/, "");

export const TOKEN_KEY = "civicai.token";

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;

// AuthContext registers a handler so an expired session signs the user out.
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "The server took too long to respond. It may be waking up — please try again.";
    if (!error.response) return "Can't reach the server. Check your connection and try again.";
    const data = error.response.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
};

// Evidence URLs from the API are relative and signed; legacy ones are /uploads paths.
export const fileUrl = (path: string) => (path.startsWith("http") ? path : `${API_ORIGIN}${path}`);
