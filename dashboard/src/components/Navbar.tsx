import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Check if demo mode is active
    fetch(`${API_URL}/api/demo-mode`)
      .then(res => res.json())
      .then(data => setDemoMode(data.demo_mode || false))
      .catch(() => setDemoMode(false))
  }, [])

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const navLinkClass = (path: string) => {
    const baseClass = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
    if (isActive(path)) {
      return `${baseClass} border-blue-600 text-gray-900`
    }
    return `${baseClass} border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`
  }

  return (
    <nav 
      className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: scrolled ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderBottom: '1px solid var(--gray-border)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--dark)', letterSpacing: '-0.02em' }}>
                <span style={{ color: 'var(--primary)' }}>LLM</span> Intercept
              </h1>
              {demoMode && (
                <span 
                  style={{
                    marginLeft: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'var(--gray-light)',
                    color: 'var(--gray)',
                    border: '1px solid var(--gray-border)'
                  }}
                >
                  Demo Mode
                </span>
              )}
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              <a
                href="https://llmintercept.com"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                style={{ marginLeft: '24px' }}
              >
                ← Back to Demo
              </a>
              <Link
                to="/"
                className={navLinkClass('/')}
                style={{ marginLeft: '8px' }}
              >
                Dashboard
              </Link>
              <Link
                to="/violations"
                className={navLinkClass('/violations')}
                style={{ marginLeft: '8px' }}
              >
                Violations
              </Link>
              <Link
                to="/logs"
                className={navLinkClass('/logs')}
                style={{ marginLeft: '8px' }}
              >
                Logs
              </Link>
              <Link
                to="/policies"
                className={navLinkClass('/policies')}
                style={{ marginLeft: '8px' }}
              >
                Policies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

