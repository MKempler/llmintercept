import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import './Login.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const apiUrl = getApiUrl()
      const response = await axios.post(`${apiUrl}/api/auth/forgot-password`, {
        email
      })

      setSuccess(true)
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.detail || 
        'Failed to send reset email. Please try again.'
      )
    } finally {
      setLoading(false)
    }
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
          <p>Enter your email address and we'll send you a reset link</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success ? (
          <div className="success-message">
            <p>If an account exists with this email, a password reset link has been sent.</p>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#718096' }}>
              Please check your email and click the reset link. If you don't receive an email, please contact support.
            </p>
            <div style={{ marginTop: '24px' }}>
              <Link to="/login" className="forgot-password-link">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@email.com"
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword
