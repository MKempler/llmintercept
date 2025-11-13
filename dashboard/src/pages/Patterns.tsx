import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import Table from '../components/Table'
import { apiClient } from '../utils/api'
import { 
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiCode,
  FiShield
} from 'react-icons/fi'

interface Pattern {
  id: string
  name: string
  pattern: string
  violation_type: string
  description?: string
  enabled: boolean
  tenant_id?: string
  created_at?: string
  updated_at?: string
}

function Patterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null)
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testPattern, setTestPattern] = useState('')
  const [testText, setTestText] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    fetchPatterns()
  }, [])

  const fetchPatterns = async () => {
    try {
      const res = await apiClient.get('/api/patterns')
      setPatterns(res.data.patterns || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching patterns:', error)
      setLoading(false)
    }
  }

  const handleCreatePattern = () => {
    setEditingPattern(null)
    setModalOpen(true)
  }

  const handleEditPattern = (pattern: Pattern) => {
    setEditingPattern(pattern)
    setModalOpen(true)
  }

  const handleSavePattern = async (patternData: any) => {
    try {
      if (patternData.id) {
        await apiClient.put(`/api/patterns/${patternData.id}`, patternData)
      } else {
        await apiClient.post('/api/patterns', patternData)
      }
      await fetchPatterns()
      setModalOpen(false)
    } catch (error: any) {
      throw error
    }
  }

  const handleDeletePattern = async (patternId: string) => {
    if (!confirm('Are you sure you want to delete this pattern? This action cannot be undone.')) {
      return
    }
    
    try {
      await apiClient.delete(`/api/patterns/${patternId}`)
      await fetchPatterns()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete pattern')
    }
  }

  const handleToggleEnabled = async (patternId: string, currentEnabled: boolean) => {
    try {
      await apiClient.put(`/api/patterns/${patternId}`, {
        enabled: !currentEnabled
      })
      await fetchPatterns()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update pattern')
    }
  }

  const testPatternRegex = (pattern: string, text: string) => {
    try {
      const regex = new RegExp(pattern, 'gi')
      const matches: any[] = []
      let match
      
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length
        })
      }
      
      return matches
    } catch (error: any) {
      return [{ error: error.message }]
    }
  }

  const handleTestPattern = (pattern: Pattern) => {
    setTestPattern(pattern.pattern)
    setTestText('')
    setTestResults([])
    setTestModalOpen(true)
  }

  const runTest = () => {
    if (!testPattern || !testText) {
      setTestResults([])
      return
    }
    
    const results = testPatternRegex(testPattern, testText)
    setTestResults(results)
  }

  const getViolationTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      secret: 'var(--error)',
      pii: 'var(--warning)',
      prompt_injection: 'var(--error)',
      custom_pattern: 'var(--primary)'
    }
    return (
      <Badge variant="high" style={{ backgroundColor: colors[type] || 'var(--gray)', color: 'white' }}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: string, row: Pattern) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{value}</div>
          {row.description && (
            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{row.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'pattern',
      label: 'Pattern',
      render: (value: string) => (
        <code style={{ 
          fontSize: '12px', 
          backgroundColor: 'var(--gray-light)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          {value}
        </code>
      )
    },
    {
      key: 'violation_type',
      label: 'Type',
      render: (value: string) => getViolationTypeBadge(value)
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (value: boolean, row: Pattern) => (
        <button
          onClick={() => handleToggleEnabled(row.id, value)}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: value ? 'var(--success)' : 'var(--gray-border)',
            color: value ? 'white' : 'var(--gray)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {value ? <FiCheck size={14} /> : <FiX size={14} />}
          {value ? 'Enabled' : 'Disabled'}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Pattern) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleTestPattern(row)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--gray-border)',
              backgroundColor: 'var(--dark-surface)',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiCode size={14} />
            Test
          </button>
          <button
            onClick={() => handleEditPattern(row)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--gray-border)',
              backgroundColor: 'var(--dark-surface)',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiEdit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => handleDeletePattern(row.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--error)',
              backgroundColor: 'var(--dark-surface)',
              color: 'var(--error)',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      )
    }
  ]

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
        <div>
          <h1 className="page-title">Custom Detection Patterns</h1>
          <p className="page-subtitle">Create and manage custom regex patterns for detecting violations</p>
        </div>
        <button
          onClick={handleCreatePattern}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiPlus size={18} />
          Create Pattern
        </button>
      </div>

      <Table
        columns={columns}
        data={patterns}
        emptyMessage="No custom patterns yet. Create your first pattern to detect custom violations."
      />

      {/* Create/Edit Modal */}
      {modalOpen && (
        <PatternModal
          pattern={editingPattern}
          onClose={() => setModalOpen(false)}
          onSave={handleSavePattern}
        />
      )}

      {/* Test Modal */}
      {testModalOpen && (
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
            zIndex: 1000
          }}
          onClick={() => setTestModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--dark-surface)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Test Pattern</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Pattern (Regex)
              </label>
              <input
                type="text"
                value={testPattern}
                onChange={(e) => setTestPattern(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: 'var(--dark-light)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter regex pattern"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Test Text
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onBlur={runTest}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '6px',
                  minHeight: '150px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: 'var(--dark-light)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter text to test against the pattern"
              />
            </div>
            {testResults.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Matches ({testResults.length})
                </h3>
                {testResults[0]?.error ? (
                  <div style={{ padding: '12px', backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: 'var(--error)' }}>
                    Error: {testResults[0].error}
                  </div>
                ) : (
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {testResults.map((match, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px',
                          backgroundColor: 'var(--dark-light)',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          fontSize: '12px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <strong>Match:</strong> "{match.text}"<br />
                        <strong>Position:</strong> {match.start}-{match.end}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTestModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--dark-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pattern Modal Component
function PatternModal({ pattern, onClose, onSave }: { pattern: Pattern | null, onClose: () => void, onSave: (data: any) => Promise<void> }) {
  const [name, setName] = useState(pattern?.name || '')
  const [patternRegex, setPatternRegex] = useState(pattern?.pattern || '')
  const [violationType, setViolationType] = useState(pattern?.violation_type || 'secret')
  const [description, setDescription] = useState(pattern?.description || '')
  const [enabled, setEnabled] = useState(pattern?.enabled ?? true)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        id: pattern?.id,
        name,
        pattern: patternRegex,
        violation_type: violationType,
        description,
        enabled
      })
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save pattern')
    } finally {
      setSaving(false)
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
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--dark-surface)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>
          {pattern ? 'Edit Pattern' : 'Create Pattern'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--dark-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Regex Pattern *
            </label>
            <input
              type="text"
              value={patternRegex}
              onChange={(e) => setPatternRegex(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
              placeholder="e.g., [A-Z0-9]{32}"
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Enter a valid JavaScript regex pattern
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Violation Type *
            </label>
            <select
              value={violationType}
              onChange={(e) => setViolationType(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--dark-light)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="secret">Secret</option>
              <option value="pii">PII</option>
              <option value="prompt_injection">Prompt Injection</option>
              <option value="custom_pattern">Custom Pattern</option>
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                minHeight: '80px',
                backgroundColor: 'var(--dark-light)',
                color: 'var(--text-primary)'
              }}
              placeholder="Optional description of what this pattern detects"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span style={{ color: 'var(--text-primary)' }}>Enabled</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--dark-surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Pattern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Patterns

