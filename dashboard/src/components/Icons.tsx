import React from 'react'
import { 
  FiBarChart2, 
  FiShield, 
  FiCheckCircle, 
  FiKey, 
  FiUser, 
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiCopy
} from 'react-icons/fi'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

export const ChartIcon = ({ size = 24, color, className }: IconProps) => (
  <FiBarChart2 size={size} color={color} className={className} />
)

export const ShieldIcon = ({ size = 24, color, className }: IconProps) => (
  <FiShield size={size} color={color} className={className} />
)

export const CheckIcon = ({ size = 24, color, className }: IconProps) => (
  <FiCheckCircle size={size} color={color} className={className} />
)

export const KeyIcon = ({ size = 24, color, className }: IconProps) => (
  <FiKey size={size} color={color} className={className} />
)

export const UserIcon = ({ size = 24, color, className }: IconProps) => (
  <FiUser size={size} color={color} className={className} />
)

export const AlertIcon = ({ size = 24, color, className }: IconProps) => (
  <FiAlertTriangle size={size} color={color} className={className} />
)

export const ClockIcon = ({ size = 24, color, className }: IconProps) => (
  <FiClock size={size} color={color} className={className} />
)

export const TrendingUpIcon = ({ size = 24, color, className }: IconProps) => (
  <FiTrendingUp size={size} color={color} className={className} />
)

export const TrendingDownIcon = ({ size = 24, color, className }: IconProps) => (
  <FiTrendingDown size={size} color={color} className={className} />
)

export const CopyIcon = ({ size = 24, color, className }: IconProps) => (
  <FiCopy size={size} color={color} className={className} />
)

export const getViolationIcon = (type: string) => {
  const typeLower = type.toLowerCase()
  if (typeLower.includes('secret')) return KeyIcon
  if (typeLower.includes('pii')) return UserIcon
  if (typeLower.includes('injection')) return AlertIcon
  return AlertIcon
}

