import axios from "axios";
import { useAuthStore } from "@/stores";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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
    // Get userId from localStorage (set during login)
    const userId = localStorage.getItem("userId");
    if (userId) {
      config.headers["X-User-Id"] = userId;
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
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
