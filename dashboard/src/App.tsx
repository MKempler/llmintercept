import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Violations from './pages/Violations'
import Logs from './pages/Logs'
import Policies from './pages/Policies'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ErrorBoundary>
      <Router>
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/violations" element={<Violations />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App

