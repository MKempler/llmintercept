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
  // Extract RGB values for gradient
  const getGradientColor = (color: string) => {
    if (color === 'var(--primary)') return 'rgba(37, 99, 235, 0.08)'
    if (color === 'var(--error)') return 'rgba(220, 38, 38, 0.08)'
    if (color === 'var(--success)') return 'rgba(5, 150, 105, 0.08)'
    return 'rgba(100, 116, 139, 0.08)'
  }

  return (
    <div className={`stat-card ${className}`} style={{ 
      background: `linear-gradient(135deg, ${getGradientColor(iconBg)} 0%, rgba(255, 255, 255, 0.5) 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        {icon && (
          <div 
            className="stat-card-icon"
            style={{ 
              background: `linear-gradient(135deg, ${iconBg}20 0%, ${iconBg}10 100%)`,
              color: iconBg,
              boxShadow: `0 4px 12px ${iconBg}20`
            }}
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
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              background: trend.isPositive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              transition: 'all 0.2s ease'
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
