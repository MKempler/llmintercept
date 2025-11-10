import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import './Login.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const apiUrl = getApiUrl()
      await axios.post(`${apiUrl}/api/auth/reset-password`, {
        token,
        new_password: password
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.detail || 
        'Failed to reset password. The link may have expired. Please request a new one.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token && !error) {
    return null // Still loading
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img 
              src="/logo.png" 
              alt="LLM Intercept Logo" 
              className="login-logo-img"
            />
            <div className="login-logo-text">
              <span className="login-logo-primary">LLM</span>
              <span className="login-logo-secondary">Intercept</span>
            </div>
          </div>
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success ? (
          <div className="success-message">
            <p>Password reset successfully!</p>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#718096' }}>
              Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Enter new password"
                minLength={8}
              />
              <small>Must be at least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm new password"
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading || !token}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <Link to="/login" className="forgot-password-link">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
