import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // Predictions
  predict: (data) => api.post('/api/predict', data),
  getMetrics: () => api.get('/api/metrics'),
  uploadCSV: (formData) => api.post('/api/predict-batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  // New endpoint to train model with user-provided CSV
  trainCSV: (formData) => api.post('/api/train', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Sales data
  getSalesByProduct: (productId, days = 365) =>
    api.get(`/api/sales/${productId}`, { params: { days } }),

  getSalesByStore: (storeId, days = 365) =>
    api.get(`/api/store/${storeId}`, { params: { days } }),

  // Dashboard
  getDashboardSummary: () => api.get('/api/dashboard/summary'),

  // Top products
  getTopProducts: (limit = 10) => api.get('/api/products/top', { params: { limit } }),

  // Model operations
  retrain: () => api.post('/api/retrain'),
}

export default api
