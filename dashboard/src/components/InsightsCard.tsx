import React from 'react'
import { AlertIcon } from './Icons'

interface InsightsCardProps {
  type?: 'info' | 'warning' | 'error'
  title: string
  description: string
  icon?: React.ReactNode
}

export default function InsightsCard({ 
  type = 'info', 
  title, 
  description,
  icon 
}: InsightsCardProps) {
  return (
    <div className={`card insights-card ${type}`} style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {icon || (
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '8px',
            background: type === 'error' ? 'rgba(220, 38, 38, 0.1)' : 
                        type === 'warning' ? 'rgba(217, 119, 6, 0.1)' : 
                        'rgba(37, 99, 235, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertIcon 
              size={20} 
              color={type === 'error' ? 'var(--error)' : 
                     type === 'warning' ? 'var(--warning)' : 
                     'var(--primary)'} 
            />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: 'var(--dark)',
            marginBottom: '4px'
          }}>
            {title}
          </h4>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--gray)',
            margin: 0,
            lineHeight: 1.5
          }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

