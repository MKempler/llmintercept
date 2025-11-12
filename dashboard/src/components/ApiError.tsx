import React from 'react'
import { FiWifiOff, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'

interface ApiErrorProps {
  message?: string
  onRetry?: () => void
  title?: string
}

export default function ApiError({ 
  message = 'Unable to connect to the server', 
  onRetry,
  title = 'Connection Error'
}: ApiErrorProps) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      maxWidth: '500px',
      margin: '0 auto'
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
          color: 'var(--error)'
        }}>
          <FiWifiOff size={40} />
        </div>
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '12px'
      }}>
        {title}
      </h2>

      {/* Message */}
      <p style={{
        fontSize: '1rem',
        color: 'var(--text-muted)',
        marginBottom: '24px',
        lineHeight: 1.6
      }}>
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
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
          Try Again
        </button>
      )}

      {/* Help Text */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: 'var(--gray-light)',
        borderRadius: '8px',
        fontSize: '14px',
        color: 'var(--text-muted)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <FiAlertCircle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
              Troubleshooting Tips
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
              <li>Check your internet connection</li>
              <li>Verify the gateway server is running</li>
              <li>Check browser console for detailed errors</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

