import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getApiUrl } from '../utils/api'
import { getUser, clearAuth, isDemoMode } from '../utils/auth'
import type { User } from '../utils/auth'

const API_URL = getApiUrl()

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Check if demo mode is active (from localStorage)
    const inDemoMode = isDemoMode()
    setDemoMode(inDemoMode)
    
    // Also check backend demo mode (for server-side demo mode)
    fetch(`${API_URL}/api/demo-mode`)
      .then(res => res.json())
      .then(data => {
        // Show demo badge if either client-side or server-side demo mode
        if (inDemoMode || data.demo_mode) {
          setDemoMode(true)
        }
      })
      .catch(() => {})
    
    // Get current user (only if not in demo mode)
    if (!inDemoMode) {
      setUser(getUser())
    }
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

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
        <div className="flex justify-between items-center h-20 relative">
          {/* Logo Section */}
          <div className="flex items-center gap-6 flex-shrink-0">
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

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
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
            <Link
              to="/patterns"
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/patterns') ? 'var(--primary)' : 'var(--gray)',
                borderBottom: isActive('/patterns') ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                fontWeight: isActive('/patterns') ? 600 : 500
              }}
            >
              Patterns
            </Link>
            <Link
              to="/webhooks"
              className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive('/webhooks') ? 'var(--primary)' : 'var(--gray)',
                borderBottom: isActive('/webhooks') ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                fontWeight: isActive('/webhooks') ? 600 : 500
              }}
            >
              Webhooks
            </Link>
          </div>

          {/* User Menu - Right Side */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {demoMode && !user && (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
                style={{
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--primary)'
                }}
              >
                Sign In
              </Link>
            )}
            
            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-border)',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--dark)', fontWeight: 500 }}>
                    {user.email}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      background: 'white',
                      border: '1px solid var(--gray-border)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      minWidth: '200px',
                      zIndex: 1000
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-border)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
                        {user.email}
                      </div>
                      {user.company && (
                        <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                          {user.company}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '8px' }}>
                      <a
                        href="mailto:support@aifirewall.com"
                        style={{
                          display: 'block',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: 'var(--dark)',
                          textDecoration: 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--gray-light)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        Contact Support
                      </a>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#c53030',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          marginTop: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fed7d7'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Back to Demo Link */}
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
      </div>
      
      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  )
}
