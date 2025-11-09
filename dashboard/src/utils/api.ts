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

