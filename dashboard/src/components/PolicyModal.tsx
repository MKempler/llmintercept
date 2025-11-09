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
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--dark)' }}>
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
              justifyContent: 'center'
            }}
          >
            <FiX size={24} />
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--dark)' }}>
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
                padding: '10px 12px',
                border: '1px solid var(--gray-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--dark)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this policy does..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--gray-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--dark)' }}>
              Violation Types <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'secret', label: 'Secrets', description: 'API keys, passwords, tokens' },
                { value: 'pii', label: 'PII', description: 'Emails, SSNs, phone numbers' },
                { value: 'prompt_injection', label: 'Prompt Injection', description: 'Jailbreak attempts' }
              ].map(type => (
                <label
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid var(--gray-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: violationTypes.includes(type.value) ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={violationTypes.includes(type.value)}
                    onChange={() => handleViolationTypeToggle(type.value)}
                    style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--dark)' }}>{type.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--dark)' }}>
              Action <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { value: 'block', label: 'Block', description: 'Prevent request' },
                { value: 'redact', label: 'Redact', description: 'Remove sensitive data' },
                { value: 'warn', label: 'Warn', description: 'Log but allow' },
                { value: 'allow', label: 'Allow', description: 'No action' }
              ].map(actionOption => (
                <label
                  key={actionOption.value}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px',
                    border: `2px solid ${action === actionOption.value ? getActionColor(actionOption.value) : 'var(--gray-border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: action === actionOption.value ? `${getActionColor(actionOption.value)}15` : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="action"
                    value={actionOption.value}
                    checked={action === actionOption.value}
                    onChange={(e) => setAction(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ color: getActionColor(actionOption.value), marginBottom: '8px' }}>
                    {getActionIcon(actionOption.value)}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
                    {actionOption.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', textAlign: 'center' }}>
                    {actionOption.description}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 500, color: 'var(--dark)' }}>Enabled</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--dark)' }}>
                Priority
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                min="0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid var(--gray-border)',
                borderRadius: '8px',
                background: 'white',
                color: 'var(--dark)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? 'var(--gray)' : 'var(--primary)',
                color: 'white',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
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

