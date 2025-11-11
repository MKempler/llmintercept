import { useState, useEffect } from 'react'
import { apiClient } from '../utils/api'
import { getUserApiKey } from '../utils/auth'
import { getApiUrl } from '../utils/api'
import { CheckIcon, CopyIcon, AlertIcon } from './Icons'

interface ApiKeyDisplayProps {
  onRegenerate?: (newKey: string) => void
}

function ApiKeyDisplay({ onRegenerate }: ApiKeyDisplayProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [password, setPassword] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKey()
  }, [])

  const fetchApiKey = async () => {
    setLoading(true)
    setError(null)
    try {
      const key = await getUserApiKey()
      setApiKey(key)
    } catch (err: any) {
      setError('Failed to load API key')
      console.error('Error fetching API key:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!apiKey) return
    
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback: select text
      const textArea = document.createElement('textarea')
      textArea.value = apiKey
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (!password) {
      setError('Please enter your password')
      return
    }

    setRegenerating(true)
    setError(null)

    try {
      const response = await apiClient.post('/api/auth/me/api-key', { password })
      const newKey = response.data.api_key
      setApiKey(newKey)
      setPassword('')
      setShowRegenerateModal(false)
      if (onRegenerate) {
        onRegenerate(newKey)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to regenerate API key. Please check your password.'
      )
    } finally {
      setRegenerating(false)
    }
  }

  const gatewayUrl = getApiUrl()

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray)' }}>
        Loading API key...
      </div>
    )
  }

  if (error && !apiKey) {
    return (
      <div style={{ padding: '24px', background: '#fee', borderRadius: '8px', color: '#c33' }}>
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* API Key Display */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-border)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
            Your API Key
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray)' }}>
            Use this key to identify your requests. Keep it secure and never share it publicly.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--gray-light)',
            borderRadius: '6px',
            border: '1px solid var(--gray-border)',
            marginBottom: '16px'
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'var(--dark)',
              wordBreak: 'break-all',
              padding: '0'
            }}
          >
            {apiKey || 'Not available'}
          </code>
          <button
            onClick={handleCopy}
            disabled={!apiKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: copied ? 'var(--success)' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: apiKey ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: apiKey ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (apiKey) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (apiKey) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            {copied ? (
              <>
                <CheckIcon size={16} />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon size={16} />
                Copy
              </>
            )}
          </button>
        </div>

        <button
          onClick={() => setShowRegenerateModal(true)}
          style={{
            padding: '8px 16px',
            background: 'white',
            color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fee'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
          }}
        >
          <AlertIcon size={16} />
          Regenerate API Key
        </button>
      </div>

      {/* Usage Instructions */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--gray-border)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
          How to Use Your API Key
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
            Python SDK (Recommended)
          </h4>
          <pre
            style={{
              background: 'var(--gray-light)',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '13px',
              fontFamily: 'monospace',
              border: '1px solid var(--gray-border)',
              margin: 0
            }}
          >
{`from aifirewall import OpenAI

client = OpenAI(
    api_key="your-openai-key",
    firewall_url="${gatewayUrl}",
    firewall_api_key="${apiKey || 'fw_live_...'}"  # Your key here
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
          </pre>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
            Gateway Proxy (HTTP Header)
          </h4>
          <pre
            style={{
              background: 'var(--gray-light)',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '13px',
              fontFamily: 'monospace',
              border: '1px solid var(--gray-border)',
              margin: 0
            }}
          >
{`curl -X POST ${gatewayUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'fw_live_...'}" \\
  -H "Authorization: Bearer your-openai-key" \\
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello!"}]}'`}
          </pre>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--gray-border)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
            Documentation Links
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <a
              href="https://github.com/MKempler/llmintercept/blob/main/docs/SDK_QUICKSTART.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              SDK Quick Start
            </a>
            <a
              href="https://github.com/MKempler/llmintercept/blob/main/docs/GATEWAY_INTEGRATION.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                background: 'white',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gray-light)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              Gateway Integration
            </a>
            <a
              href="https://github.com/MKempler/llmintercept/blob/main/browser-extension/INSTALLATION.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                background: 'white',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gray-light)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              Browser Extension
            </a>
            <a
              href="https://github.com/MKempler/llmintercept/blob/main/docs/CUSTOMER_ONBOARDING.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                background: 'white',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gray-light)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
              }}
            >
              Full Documentation
            </a>
          </div>
        </div>
      </div>

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            if (!regenerating) {
              setShowRegenerateModal(false)
              setPassword('')
              setError(null)
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: 'var(--dark)' }}>
              Regenerate API Key
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--gray)' }}>
              Warning: Regenerating your API key will invalidate your current key. Any applications using the old key will stop working. You'll need to update all integrations with the new key.
            </p>

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

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="regenerate-password"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--dark)'
                }}
              >
                Enter your password to confirm:
              </label>
              <input
                id="regenerate-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={regenerating}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && password && !regenerating) {
                    handleRegenerate()
                  }
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRegenerateModal(false)
                  setPassword('')
                  setError(null)
                }}
                disabled={regenerating}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: 'var(--gray)',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '6px',
                  cursor: regenerating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: regenerating ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={!password || regenerating}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: password && !regenerating ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: password && !regenerating ? 1 : 0.5
                }}
              >
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiKeyDisplay

