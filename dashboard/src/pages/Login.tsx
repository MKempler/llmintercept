import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { getApiUrl } from '../utils/api'
import { setToken, setRefreshToken, setUser, type User } from '../utils/auth'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = getApiUrl()
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password
      })

      const { access_token, refresh_token, user } = response.data

      // Store tokens and user info
      setToken(access_token)
      setRefreshToken(refresh_token)
      setUser(user as User)

      // Redirect to dashboard
      navigate('/')
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.detail || 
        'Login failed. Please check your credentials.'
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
          <h1>Sign in to your account</h1>
          <p>Welcome back! Please enter your credentials</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot password?
          </Link>
          <p className="contact-support">
            Need an account? <a href="mailto:support@aifirewall.com">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
