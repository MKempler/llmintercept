import React from 'react'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
}

export default function ChartCard({ title, description, children, action, icon }: ChartCardProps) {
  return (
    <div className="card chart-card chart-container">
      <div className="chart-card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary)15 0%, var(--primary-light)15 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h3 className="chart-card-title">{title}</h3>
            {description && (
              <p className="chart-card-description">{description}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

