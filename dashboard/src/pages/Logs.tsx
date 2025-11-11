import { useEffect, useState, useMemo } from 'react'
import { subHours, subDays } from 'date-fns'
import Table from '../components/Table'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import TimeFilter from '../components/TimeFilter'
import LogFilters from '../components/LogFilters'
import LogPagination from '../components/LogPagination'
import LogDetailModal from '../components/LogDetailModal'
import { apiClient } from '../utils/api'
import { ChartIcon, ShieldIcon, CheckIcon, AlertIcon } from '../components/Icons'

type TimeRange = '24h' | '7d' | '30d' | 'all'

function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [endpointFilter, setEndpointFilter] = useState<string | null>(null)
  const [violationTypeFilter, setViolationTypeFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([])

  // Calculate date range from timeRange
  const dateRange = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = new Date()

    switch (timeRange) {
      case '24h':
        startDate = subHours(now, 24)
        break
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case 'all':
        startDate = null
        break
    }

    return { startDate, endDate }
  }, [timeRange])

  useEffect(() => {
    fetchLogs()
    // Refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, endpointFilter, violationTypeFilter, searchQuery, timeRange, limit, offset])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: any = {
        limit,
        offset
      }

      if (statusFilter) {
        params.status = statusFilter
      }

      if (endpointFilter) {
        params.endpoint = endpointFilter
      }

      if (violationTypeFilter) {
        params.violation_type = violationTypeFilter
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      if (dateRange.startDate) {
        params.start_date = dateRange.startDate.toISOString()
      }

      if (dateRange.endDate) {
        params.end_date = dateRange.endDate.toISOString()
      }

      const res = await apiClient.get('/api/logs', { params })
      const logsData = res.data.logs || []
      setLogs(logsData)
      setTotal(res.data.total || 0)

      // Extract unique endpoints for filter dropdown
      const endpoints: string[] = Array.from(
        new Set(logsData.map((log: any) => log.endpoint).filter((ep: any) => typeof ep === 'string' && ep.length > 0))
      ) as string[]
      setAvailableEndpoints(endpoints.sort())

      setLoading(false)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setLoading(false)
    }
  }

  // Calculate summary stats from current logs
  const summaryStats = useMemo(() => {
    const blocked = logs.filter((log) => log.status === 'blocked').length
    const allowed = logs.filter((log) => log.status === 'allowed').length
    const errors = logs.filter((log) => log.status === 'error').length

    return {
      total: logs.length,
      blocked,
      allowed,
      errors
    }
  }, [logs])

  const getStatusBadge = (status: string, row: any) => {
    let statusBadge: JSX.Element

    switch (status) {
      case 'blocked':
        statusBadge = <Badge variant="error">Blocked</Badge>
        break
      case 'allowed':
        statusBadge = <Badge variant="success">Allowed</Badge>
        break
      case 'error':
        statusBadge = <Badge variant="error">Error</Badge>
        break
      default:
        statusBadge = <Badge variant="gray">{status}</Badge>
        break
    }

    const isRedacted = row?.metadata?.redacted

    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {statusBadge}
        {isRedacted && <Badge variant="warning">Redacted</Badge>}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let relativeTime = ''
    if (diffMins < 1) {
      relativeTime = 'Just now'
    } else if (diffMins < 60) {
      relativeTime = `${diffMins}m ago`
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}d ago`
    } else {
      relativeTime = date.toLocaleDateString()
    }

    return (
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{relativeTime}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {date.toLocaleString()}
        </div>
      </div>
    )
  }

  const truncateRequestId = (requestId: string) => {
    if (!requestId) return '-'
    if (requestId.length <= 12) return requestId
    return `${requestId.substring(0, 8)}...`
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value: string) => formatDate(value)
    },
    {
      key: 'request_id',
      label: 'Request ID',
      render: (value: string) => (
        <code
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'var(--primary)',
            cursor: 'pointer'
          }}
          onClick={() => {
            if (value) {
              navigator.clipboard.writeText(value)
            }
          }}
          title="Click to copy"
        >
          {truncateRequestId(value)}
        </code>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string, row: any) => getStatusBadge(value, row)
    },
    {
      key: 'method',
      label: 'Method',
      render: (value: string) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: value === 'POST' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(156, 163, 175, 0.15)',
            color: value === 'POST' ? 'var(--primary-light)' : 'var(--text-muted)'
          }}
        >
          {value || '-'}
        </span>
      )
    },
    {
      key: 'endpoint',
      label: 'Endpoint',
      render: (value: string) => (
        <code
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          {value || '-'}
        </code>
      )
    },
    {
      key: 'violations',
      label: 'Violations',
      render: (value: any[]) => {
        const count = value?.length || 0
        if (count === 0) {
          return <span style={{ color: 'var(--success)', fontSize: '13px' }}>0</span>
        }
        return <Badge variant="warning">{count}</Badge>
      }
    },
    {
      key: 'latency_ms',
      label: 'Latency',
      render: (value: number) =>
        value ? (
          <span style={{ color: value > 200 ? 'var(--warning)' : 'var(--text-muted)', fontSize: '13px' }}>
            {value}ms
          </span>
        ) : (
          '-'
        )
    }
  ]

  const handleRowClick = (row: any) => {
    setSelectedLog(row)
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Time', 'Request ID', 'Status', 'Method', 'Endpoint', 'Violations', 'Latency (ms)']
    const rows = logs.map((log) => [
      log.timestamp || '',
      log.request_id || '',
      log.status || '',
      log.method || '',
      log.endpoint || '',
      (log.violations || []).length,
      log.latency_ms || ''
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && logs.length === 0) {
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
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete history of all firewall requests and responses</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--dark-surface)',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--dark-surface)'
              e.currentTarget.style.color = 'var(--primary)'
            }}
          >
            Export CSV
          </button>
          <TimeFilter selected={timeRange} onChange={(range) => {
            setTimeRange(range as TimeRange)
            setOffset(0) // Reset to first page when changing time range
          }} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Requests"
          value={summaryStats.total}
          icon={<ChartIcon size={24} />}
          iconBg="var(--primary)"
        />
        <StatCard
          label="Blocked"
          value={summaryStats.blocked}
          icon={<ShieldIcon size={24} />}
          iconBg="var(--error)"
        />
        <StatCard
          label="Allowed"
          value={summaryStats.allowed}
          icon={<CheckIcon size={24} />}
          iconBg="var(--success)"
        />
        <StatCard
          label="Errors"
          value={summaryStats.errors}
          icon={<AlertIcon size={24} />}
          iconBg="var(--warning)"
        />
      </div>

      {/* Filters */}
      <LogFilters
        status={statusFilter}
        endpoint={endpointFilter}
        violationType={violationTypeFilter}
        search={searchQuery}
        onStatusChange={(status) => {
          setStatusFilter(status)
          setOffset(0)
        }}
        onEndpointChange={(endpoint) => {
          setEndpointFilter(endpoint)
          setOffset(0)
        }}
        onViolationTypeChange={(type) => {
          setViolationTypeFilter(type)
          setOffset(0)
        }}
        onSearchChange={(search) => {
          setSearchQuery(search)
          setOffset(0)
        }}
        availableEndpoints={availableEndpoints}
      />

      {/* Results Count */}
      {total > 0 && (
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} logs
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: 'var(--dark-surface)',
          borderRadius: '8px',
          border: '1px solid var(--gray-border)',
          overflow: 'hidden'
        }}
      >
        <Table
          columns={columns}
          data={logs}
          emptyMessage="No logs found matching your filters. Try adjusting your search criteria."
          onRowClick={handleRowClick}
        />
      </div>

      {/* Pagination */}
      {total > 0 && (
        <LogPagination
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={(newOffset) => setOffset(newOffset)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit)
            setOffset(0)
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}

export default Logs
