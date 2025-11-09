import React from 'react'
import { TrendingUpIcon, TrendingDownIcon } from './Icons'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  iconBg?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export default function StatCard({ 
  label, 
  value, 
  icon, 
  iconBg = 'var(--primary)',
  trend,
  className = '' 
}: StatCardProps) {
  return (
    <div className={`stat-card ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        {icon && (
          <div 
            className="stat-card-icon"
            style={{ background: `${iconBg}15`, color: iconBg }}
          >
            {icon}
          </div>
        )}
        {trend && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: trend.isPositive ? 'var(--success)' : 'var(--error)',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {trend.isPositive ? (
              <TrendingUpIcon size={16} color="var(--success)" />
            ) : (
              <TrendingDownIcon size={16} color="var(--error)" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  )
}
