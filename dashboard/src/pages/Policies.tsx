import { useEffect, useState } from 'react'
import axios from 'axios'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import PolicyModal from '../components/PolicyModal'
import { getApiUrl } from '../utils/api'
import { 
  FiShield, 
  FiScissors, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiTrendingUp
} from 'react-icons/fi'

const API_URL = getApiUrl()

function Policies() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null)
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null)

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

  const handleCreatePolicy = () => {
    setEditingPolicy(null)
    setModalOpen(true)
  }

  const handleEditPolicy = (policy: any) => {
    setEditingPolicy(policy)
    setModalOpen(true)
  }

  const handleSavePolicy = async (policyData: any) => {
    try {
      if (policyData.id) {
        // Update existing policy
        await axios.put(`${API_URL}/api/policies/${policyData.id}`, policyData)
      } else {
        // Create new policy
        await axios.post(`${API_URL}/api/policies`, policyData)
      }
      await fetchPolicies()
    } catch (error: any) {
      throw error
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return
    }
    
    setDeletingPolicyId(policyId)
    try {
      await axios.delete(`${API_URL}/api/policies/${policyId}`)
      await fetchPolicies()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete policy')
    } finally {
      setDeletingPolicyId(null)
    }
  }

  const handleToggleEnabled = async (policyId: string, currentEnabled: boolean) => {
    try {
      await axios.put(`${API_URL}/api/policies/${policyId}`, {
        enabled: !currentEnabled
      })
      await fetchPolicies()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update policy')
    }
  }

  const getPolicyIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'block':
        return <FiShield size={20} />
      case 'redact':
        return <FiScissors size={20} />
      case 'warn':
        return <FiAlertTriangle size={20} />
      case 'allow':
        return <FiCheckCircle size={20} />
      default:
        return <FiShield size={20} />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid date'
    }
  }

  // Calculate statistics
  const totalPolicies = policies.length
  const enabledPolicies = policies.filter(p => p.enabled).length
  
  const totalViolationsCaught = policies.reduce((sum, p) => sum + (p.statistics?.violations_caught || 0), 0)
  
  const mostActivePolicy = policies.reduce((max, p) => {
    const violations = p.statistics?.violations_caught || 0
    return violations > (max.statistics?.violations_caught || 0) ? p : max
  }, policies[0] || null)

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const tableColumns = [
    {
      key: 'name',
      label: 'Policy',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: `${getActionColor(row.action)}15`,
              color: getActionColor(row.action),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getPolicyIcon(row.action)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
              {row.name}
            </div>
            {row.description && (
              <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                {row.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (value: string) => (
        <Badge 
          variant={value === 'block' ? 'error' : value === 'redact' ? 'warning' : value === 'warn' ? 'warning' : 'success'}
          style={{ textTransform: 'capitalize' }}
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'violation_types',
      label: 'Violation Types',
      render: (value: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {value.map((type: string) => (
            <Badge key={type} variant="info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
              {type.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (value: boolean, row: any) => (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={value}
            onChange={() => handleToggleEnabled(row.id, value)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <Badge variant={value ? 'success' : 'gray'}>
            {value ? 'Enabled' : 'Disabled'}
          </Badge>
        </label>
      )
    },
    {
      key: 'statistics',
      label: 'Statistics',
      render: (_: any, row: any) => {
        const value = row.statistics
        return (
          <div style={{ fontSize: '13px', color: 'var(--dark)' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>{value?.violations_caught || 0}</strong> violations caught
            </div>
            <div style={{ color: 'var(--gray)', fontSize: '12px' }}>
              {value?.requests_affected || 0} requests affected
            </div>
            {value?.last_triggered && (
              <div style={{ color: 'var(--gray)', fontSize: '11px', marginTop: '4px' }}>
                Last: {formatDate(value.last_triggered)}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => {
        const isDefault = ['block_secrets', 'redact_pii', 'block_injection'].includes(row.id)
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleEditPolicy(row)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                background: 'white',
                color: 'var(--dark)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--gray-border)'
                e.currentTarget.style.color = 'var(--dark)'
              }}
            >
              <FiEdit2 size={14} />
              Edit
            </button>
            {!isDefault && (
              <button
                onClick={() => handleDeletePolicy(row.id)}
                disabled={deletingPolicyId === row.id}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--error)',
                  borderRadius: '6px',
                  background: 'white',
                  color: 'var(--error)',
                  cursor: deletingPolicyId === row.id ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  opacity: deletingPolicyId === row.id ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (deletingPolicyId !== row.id) {
                    e.currentTarget.style.background = 'var(--error-light)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white'
                }}
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Security Policies</h1>
          <p className="page-subtitle">Manage firewall rules and security policies</p>
        </div>
        <button
          onClick={handleCreatePolicy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-dark)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--primary)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
        >
          <FiPlus size={18} />
          Create Policy
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard
          label="Total Policies"
          value={totalPolicies}
          icon={<FiShield size={24} />}
          iconBg="var(--primary)"
        />
        <StatCard
          label="Enabled Policies"
          value={enabledPolicies}
          icon={<FiCheckCircle size={24} />}
          iconBg="var(--success)"
        />
        <StatCard
          label="Violations Caught"
          value={totalViolationsCaught.toLocaleString()}
          icon={<FiTrendingUp size={24} />}
          iconBg="var(--warning)"
        />
        <StatCard
          label="Most Active Policy"
          value={mostActivePolicy ? mostActivePolicy.name : 'None'}
          icon={<FiAlertTriangle size={24} />}
          iconBg="var(--error)"
        />
      </div>

      {/* Policies Table */}
      <div className="card" style={{ padding: '0' }}>
        {policies.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div className="empty-state">
              <div className="empty-state-icon">⚙️</div>
              <div className="empty-state-title">No policies configured</div>
              <div className="empty-state-text">Create your first policy to get started</div>
              <button
                onClick={handleCreatePolicy}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <FiPlus size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Create Policy
              </button>
            </div>
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={policies.sort((a, b) => (b.priority || 0) - (a.priority || 0))}
            emptyMessage="No policies found"
          />
        )}
      </div>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingPolicy(null)
        }}
        onSave={handleSavePolicy}
        policy={editingPolicy}
      />
    </div>
  )
}

export default Policies
