import { useEffect } from 'react'
import Dashboard from './Dashboard'
import { setDemoMode } from '../utils/auth'

/**
 * DashboardPreview is a read-only version of the Dashboard
 * designed to be embedded in iframes. It automatically enables
 * demo mode and hides navigation/actions.
 */
function DashboardPreview() {
  useEffect(() => {
    // Automatically enable demo mode when preview is accessed
    setDemoMode()
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--gray-light)',
      padding: '0'
    }}>
      <Dashboard />
    </div>
  )
}

export default DashboardPreview

