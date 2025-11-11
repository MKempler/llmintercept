import Badge from './Badge'

interface LogDetailModalProps {
  log: any
  onClose: () => void
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  if (!log) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'blocked':
        return <Badge variant="error">Blocked</Badge>
      case 'allowed':
        return <Badge variant="success">Allowed</Badge>
      case 'error':
        return <Badge variant="error">Error</Badge>
      default:
        return <Badge variant="gray">{status}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatJSON = (data: any) => {
    if (!data) return 'N/A'
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      return JSON.stringify(parsed, null, 2)
    } catch {
      return String(data)
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
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--gray-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--dark)' }}>
            Log Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--gray)',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gray-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
              Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Status</div>
                <div>{getStatusBadge(log.status)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Timestamp</div>
                <div style={{ fontSize: '14px', color: 'var(--dark)' }}>{formatDate(log.timestamp)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Request ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '13px', color: 'var(--dark)', fontFamily: 'monospace' }}>
                    {log.request_id || '-'}
                  </code>
                  {log.request_id && (
                    <button
                      onClick={() => copyToClipboard(log.request_id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--gray-border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: 'var(--gray)'
                      }}
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Method</div>
                <div style={{ fontSize: '14px', color: 'var(--dark)' }}>{log.method || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Endpoint</div>
                <code style={{ fontSize: '13px', color: 'var(--dark)', fontFamily: 'monospace' }}>
                  {log.endpoint || '-'}
                </code>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>User ID</div>
                <div style={{ fontSize: '14px', color: 'var(--dark)' }}>{log.user_id || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Latency</div>
                <div style={{ fontSize: '14px', color: 'var(--dark)' }}>
                  {log.latency_ms ? `${log.latency_ms}ms` : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Violations */}
          {log.violations && log.violations.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
                Violations ({log.violations.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {log.violations.map((violation: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      background: 'var(--gray-light)',
                      borderRadius: '8px',
                      borderLeft: '4px solid var(--error)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Badge variant="error">{violation.type || 'unknown'}</Badge>
                      {violation.confidence && (
                        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                          Confidence: {Math.round(violation.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--dark)', marginBottom: '4px' }}>
                      {violation.message || violation.name || 'Violation detected'}
                    </div>
                    {violation.matched_text && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '4px' }}>Matched Text:</div>
                        <code
                          style={{
                            fontSize: '12px',
                            background: 'white',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            display: 'block',
                            fontFamily: 'monospace',
                            color: 'var(--dark)'
                          }}
                        >
                          {violation.matched_text}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Data */}
          {log.request_data && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
                Request Data
              </h3>
              <pre
                style={{
                  background: 'var(--gray-light)',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '300px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {formatJSON(log.request_data)}
              </pre>
            </div>
          )}

          {/* Response Data */}
          {log.response_data && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
                Response Data
              </h3>
              <pre
                style={{
                  background: 'var(--gray-light)',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '300px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {formatJSON(log.response_data)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>
                Metadata
              </h3>
              <pre
                style={{
                  background: 'var(--gray-light)',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '200px',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {formatJSON(log.metadata)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

