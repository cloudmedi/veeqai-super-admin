import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Don't auto-logout on 401 - let AuthService handle refresh token logic
    
    // Handle 403 errors (forbidden)
    if (error.response?.status === 403) {
      // Access forbidden - insufficient permissions
    }
    
    return Promise.reject(error)
  }
)

export default api