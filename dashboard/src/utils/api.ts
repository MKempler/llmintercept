import axios from 'axios'

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

// Get API key from environment variable
function getApiKey(): string {
  return (import.meta as any).env?.VITE_FIREWALL_API_KEY || ''
}

// Create axios instance with authentication headers
export const apiClient = axios.create({
  headers: {
    'Authorization': `Bearer ${getApiKey()}`
  }
})

// Set base URL for all requests
apiClient.defaults.baseURL = getApiUrl()

// Add request interceptor to ensure API key is always included
apiClient.interceptors.request.use((config) => {
  const apiKey = getApiKey()
  if (apiKey) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${apiKey}`
  }
  return config
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed. Please check your API key.')
      // Could redirect to login or show error message
    }
    return Promise.reject(error)
  }
)

