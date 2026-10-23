import axios, { AxiosError } from "axios";

const configured = import.meta.env.VITE_API_URL as string | undefined;

if (!configured && import.meta.env.PROD) {
  console.error("VITE_API_URL is not set; API requests will fail. Set it in the hosting environment.");
}

export const API_ORIGIN = (configured || "http://localhost:5000").replace(/\/+$/, "");

export const TOKEN_KEY = "civicai.token";

// "Keep me signed in" stores the token in localStorage (survives closing the
// browser, 30-day token). Otherwise it goes in sessionStorage and the user is
// signed out when the browser closes.
const safe = <T,>(fn: () => T, fallback: T) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const getToken = () =>
  safe(() => localStorage.getItem(TOKEN_KEY), null) || safe(() => sessionStorage.getItem(TOKEN_KEY), null);

export const isRemembered = () => Boolean(safe(() => localStorage.getItem(TOKEN_KEY), null));

export const storeToken = (token: string, remember: boolean) => {
  clearToken();
  safe(() => (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token), undefined);
};

export const clearToken = () => {
  safe(() => localStorage.removeItem(TOKEN_KEY), undefined);
  safe(() => sessionStorage.removeItem(TOKEN_KEY), undefined);
};

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
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
    if (error.response?.status === 401 && getToken()) {
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
