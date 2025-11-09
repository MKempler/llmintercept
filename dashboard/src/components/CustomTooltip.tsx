import React from 'react'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    dataKey?: string
    color?: string
    fill?: string
  }>
  label?: string
  formatter?: (value: any, name: string) => [string, string]
}

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const formatValue = (value: number) => {
    return value.toLocaleString('en-US')
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--white)',
        border: '1px solid var(--gray-border)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '180px',
      }}
    >
      {label && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--gray)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--gray-border)',
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {payload.map((entry, index) => {
          const value = entry.value || 0
          const name = entry.name || entry.dataKey || 'Value'
          const color = entry.color || entry.fill || 'var(--primary)'

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: color,
                    boxShadow: `0 2px 4px ${color}40`,
                  }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--dark)',
                  }}
                >
                  {name}
                </span>
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--dark)',
                }}
              >
                {formatValue(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

