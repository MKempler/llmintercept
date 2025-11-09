import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getApiUrl } from '../utils/api'

const API_URL = getApiUrl()

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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav 
      className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: scrolled ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              onClick={handleLogoClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'transparent',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="LLM Intercept Logo" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span
                  style={{
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, #60a5fa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}
                >
                  LLM
                </span>
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: 'var(--dark)',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}
                >
                  Intercept
                </span>
              </div>
            </a>
            
            {/* Demo Mode Badge - Only show if active */}
            {demoMode && (
              <span 
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'var(--gray-light)',
                  color: 'var(--gray)',
                  border: '1px solid var(--gray-border)'
                }}
              >
                Demo
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/') ? 'var(--primary)' : 'var(--gray)',
                borderBottom: isActive('/') ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                fontWeight: isActive('/') ? 600 : 500
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/violations"
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/violations') ? 'var(--primary)' : 'var(--gray)',
                borderBottom: isActive('/violations') ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                fontWeight: isActive('/violations') ? 600 : 500
              }}
            >
              Violations
            </Link>
            <Link
              to="/logs"
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/logs') ? 'var(--primary)' : 'var(--gray)',
                borderBottom: isActive('/logs') ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                fontWeight: isActive('/logs') ? 600 : 500
              }}
            >
              Logs
            </Link>
            <Link
              to="/policies"
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/policies') ? 'var(--primary)' : 'var(--gray)',
                borderBottom: isActive('/policies') ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                fontWeight: isActive('/policies') ? 600 : 500
              }}
            >
              Policies
            </Link>
          </div>

          {/* Back to Demo Link - Subtle, Right Side */}
          <div className="hidden lg:flex items-center">
            <a
              href="https://llmintercept.com"
              className="inline-flex items-center px-3 py-2 text-xs font-medium transition-colors duration-200"
              style={{
                color: 'var(--gray)',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--gray)'
              }}
            >
              ← Demo Site
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

