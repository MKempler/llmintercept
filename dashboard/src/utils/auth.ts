// Auth utilities for JWT token management
const TOKEN_KEY = 'aifirewall_access_token'
const REFRESH_TOKEN_KEY = 'aifirewall_refresh_token'
const USER_KEY = 'aifirewall_user'

export interface User {
  id: string
  email: string
  company?: string
  status: string
  email_verified: boolean
  created_at?: string
  last_login?: string
  api_key?: string  // Added for settings page
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  // Also clear demo mode when logging in
  clearDemoMode()
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// Demo mode utilities
const DEMO_MODE_KEY = 'aifirewall_demo_mode'

export function setDemoMode(): void {
  localStorage.setItem(DEMO_MODE_KEY, 'true')
}

export function isDemoMode(): boolean {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true'
}

export function clearDemoMode(): void {
  localStorage.removeItem(DEMO_MODE_KEY)
}

// API key utilities
export async function getUserApiKey(): Promise<string | null> {
  const { apiClient } = await import('./api')
  try {
    const response = await apiClient.get('/api/auth/me/api-key')
    return response.data.api_key || null
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return null
  }
}

// Refresh user data from server
export async function refreshUser(): Promise<User | null> {
  const { apiClient } = await import('./api')
  try {
    const response = await apiClient.get('/api/auth/me')
    const user = response.data.user as User
    setUser(user)
    return user
  } catch (error) {
    console.error('Failed to refresh user data:', error)
    return null
  }
}
