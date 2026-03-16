import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("demandiq-token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("demandiq-token");
      localStorage.removeItem("demandiq-user");
      window.location.href = "/login";
    }
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

export const apiService = {
  // Health check
  health: () => api.get("/health"),

  // Auth
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  forgotPassword: (data) => api.post("/api/auth/forgot-password", data),
  resetPassword: (data) => api.post("/api/auth/reset-password", data),
  getProfile: () => api.get("/api/auth/profile"),
  updateProfile: (data) => api.put("/api/auth/profile", data),
  getHistory: (limit = 50) =>
    api.get("/api/auth/history", { params: { limit } }),

  // Predictions
  predict: (data) => api.post("/api/predict", data),
  getMetrics: () => api.get("/api/metrics"),
  uploadCSV: (formData) =>
    api.post("/api/predict-batch", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  trainCSV: (formData) =>
    api.post("/api/train", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Sales data
  getSalesByProduct: (productId, days = 365) =>
    api.get(`/api/sales/${productId}`, { params: { days } }),
  getSalesByStore: (storeId, days = 365) =>
    api.get(`/api/store/${storeId}`, { params: { days } }),

  // Dashboard
  getDashboardSummary: () => api.get("/api/dashboard/summary"),
  getTopProducts: (limit = 10) =>
    api.get("/api/products/top", { params: { limit } }),

  // Model operations
  retrain: () => api.post("/api/retrain"),
};

export default api;
