import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import PublicDemoRoute from './components/PublicDemoRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import DashboardPreview from './pages/DashboardPreview'
import Violations from './pages/Violations'
import Logs from './pages/Logs'
import Policies from './pages/Policies'
import Patterns from './pages/Patterns'
import Webhooks from './pages/Webhooks'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { setDemoMode, isAuthenticated } from './utils/auth'

// Component to auto-enable demo mode when not authenticated
function AutoDemoMode() {
  useEffect(() => {
    // If user is not authenticated, enable demo mode by default
    if (!isAuthenticated()) {
      setDemoMode()
    }
  }, [])
  return null
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AutoDemoMode />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Public preview route for iframe embedding - no navbar, auto-enables demo mode */}
          <Route 
            path="/preview" 
            element={
              <PublicDemoRoute>
                <DashboardPreview />
              </PublicDemoRoute>
            } 
          />
          <Route
            path="/*"
            element={
              <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
                <Navbar />
                <main style={{ 
                  maxWidth: '1280px', 
                  margin: '0 auto', 
                  paddingTop: '80px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingBottom: '48px'
                }}>
                      <Routes>
                        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/violations" element={<ProtectedRoute><Violations /></ProtectedRoute>} />
                        <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
                        <Route path="/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
                        <Route path="/patterns" element={<ProtectedRoute><Patterns /></ProtectedRoute>} />
                        <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App

