import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%'
          }}>
            {/* Error Icon */}
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--error)',
                animation: 'fadeIn 0.6s ease-out'
              }}>
                <FiAlertCircle size={40} />
              </div>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--dark)',
              marginBottom: '12px',
              animation: 'fadeIn 0.8s ease-out'
            }}>
              Something Went Wrong
            </h1>

            {/* Description */}
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--gray)',
              marginBottom: '24px',
              lineHeight: 1.6,
              animation: 'fadeIn 1s ease-out'
            }}>
              We encountered an unexpected error. Don't worry, your data is safe. 
              Try refreshing the page or navigating back to the dashboard.
            </p>

            {/* Error Details (dev only) */}
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div style={{
                padding: '16px',
                marginBottom: '24px',
                background: 'var(--gray-light)',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '13px',
                color: 'var(--error)',
                fontFamily: 'monospace',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'fadeIn 1.2s ease-out'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-dark)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <FiRefreshCw size={18} />
                Refresh Page
              </button>
              
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'var(--white)',
                  color: 'var(--dark)',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--gray-light)'
                  e.currentTarget.style.borderColor = 'var(--gray)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--white)'
                  e.currentTarget.style.borderColor = 'var(--gray-border)'
                }}
              >
                <FiHome size={18} />
                Go to Dashboard
              </Link>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

