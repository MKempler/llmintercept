import axios from 'axios'
import { getToken, clearAuth } from './auth'

// Utility to get API URL with proper protocol
export function getApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL || ''
  const defaultUrl = 'http://localhost:8000'
  
  // If no env URL, use default
  if (!envUrl) {
    return defaultUrl
  }
  
  // If already has protocol, use as-is
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl
  }
  
  // If missing protocol, assume https for production
  // (Railway URLs are always https)
  return `https://${envUrl}`
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: getApiUrl()
})

// Add request interceptor to include JWT token
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      clearAuth()
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

