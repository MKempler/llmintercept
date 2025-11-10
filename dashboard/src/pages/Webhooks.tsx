import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import Table from '../components/Table'
import { apiClient } from '../utils/api'
import { 
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiLink,
  FiAlertCircle
} from 'react-icons/fi'

interface Webhook {
  id: string
  url: string
  events: string[]
  retry_count: number
  timeout: number
  enabled: boolean
}

function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const res = await apiClient.get('/api/webhooks')
      setWebhooks(res.data.webhooks || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching webhooks:', error)
      setLoading(false)
    }
  }

  const handleCreateWebhook = () => {
    setEditingWebhook(null)
    setModalOpen(true)
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return
    }
    
    try {
      // Note: Delete endpoint may not be implemented yet
      // await apiClient.delete(`/api/webhooks/${webhookId}`)
      alert('Webhook deletion not yet implemented in API')
      await fetchWebhooks()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete webhook')
    }
  }

  const getEventBadges = (events: string[]) => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {events.map((event) => {
          const colors: Record<string, string> = {
            violation: 'var(--warning)',
            blocked: 'var(--error)',
            policy_change: 'var(--primary)'
          }
          return (
            <Badge
              key={event}
              variant="info"
              style={{
                backgroundColor: colors[event] || 'var(--gray)',
                color: 'white',
                fontSize: '11px'
              }}
            >
              {event}
            </Badge>
          )
        })}
      </div>
    )
  }

  const columns = [
    {
      key: 'url',
      label: 'URL',
      render: (value: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiLink size={14} color="var(--gray)" />
          <code style={{ 
            fontSize: '12px', 
            backgroundColor: 'var(--gray-light)', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            maxWidth: '400px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {value}
          </code>
        </div>
      )
    },
    {
      key: 'events',
      label: 'Events',
      render: (value: string[]) => getEventBadges(value)
    },
    {
      key: 'retry_count',
      label: 'Retries',
      render: (value: number) => (
        <span style={{ fontSize: '13px', color: 'var(--dark)' }}>{value}</span>
      )
    },
    {
      key: 'timeout',
      label: 'Timeout',
      render: (value: number) => (
        <span style={{ fontSize: '13px', color: 'var(--dark)' }}>{value}s</span>
      )
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'gray'}>
          {value ? 'Enabled' : 'Disabled'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Webhook) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleDeleteWebhook(row.id)}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--error)',
              borderRadius: '6px',
              background: 'white',
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
          <h1 className="page-title">Webhooks</h1>
          <p className="page-subtitle">Configure webhook endpoints to receive real-time notifications</p>
        </div>
        <button
          onClick={handleCreateWebhook}
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
          Add Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <div className="empty-state-title">No webhooks configured</div>
            <div className="empty-state-text">
              Webhooks allow you to receive real-time notifications about violations, blocks, and policy changes.
              Configure webhooks via environment variables or add them here once the API supports it.
            </div>
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--gray-light)', borderRadius: '8px', textAlign: 'left', maxWidth: '600px', margin: '24px auto 0' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAlertCircle size={16} />
                Configuration via Environment Variables
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: '1.6' }}>
                Set these environment variables to configure webhooks:
                <br />
                <code style={{ display: 'block', marginTop: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
                  WEBHOOK_URLS=https://your-webhook-url.com
                  <br />
                  WEBHOOK_EVENTS=violation,blocked,policy_change
                  <br />
                  WEBHOOK_SECRET=your-secret-key
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={webhooks}
          emptyMessage="No webhooks configured"
        />
      )}

      {/* Create/Edit Modal - Placeholder for future API support */}
      {modalOpen && (
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
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Add Webhook</h2>
            <div style={{ padding: '16px', backgroundColor: 'var(--gray-light)', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FiAlertCircle size={16} color="var(--warning)" />
                <span style={{ fontWeight: 600 }}>API Not Yet Available</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray)', margin: 0 }}>
                Webhook management via API is coming soon. For now, configure webhooks using environment variables.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                padding: '10px 20px',
                border: '1px solid var(--gray-border)',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Webhooks

