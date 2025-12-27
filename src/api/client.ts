import axios from "axios";
import { useAuthStore } from "@/stores";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Add X-User-Id header
api.interceptors.request.use(
  (config) => {
    // Get userId from auth store
    const user = useAuthStore.getState().user;
    if (user?.id) {
      config.headers["X-User-Id"] = user.id;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      useAuthStore.getState().logout();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
