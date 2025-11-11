import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, isDemoMode } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactElement
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Allow access if authenticated OR in demo mode
  if (!isAuthenticated() && !isDemoMode()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default ProtectedRoute

