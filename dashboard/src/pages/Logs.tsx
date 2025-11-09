import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Table from '../components/Table'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getApiUrl } from '../utils/api'

const API_URL = getApiUrl()

function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/logs`)
      setLogs(res.data.logs || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setLoading(false)
    }
  }

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

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value: string) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'endpoint',
      label: 'Endpoint',
      render: (value: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {value || '-'}
        </span>
      )
    },
    {
      key: 'violations',
      label: 'Violations',
      render: (value: any[]) => {
        const count = value?.length || 0
        if (count === 0) {
          return <span style={{ color: 'var(--success)' }}>0</span>
        }
        return <Badge variant="warning">{count}</Badge>
      }
    },
    {
      key: 'latency_ms',
      label: 'Latency',
      render: (value: number) => value ? (
        <span style={{ color: value > 200 ? 'var(--warning)' : 'var(--gray)' }}>
          {value}ms
        </span>
      ) : '-'
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
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Complete history of all firewall requests and responses</p>
      </div>
      
      <Table
        columns={columns}
        data={logs}
        emptyMessage="No logs available yet. Requests will appear here once they're processed."
      />
    </div>
  )
}

export default Logs

