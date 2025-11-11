import { useState } from 'react'
import { apiClient } from '../utils/api'

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong', score: number } => {
    if (password.length === 0) return { strength: 'weak', score: 0 }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 2) return { strength: 'weak', score }
    if (score <= 4) return { strength: 'medium', score }
    return { strength: 'strong', score }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)

    try {
      await apiClient.post('/api/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      })

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to change password. Please check your current password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--gray-border)',
        borderRadius: '8px',
        padding: '24px'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
        Change Password
      </h3>

      {success && (
        <div
          style={{
            padding: '12px',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          Password changed successfully!
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fee',
            color: '#c33',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="current-password"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--dark)'
            }}
          >
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--gray-border)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="new-password"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--dark)'
            }}
          >
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--gray-border)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
          {newPassword && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background:
                        passwordStrength.strength === 'weak' && i === 1
                          ? '#dc2626'
                          : passwordStrength.strength === 'medium' && i <= 2
                          ? '#f59e0b'
                          : passwordStrength.strength === 'strong' && i <= 3
                          ? '#10b981'
                          : 'var(--gray-border)'
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color:
                    passwordStrength.strength === 'weak'
                      ? '#dc2626'
                      : passwordStrength.strength === 'medium'
                      ? '#f59e0b'
                      : '#10b981'
                }}
              >
                {passwordStrength.strength === 'weak'
                  ? 'Weak'
                  : passwordStrength.strength === 'medium'
                  ? 'Medium'
                  : 'Strong'}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="confirm-password"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--dark)'
            }}
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
            style={{
              width: '100%',
              padding: '10px',
              border:
                confirmPassword && newPassword !== confirmPassword
                  ? '1px solid #dc2626'
                  : '1px solid var(--gray-border)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
              Passwords do not match
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor:
              loading || !currentPassword || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity:
              loading || !currentPassword || !newPassword || !confirmPassword ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading && currentPassword && newPassword && confirmPassword) {
              e.currentTarget.style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && currentPassword && newPassword && confirmPassword) {
              e.currentTarget.style.opacity = '1'
            }
          }}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

export default ChangePasswordForm

