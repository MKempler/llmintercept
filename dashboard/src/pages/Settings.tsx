import { useState, useEffect } from 'react'
import { apiClient } from '../utils/api'
import { getUser, refreshUser, type User } from '../utils/auth'
import ApiKeyDisplay from '../components/ApiKeyDisplay'
import ChangePasswordForm from '../components/ChangePasswordForm'
import Badge from '../components/Badge'
import { getApiUrl } from '../utils/api'

function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState('')
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const currentUser = getUser()
      if (currentUser) {
        setUser(currentUser)
        setCompany(currentUser.company || '')
      }
      // Refresh from server to get latest data
      const refreshed = await refreshUser()
      if (refreshed) {
        setUser(refreshed)
        setCompany(refreshed.company || '')
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySave = async () => {
    setSavingCompany(true)
    setCompanyError(null)

    try {
      const response = await apiClient.patch('/api/auth/me', { company })
      const updatedUser = response.data.user as User
      setUser(updatedUser)
      // Update localStorage
      const currentUser = getUser()
      if (currentUser) {
        currentUser.company = updatedUser.company
        // Import setUser dynamically to avoid circular dependency
        const { setUser: updateUser } = await import('../utils/auth')
        updateUser(currentUser)
      }
    } catch (err: any) {
      setCompanyError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to update company name'
      )
    } finally {
      setSavingCompany(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray)' }}>
        Loading settings...
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray)' }}>
        Unable to load user data. Please try refreshing the page.
      </div>
    )
  }

  const gatewayUrl = getApiUrl()

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and API configuration</p>
      </div>

      {/* API Key Section */}
      <div style={{ marginBottom: '32px' }}>
        <ApiKeyDisplay
          onRegenerate={async () => {
            // Refresh user data after API key regeneration
            await loadUserData()
          }}
        />
      </div>

      {/* Account Information Section */}
      <div
        style={{
          background: 'var(--dark-surface)',
          border: '1px solid var(--gray-border)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px'
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
          Account Information
        </h3>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'var(--gray-light)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed'
              }}
            />
            <small style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px', display: 'block' }}>
              Email cannot be changed
            </small>
          </div>

          <div>
            <label
              htmlFor="company-name"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}
            >
              Company Name
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                id="company-name"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCompanySave()
                  }
                }}
              />
              <button
                onClick={handleCompanySave}
                disabled={savingCompany || company === (user.company || '')}
                style={{
                  padding: '10px 20px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: savingCompany || company === (user.company || '') ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: savingCompany || company === (user.company || '') ? 0.5 : 1,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!savingCompany && company !== (user.company || '')) {
                    e.currentTarget.style.opacity = '0.9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingCompany && company !== (user.company || '')) {
                    e.currentTarget.style.opacity = '1'
                  }
                }}
              >
                {savingCompany ? 'Saving...' : 'Save'}
              </button>
            </div>
            {companyError && (
              <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                {companyError}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-muted)'
                }}
              >
                Account Status
              </label>
              <div>
                <Badge variant={user.status === 'active' ? 'success' : 'gray'}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-muted)'
                }}
              >
                Account Created
              </label>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-muted)'
                }}
              >
                Last Login
              </label>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div style={{ marginBottom: '32px' }}>
        <ChangePasswordForm />
      </div>

      {/* Integration Guides Section */}
      <div
        style={{
          background: 'var(--dark-surface)',
          border: '1px solid var(--gray-border)',
          borderRadius: '8px',
          padding: '24px'
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
          Integration Guides
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <a
            href="https://github.com/MKempler/llmintercept/blob/main/docs/SDK_QUICKSTART.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '20px',
              border: '1px solid var(--gray-border)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
              SDK Quick Start
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray)' }}>
              Get started with the Python SDK in minutes. Drop-in replacement for OpenAI, Anthropic, and Google clients.
            </p>
          </a>

          <a
            href="https://github.com/MKempler/llmintercept/blob/main/docs/GATEWAY_INTEGRATION.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '20px',
              border: '1px solid var(--gray-border)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
              Gateway Integration
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray)' }}>
              Route your LLM API calls through our gateway proxy. Works with any HTTP client or language.
            </p>
          </a>

          <a
            href="https://github.com/MKempler/llmintercept/blob/main/browser-extension/INSTALLATION.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '20px',
              border: '1px solid var(--gray-border)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
              Browser Extension
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray)' }}>
              Protect employees using ChatGPT, Claude, and Gemini web interfaces. No code changes needed.
            </p>
          </a>

          <a
            href="https://github.com/MKempler/llmintercept/blob/main/docs/CUSTOMER_ONBOARDING.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '20px',
              border: '1px solid var(--gray-border)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              display: 'block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
              Full Documentation
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray)' }}>
              Complete onboarding guide with all integration options, examples, and troubleshooting.
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Settings

