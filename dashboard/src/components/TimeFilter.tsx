import React from 'react'

interface TimeFilterProps {
  selected: string
  onChange: (range: '24h' | '7d' | '30d' | 'all') => void
}

const timeRanges = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
  { value: 'all', label: 'All time' }
]

export default function TimeFilter({ selected, onChange }: TimeFilterProps) {
  return (
    <div className="time-filter">
      {timeRanges.map((range) => (
        <button
          key={range.value}
          className={`time-filter-button ${selected === range.value ? 'active' : ''}`}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

