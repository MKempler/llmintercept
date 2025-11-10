import { useEffect, useState, useMemo } from 'react'
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
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
import CustomTooltip from '../components/CustomTooltip'
import { ChartIcon, ShieldIcon, CheckIcon, getViolationIcon, AlertIcon, ClockIcon } from '../components/Icons'
import { apiClient, getApiUrl } from '../utils/api'

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
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const [logsRes, violationsRes] = await Promise.all([
        apiClient.get('/api/logs'),
        apiClient.get('/api/violations')
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
    { name: 'Blocked', value: filteredStats.blockedRequests },
    { name: 'Allowed', value: filteredStats.allowedRequests }
  ]

  // Prepare violation breakdown data for pie chart
  const violationBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    
    filteredData.violations.forEach((log: any) => {
      const violations = log.violations || []
      violations.forEach((v: any) => {
        const type = v.type || 'unknown'
        breakdown[type] = (breakdown[type] || 0) + 1
      })
    })
    
    return Object.entries(breakdown).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value
    }))
  }, [filteredData.violations])

  const PIE_COLORS = [
    'var(--chart-error)',
    'var(--chart-warning)',
    'var(--chart-primary)',
    'var(--chart-success)',
    'var(--chart-gray)'
  ]

  // Prepare time series data (group by time period based on selected range)
  const timeSeriesData = useMemo(() => {
    if (!filteredData.logs.length) return []
    
    const grouped: Record<string, { blocked: number; allowed: number; time: string; date: Date }> = {}
    
    // Determine grouping format based on time range
    let timeFormat: string
    let maxPoints: number
    
    switch (timeRange) {
      case '24h':
        timeFormat = 'MMM dd HH:00'
        maxPoints = 24
        break
      case '7d':
        timeFormat = 'MMM dd'
        maxPoints = 7
        break
      case '30d':
        timeFormat = 'MMM dd'
        maxPoints = 30
        break
      default:
        timeFormat = 'MMM dd'
        maxPoints = 30
    }
    
    filteredData.logs.forEach((log: any) => {
      if (!log.timestamp) return
      const date = parseISO(log.timestamp)
      const timeKey = format(date, timeFormat)
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = { blocked: 0, allowed: 0, time: timeKey, date }
      }
      
      if (log.status === 'blocked') {
        grouped[timeKey].blocked++
      } else if (log.status === 'allowed') {
        grouped[timeKey].allowed++
      }
    })
    
    // Sort by date and take the most recent points
    const sorted = Object.values(grouped).sort((a, b) => {
      return a.date.getTime() - b.date.getTime()
    })
    
    // Remove date property before returning (only needed for sorting)
    return sorted.slice(-maxPoints).map(({ date, ...rest }) => rest)
  }, [filteredData.logs, timeRange])

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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="high" style={{ backgroundColor: '#10b981', color: 'white', fontSize: '12px' }}>{Math.round(confidence * 100)}%</Badge>
    } else if (confidence >= 0.6) {
      return <Badge variant="medium" style={{ backgroundColor: '#f59e0b', color: 'white', fontSize: '12px' }}>{Math.round(confidence * 100)}%</Badge>
    } else {
      return <Badge variant="low" style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '12px' }}>{Math.round(confidence * 100)}%</Badge>
    }
  }

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
    },
    {
      key: 'violations',
      label: 'Confidence',
      render: (value: any[]) => {
        if (!value || value.length === 0) return '-'
        const confidence = value[0].confidence ?? 0.8
        return getConfidenceBadge(confidence)
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href={`${getApiUrl()}/metrics`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <ChartIcon size={16} />
            Prometheus Metrics
          </a>
          <TimeFilter selected={timeRange} onChange={(range) => setTimeRange(range as TimeRange)} />
        </div>
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
          icon={<ChartIcon size={20} />}
        >
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="barGradientError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-error-light)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-error)" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="barGradientSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-success-light)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--chart-success)" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'var(--gray)', fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: 'var(--gray-border)', strokeWidth: 1 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'var(--gray)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--gray-border)', strokeWidth: 1 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[12, 12, 0, 0]}
                barCategoryGap="30%"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {barChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? 'url(#barGradientError)' : 'url(#barGradientSuccess)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Activity Over Time"
          description={timeRange === '24h' ? 'Request trends by hour' : timeRange === '7d' ? 'Request trends by day' : 'Request trends over time'}
          icon={<ClockIcon size={20} />}
        >
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="areaGradientBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-error)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-error)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaGradientAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-success)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-border)" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'var(--gray)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--gray-border)', strokeWidth: 1 }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: 'var(--gray)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--gray-border)', strokeWidth: 1 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="blocked" 
                stroke="var(--chart-error)" 
                strokeWidth={3}
                fill="url(#areaGradientBlocked)"
                name="Blocked"
                dot={{ r: 0 }}
                activeDot={{ r: 6, stroke: 'var(--chart-error)', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Area 
                type="monotone" 
                dataKey="allowed" 
                stroke="var(--chart-success)" 
                strokeWidth={3}
                fill="url(#areaGradientAllowed)"
                name="Allowed"
                dot={{ r: 0 }}
                activeDot={{ r: 6, stroke: 'var(--chart-success)', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Violation Breakdown Pie Chart */}
      {violationBreakdown.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title="Violation Breakdown"
            description="Distribution of violation types"
            icon={<AlertIcon size={20} />}
          >
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={violationBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {violationBreakdown.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

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
