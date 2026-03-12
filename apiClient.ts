// src/api/apiClient.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  timeout: 120000, // Increased to 2 minutes for long-running operations
});

// Override timeout specifically for train-face endpoint
api.interceptors.request.use((config) => {
  if (config.url?.includes('/train-face')) {
    config.timeout = 600000; // 10 minutes for face training
  }
  return config;
});

export function setAuthToken(token?: string | null) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}
