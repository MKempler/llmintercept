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

  const navLinkClass = (path: string) => {
    const baseClass = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
    if (isActive(path)) {
      return `${baseClass} border-blue-600 text-gray-900`
    }
    return `${baseClass} border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a 
                href="#" 
                onClick={handleLogoClick}
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--dark)',
                  letterSpacing: '-0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
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
                    width: '60px',
                    height: '60px',
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

