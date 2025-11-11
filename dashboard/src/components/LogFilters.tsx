interface LogFiltersProps {
  status: string | null
  endpoint: string | null
  violationType: string | null
  search: string
  onStatusChange: (status: string | null) => void
  onEndpointChange: (endpoint: string | null) => void
  onViolationTypeChange: (type: string | null) => void
  onSearchChange: (search: string) => void
  availableEndpoints: string[]
}

export default function LogFilters({
  status,
  endpoint,
  violationType,
  search,
  onStatusChange,
  onEndpointChange,
  onViolationTypeChange,
  onSearchChange,
  availableEndpoints
}: LogFiltersProps) {
  const statusOptions = [
    { value: null, label: 'All Status' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'allowed', label: 'Allowed' },
    { value: 'error', label: 'Error' }
  ]

  const violationTypeOptions = [
    { value: null, label: 'All Types' },
    { value: 'pii', label: 'PII' },
    { value: 'secret', label: 'Secret' },
    { value: 'prompt_injection', label: 'Prompt Injection' },
    { value: 'custom_pattern', label: 'Custom Pattern' }
  ]

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by request ID, endpoint, or user ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid var(--gray-border)',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro", sans-serif',
            background: 'var(--dark-surface)',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s'
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

      {/* Filter Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Status:</span>
          {statusOptions.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => onStatusChange(option.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--gray-border)',
                background: status === option.value ? 'var(--primary)' : 'var(--dark-surface)',
                color: status === option.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: status === option.value ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (status !== option.value) {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (status !== option.value) {
                  e.currentTarget.style.borderColor = 'var(--gray-border)'
                  e.currentTarget.style.background = 'var(--dark-surface)'
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Violation Type Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Violation:</span>
          {violationTypeOptions.map((option) => (
            <button
              key={option.value || 'all'}
              onClick={() => onViolationTypeChange(option.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--gray-border)',
                background: violationType === option.value ? 'var(--primary)' : 'var(--dark-surface)',
                color: violationType === option.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: violationType === option.value ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (violationType !== option.value) {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (violationType !== option.value) {
                  e.currentTarget.style.borderColor = 'var(--gray-border)'
                  e.currentTarget.style.background = 'var(--dark-surface)'
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Endpoint Filter */}
        {availableEndpoints.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Endpoint:</span>
            <select
              value={endpoint || ''}
              onChange={(e) => onEndpointChange(e.target.value || null)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--gray-border)',
                background: 'var(--dark-surface)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--gray-border)'
              }}
            >
              <option value="">All Endpoints</option>
              {availableEndpoints.map((ep) => (
                <option key={ep} value={ep}>
                  {ep}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

