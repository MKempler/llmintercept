import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getApiUrl } from '../utils/api'

const API_URL = getApiUrl()

function Policies() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/policies`)
      setPolicies(res.data.policies || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching policies:', error)
      setLoading(false)
    }
  }

  const getPolicyIcon = (action: string) => {
    const icons: Record<string, string> = {
      block: '🚫',
      redact: '✂️',
      warn: '⚠️',
      allow: '✅'
    }
    return icons[action.toLowerCase()] || '⚙️'
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      block: 'var(--error)',
      redact: 'var(--warning)',
      warn: 'var(--warning)',
      allow: 'var(--success)'
    }
    return colors[action.toLowerCase()] || 'var(--primary)'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Security Policies</h1>
        <p className="page-subtitle">Manage firewall rules and security policies</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => {
          const actionColor = getActionColor(policy.action)
          return (
            <div key={policy.id} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: `${actionColor}15`,
                      color: actionColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}
                  >
                    {getPolicyIcon(policy.action)}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--dark)' }}>
                    {policy.name}
                  </h3>
                </div>
                <Badge variant={policy.enabled ? 'success' : 'gray'}>
                  {policy.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-border)' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Action:
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <Badge 
                      variant={policy.action === 'block' ? 'error' : policy.action === 'redact' ? 'warning' : 'info'}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {policy.action}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Violation Types:
                  </span>
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {policy.violation_types.map((type: string) => (
                      <Badge key={type} variant="info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {policies.length === 0 && (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            <div className="empty-state-title">No policies configured</div>
            <div className="empty-state-text">Policies will appear here once they're set up</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Policies

