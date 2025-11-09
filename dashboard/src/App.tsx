import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Violations from './pages/Violations'
import Logs from './pages/Logs'
import Policies from './pages/Policies'

function App() {
  return (
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
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

