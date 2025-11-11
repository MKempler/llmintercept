import React from 'react'

interface TableColumn {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface TableProps {
  columns: TableColumn[]
  data: any[]
  emptyMessage?: string
  className?: string
  onRowClick?: (row: any) => void
}

export default function Table({ 
  columns, 
  data, 
  emptyMessage = 'No data available', 
  className = '',
  onRowClick
}: TableProps) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12">
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No data found</div>
                  <div className="empty-state-text">{emptyMessage}</div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr 
                key={idx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = 'var(--gray-light)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key] || '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

