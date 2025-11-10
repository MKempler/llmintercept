import { Link } from 'react-router-dom'
import { FiHome, FiArrowLeft, FiAlertCircle, FiShield } from 'react-icons/fi'

export default function NotFound() {
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
        {/* Animated 404 */}
        <div style={{
          fontSize: '120px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '24px',
          lineHeight: 1,
          animation: 'fadeIn 0.6s ease-out'
        }}>
          404
        </div>

        {/* Icon */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            animation: 'fadeIn 0.8s ease-out'
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
          animation: 'fadeIn 1s ease-out'
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--gray)',
          marginBottom: '32px',
          lineHeight: 1.6,
          animation: 'fadeIn 1.2s ease-out'
        }}>
          The page you're looking for doesn't exist or has been moved. 
          Don't worry, we'll help you get back on track.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          animation: 'fadeIn 1.4s ease-out'
        }}>
          <Link
            to="/"
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
              textDecoration: 'none',
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
            <FiHome size={18} />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
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
              cursor: 'pointer',
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
            <FiArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div style={{
          marginTop: '48px',
          paddingTop: '32px',
          borderTop: '1px solid var(--gray-border)',
          animation: 'fadeIn 1.6s ease-out'
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--gray)',
            marginBottom: '16px',
            fontWeight: 500
          }}>
            Quick Links
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {[
              { path: '/', label: 'Dashboard', icon: FiShield },
              { path: '/violations', label: 'Violations', icon: FiAlertCircle },
              { path: '/logs', label: 'Logs', icon: FiAlertCircle },
              { path: '/policies', label: 'Policies', icon: FiShield }
            ].map(link => {
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'var(--gray-light)',
                    color: 'var(--dark)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary)'
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--gray-light)'
                    e.currentTarget.style.color = 'var(--dark)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </div>
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

