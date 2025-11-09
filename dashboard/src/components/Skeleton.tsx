import React from 'react'

interface SkeletonProps {
  variant?: 'stat-card' | 'chart' | 'table-row' | 'text'
  width?: string
  height?: string
  className?: string
  style?: React.CSSProperties
}

export default function Skeleton({ variant, width, height, className = '', style: customStyle }: SkeletonProps) {
  const getClassName = () => {
    if (variant === 'stat-card') return 'skeleton skeleton-stat-card'
    if (variant === 'chart') return 'skeleton skeleton-chart'
    if (variant === 'table-row') return 'skeleton skeleton-table-row'
    return 'skeleton'
  }

  const style: React.CSSProperties = { ...customStyle }
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div className={`${getClassName()} ${className}`} style={style} />
  )
}

