import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Violations from './pages/Violations'
import Logs from './pages/Logs'
import Policies from './pages/Policies'
import Patterns from './pages/Patterns'
import Webhooks from './pages/Webhooks'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <div style={{ minHeight: '100vh', background: 'var(--gray-light)' }}>
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

