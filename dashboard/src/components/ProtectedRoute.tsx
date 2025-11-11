import React from 'react'
import { isAuthenticated, isDemoMode, setDemoMode } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactElement
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // If user is authenticated, show real data
  if (isAuthenticated()) {
    return children
  }
  
  // If not authenticated, enable demo mode by default and allow access
  // This allows users to see the dashboard in demo mode without logging in
  if (!isDemoMode()) {
    setDemoMode()
  }
  
  return children
}

export default ProtectedRoute

