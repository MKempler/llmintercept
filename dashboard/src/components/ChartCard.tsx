import React from 'react'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export default function ChartCard({ title, description, children, action }: ChartCardProps) {
  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">{title}</h3>
          {description && (
            <p className="chart-card-description">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

