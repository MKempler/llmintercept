import { useState, useEffect } from 'react'
import { FiX, FiShield, FiAlertCircle, FiScissors, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (policy: any) => Promise<void>
  policy?: any | null
}

export default function PolicyModal({ isOpen, onClose, onSave, policy }: PolicyModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [violationTypes, setViolationTypes] = useState<string[]>([])
  const [action, setAction] = useState('block')
  const [enabled, setEnabled] = useState(true)
  const [priority, setPriority] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (policy) {
      setName(policy.name || '')
      setDescription(policy.description || '')
      setViolationTypes(policy.violation_types || [])
      setAction(policy.action || 'block')
      setEnabled(policy.enabled !== undefined ? policy.enabled : true)
      setPriority(policy.priority || 0)
    } else {
      // Reset form for new policy
      setName('')
      setDescription('')
      setViolationTypes([])
      setAction('block')
      setEnabled(true)
      setPriority(0)
    }
    setError(null)
  }, [policy, isOpen])

  const handleViolationTypeToggle = (type: string) => {
    setViolationTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Policy name is required')
      return
    }

    if (violationTypes.length === 0) {
      setError('At least one violation type must be selected')
      return
    }

    setLoading(true)
    try {
      await onSave({
        id: policy?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        violation_types: violationTypes,
        action,
        enabled,
        priority: parseInt(priority.toString()) || 0
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save policy')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'block':
        return <FiShield size={20} />
      case 'redact':
        return <FiScissors size={20} />
      case 'warn':
        return <FiAlertTriangle size={20} />
      case 'allow':
        return <FiCheckCircle size={20} />
      default:
        return <FiAlertCircle size={20} />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'block':
        return 'var(--error)'
      case 'redact':
        return 'var(--warning)'
      case 'warn':
        return 'var(--warning)'
      case 'allow':
        return 'var(--success)'
      default:
        return 'var(--primary)'
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--gray-border)' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--dark)', margin: 0 }}>
            {policy ? 'Edit Policy' : 'Create Policy'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-light)'
              e.currentTarget.style.color = 'var(--dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--gray)'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: 'var(--error-light)',
            color: 'var(--error)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiAlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>
              Policy Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Block Credit Cards"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--gray-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: 'var(--white)',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--gray-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this policy does..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--gray-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: 'var(--white)',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--gray-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>
              Violation Types <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { value: 'secret', label: 'Secrets', description: 'API keys, passwords, tokens' },
                { value: 'pii', label: 'PII', description: 'Emails, SSNs, phone numbers' },
                { value: 'prompt_injection', label: 'Prompt Injection', description: 'Jailbreak attempts' }
              ].map(type => {
                const isSelected = violationTypes.includes(type.value)
                return (
                  <label
                    key={type.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 16px',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--gray-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--white)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--primary-light)'
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.02)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--gray-border)'
                        e.currentTarget.style.backgroundColor = 'var(--white)'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleViolationTypeToggle(type.value)}
                      style={{ 
                        marginRight: '14px', 
                        width: '20px', 
                        height: '20px', 
                        cursor: 'pointer',
                        accentColor: 'var(--primary)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px', marginBottom: '2px' }}>{type.label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--gray)' }}>{type.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>
              Action <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { value: 'block', label: 'Block', description: 'Prevent request' },
                { value: 'redact', label: 'Redact', description: 'Remove sensitive data' },
                { value: 'warn', label: 'Warn', description: 'Log but allow' },
                { value: 'allow', label: 'Allow', description: 'No action' }
              ].map(actionOption => {
                const isSelected = action === actionOption.value
                const actionColor = getActionColor(actionOption.value)
                return (
                  <label
                    key={actionOption.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px 16px',
                      border: `2px solid ${isSelected ? actionColor : 'var(--gray-border)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? `${actionColor}15` : 'var(--white)',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = actionColor
                        e.currentTarget.style.backgroundColor = `${actionColor}08`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--gray-border)'
                        e.currentTarget.style.backgroundColor = 'var(--white)'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="action"
                      value={actionOption.value}
                      checked={isSelected}
                      onChange={(e) => setAction(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ 
                      color: actionColor, 
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: `${actionColor}15`
                    }}>
                      {getActionIcon(actionOption.value)}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px', fontSize: '15px' }}>
                      {actionOption.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)', textAlign: 'center', lineHeight: '1.4' }}>
                      {actionOption.description}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--gray-light)', 
              borderRadius: '8px',
              border: '1px solid var(--gray-border)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    cursor: 'pointer',
                    accentColor: 'var(--primary)'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>Enabled</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>Policy is active</div>
                </div>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--dark)', fontSize: '14px' }}>
                Priority
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min="0"
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--white)',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end', 
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--gray-border)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid var(--gray-border)',
                borderRadius: '8px',
                background: 'var(--white)',
                color: 'var(--dark)',
                fontWeight: 600,
                fontSize: '14px',
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? 'var(--gray)' : 'var(--primary)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--primary-dark)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--primary)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }
              }}
            >
              {loading ? 'Saving...' : policy ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

