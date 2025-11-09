import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Table from '../components/Table'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getApiUrl } from '../utils/api'

const API_URL = getApiUrl()

function Violations() {
  const [violations, setViolations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchViolations()
    const interval = setInterval(fetchViolations, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchViolations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/violations`)
      setViolations(res.data.violations || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching violations:', error)
      setLoading(false)
    }
  }

  const getViolationIcon = (type: string) => {
    const icons: Record<string, string> = {
      secret: '🔑',
      pii: '👤',
      prompt_injection: '⚠️',
      injection: '⚠️'
    }
    return icons[type.toLowerCase()] || '🚨'
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value: string) => value ? new Date(value).toLocaleString() : '-'
    },
    {
      key: 'request_id',
      label: 'Request ID',
      render: (value: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gray)' }}>
          {value ? `${value.substring(0, 8)}...` : '-'}
        </span>
      )
    },
    {
      key: 'violations',
      label: 'Type',
      render: (value: any[]) => {
        if (!value || value.length === 0) return '-'
        const violation = value[0]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{getViolationIcon(violation.type)}</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
              {violation.type.replace('_', ' ')}
            </span>
          </div>
        )
      }
    },
    {
      key: 'violations',
      label: 'Message',
      render: (value: any[]) => value?.[0]?.message || '-'
    },
    {
      key: 'violations',
      label: 'Severity',
      render: (value: any[]) => {
        if (!value || value.length === 0) return '-'
        const severity = value[0].severity || 'medium'
        const variant = severity === 'high' ? 'high' : severity === 'medium' ? 'medium' : 'low'
        return <Badge variant={variant}>{severity}</Badge>
      }
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const flattenedViolations = violations.flatMap((log: any) => 
    (log.violations || []).map((violation: any, idx: number) => ({
      ...log,
      violations: [violation],
      key: `${log.id}-${idx}`
    }))
  )

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Security Violations</h1>
        <p className="page-subtitle">View all detected security violations and threats</p>
      </div>
      
      <Table
        columns={columns}
        data={flattenedViolations}
        emptyMessage="No violations detected. Your firewall is working perfectly!"
      />
    </div>
  )
}

export default Violations

