import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { format, subHours, subDays, parseISO, isAfter } from 'date-fns'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Skeleton from '../components/Skeleton'
import TimeFilter from '../components/TimeFilter'
import InsightsCard from '../components/InsightsCard'
import ChartCard from '../components/ChartCard'
import { ChartIcon, ShieldIcon, CheckIcon, getViolationIcon } from '../components/Icons'
import { getApiUrl } from '../utils/api'

const API_URL = getApiUrl()

type TimeRange = '24h' | '7d' | '30d' | 'all'

function Dashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    violations: [],
    logs: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const [logsRes, violationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/logs`),
        axios.get(`${API_URL}/api/violations`)
      ])
      
      const logs = logsRes.data.logs || []
      const violations = violationsRes.data.violations || []
      
      const blocked = logs.filter((l: any) => l.status === 'blocked').length
      const allowed = logs.filter((l: any) => l.status === 'allowed').length
      
      setStats({
        totalRequests: logs.length,
        blockedRequests: blocked,
        allowedRequests: allowed,
        violations: violations.slice(0, 10),
        logs
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setLoading(false)
    }
  }

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!stats.logs.length) return { logs: [], violations: [] }
    
    const now = new Date()
    let cutoffDate: Date
    
    switch (timeRange) {
      case '24h':
        cutoffDate = subHours(now, 24)
        break
      case '7d':
        cutoffDate = subDays(now, 7)
        break
      case '30d':
        cutoffDate = subDays(now, 30)
        break
      default:
        cutoffDate = new Date(0) // Beginning of time
    }
    
    const filteredLogs = stats.logs.filter((log: any) => {
      if (!log.timestamp) return false
      const logDate = parseISO(log.timestamp)
      return isAfter(logDate, cutoffDate)
    })
    
    const filteredViolations = stats.violations.filter((log: any) => {
      if (!log.timestamp) return false
      const logDate = parseISO(log.timestamp)
      return isAfter(logDate, cutoffDate)
    })
    
    return { logs: filteredLogs, violations: filteredViolations }
  }, [stats.logs, stats.violations, timeRange])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const blocked = filteredData.logs.filter((l: any) => l.status === 'blocked').length
    const allowed = filteredData.logs.filter((l: any) => l.status === 'allowed').length
    
    return {
      totalRequests: filteredData.logs.length,
      blockedRequests: blocked,
      allowedRequests: allowed
    }
  }, [filteredData])

  // Prepare chart data
  const barChartData = [
    { name: 'Blocked', value: filteredStats.blockedRequests, fill: 'var(--chart-error)' },
    { name: 'Allowed', value: filteredStats.allowedRequests, fill: 'var(--chart-success)' }
  ]

  // Prepare time series data (group by hour)
  const timeSeriesData = useMemo(() => {
    const grouped: Record<string, { blocked: number; allowed: number; time: string }> = {}
    
    filteredData.logs.forEach((log: any) => {
      if (!log.timestamp) return
      const date = parseISO(log.timestamp)
      const hourKey = format(date, 'MMM dd HH:mm')
      
      if (!grouped[hourKey]) {
        grouped[hourKey] = { blocked: 0, allowed: 0, time: hourKey }
      }
      
      if (log.status === 'blocked') {
        grouped[hourKey].blocked++
      } else if (log.status === 'allowed') {
        grouped[hourKey].allowed++
      }
    })
    
    return Object.values(grouped).slice(-24).sort((a, b) => a.time.localeCompare(b.time))
  }, [filteredData.logs])

  // Calculate insights
  const insights = useMemo(() => {
    const recentBlocked = filteredData.logs
      .filter((l: any) => l.status === 'blocked')
      .slice(-10)
      .length
    
    const violationTypes = filteredData.violations.reduce((acc: Record<string, number>, log: any) => {
      const violations = log.violations || []
      violations.forEach((v: any) => {
        const type = v.type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
      })
      return acc
    }, {})
    
    const mostCommonViolation = Object.entries(violationTypes).sort((a, b) => b[1] - a[1])[0]
    
    return {
      recentBlocked,
      mostCommonViolation: mostCommonViolation ? mostCommonViolation[0] : null,
      totalViolations: filteredData.violations.length
    }
  }, [filteredData])

  const violationColumns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (value: string) => {
        if (!value) return '-'
        const date = parseISO(value)
        const relative = format(date, 'MMM dd, HH:mm')
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{relative}</span>
            <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
              {format(date, 'yyyy-MM-dd')}
            </span>
          </div>
        )
      }
    },
    {
      key: 'violations',
      label: 'Type',
      render: (value: any[]) => {
        if (!value || value.length === 0) return '-'
        const violation = value[0]
        const IconComponent = getViolationIcon(violation.type)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconComponent size={18} color="var(--gray)" />
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

  // Calculate trends (mock for now - would need historical data)
  const trends = {
    totalRequests: { value: 12, isPositive: true },
    blockedRequests: { value: 8, isPositive: false },
    allowedRequests: { value: 15, isPositive: true }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="page-header">
          <div>
            <Skeleton variant="text" width="200px" height="32px" />
            <Skeleton variant="text" width="300px" height="20px" style={{ marginTop: '8px' }} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
          <Skeleton variant="stat-card" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton variant="chart" />
          <Skeleton variant="chart" />
        </div>
        
        <Skeleton variant="chart" style={{ height: '400px' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Monitor your firewall activity in real-time</p>
        </div>
        <TimeFilter selected={timeRange} onChange={(range) => setTimeRange(range as TimeRange)} />
      </div>
      
      {/* Insights */}
      {insights.recentBlocked > 0 && (
        <div className="mb-8">
          <InsightsCard
            type={insights.recentBlocked > 5 ? 'error' : 'warning'}
            title={`${insights.recentBlocked} requests blocked in the last ${timeRange === '24h' ? 'hour' : timeRange}`}
            description={
              insights.mostCommonViolation
                ? `Most common violation: ${insights.mostCommonViolation.replace('_', ' ')}`
                : 'Monitor your security policies to reduce blocked requests.'
            }
          />
        </div>
      )}
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Total Requests"
          value={filteredStats.totalRequests}
          icon={<ChartIcon size={24} />}
          iconBg="var(--primary)"
          trend={trends.totalRequests}
        />
        <StatCard
          label="Blocked"
          value={filteredStats.blockedRequests}
          icon={<ShieldIcon size={24} />}
          iconBg="var(--error)"
          trend={trends.blockedRequests}
        />
        <StatCard
          label="Allowed"
          value={filteredStats.allowedRequests}
          icon={<CheckIcon size={24} />}
          iconBg="var(--success)"
          trend={trends.allowedRequests}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Request Status"
          description="Blocked vs allowed requests"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'var(--gray)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--gray-border)' }}
              />
              <YAxis 
                tick={{ fill: 'var(--gray)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--gray-border)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Activity Over Time"
          description="Request trends by hour"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'var(--gray)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--gray-border)' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: 'var(--gray)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--gray-border)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--gray-border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="blocked" 
                stroke="var(--chart-error)" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Blocked"
              />
              <Line 
                type="monotone" 
                dataKey="allowed" 
                stroke="var(--chart-success)" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Allowed"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Violations Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--gray-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--dark)' }}>
            Recent Violations
          </h3>
        </div>
        <Table
          columns={violationColumns}
          data={filteredData.violations.slice(0, 10).map((log: any) => ({
            timestamp: log.timestamp,
            violations: log.violations || []
          }))}
          emptyMessage="No violations detected. Your firewall is protecting your requests."
        />
      </div>
    </div>
  )
}

export default Dashboard
