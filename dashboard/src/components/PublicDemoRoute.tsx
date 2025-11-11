import { useEffect } from 'react'
import { setDemoMode } from '../utils/auth'

interface PublicDemoRouteProps {
  children: React.ReactElement
}

/**
 * PublicDemoRoute automatically enables demo mode when accessed.
 * This allows the dashboard to be viewed in an iframe without authentication.
 */
function PublicDemoRoute({ children }: PublicDemoRouteProps) {
  useEffect(() => {
    // Automatically enable demo mode when this route is accessed
    setDemoMode()
  }, [])

  return children
}

export default PublicDemoRoute

