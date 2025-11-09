import React from 'react'

interface BadgeProps {
  variant?: 'high' | 'medium' | 'low' | 'success' | 'error' | 'warning' | 'info' | 'gray'
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Badge({ variant = 'gray', children, className = '', style }: BadgeProps) {
  const variantClass = `badge-${variant}`
  
  return (
    <span className={`badge ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  )
}

