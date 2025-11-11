interface LogPaginationProps {
  total: number
  limit: number
  offset: number
  onPageChange: (offset: number) => void
  onLimitChange: (limit: number) => void
}

export default function LogPagination({
  total,
  limit,
  offset,
  onPageChange,
  onLimitChange
}: LogPaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  const handlePrevious = () => {
    if (offset > 0) {
      onPageChange(Math.max(0, offset - limit))
    }
  }

  const handleNext = () => {
    if (offset + limit < total) {
      onPageChange(offset + limit)
    }
  }

  const handlePageClick = (page: number) => {
    onPageChange((page - 1) * limit)
  }

  const startItem = total === 0 ? 0 : offset + 1
  const endItem = Math.min(offset + limit, total)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        padding: '16px',
        background: 'var(--dark-surface)',
        borderRadius: '8px',
        border: '1px solid var(--gray-border)'
      }}
    >
      {/* Results Count */}
      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        Showing {startItem}-{endItem} of {total} logs
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Page Size Selector */}
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--gray-border)',
            background: 'var(--dark-surface)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--gray-border)'
          }}
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>

        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={offset === 0}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--gray-border)',
            background: offset === 0 ? 'var(--dark-surface)' : 'var(--dark-surface)',
            color: offset === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '13px',
            cursor: offset === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: offset === 0 ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (offset !== 0) {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (offset !== 0) {
              e.currentTarget.style.borderColor = 'var(--gray-border)'
              e.currentTarget.style.background = 'var(--dark-surface)'
            }
          }}
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--gray-border)',
                  background: currentPage === pageNum ? 'var(--primary)' : 'var(--dark-surface)',
                  color: currentPage === pageNum ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: currentPage === pageNum ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '36px'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== pageNum) {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== pageNum) {
                    e.currentTarget.style.borderColor = 'var(--gray-border)'
                    e.currentTarget.style.background = 'var(--dark-surface)'
                  }
                }}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={offset + limit >= total}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--gray-border)',
            background: 'var(--dark-surface)',
            color: offset + limit >= total ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '13px',
            cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: offset + limit >= total ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (offset + limit < total) {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (offset + limit < total) {
              e.currentTarget.style.borderColor = 'var(--gray-border)'
              e.currentTarget.style.background = 'var(--dark-surface)'
            }
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

