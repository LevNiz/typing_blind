import { Navigate } from 'react-router-dom'
import { useAdmin } from '@/features/auth/hooks/useAdmin'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoadingUser } = useAuth()
  const isAdmin = useAdmin()

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-foreground-secondary">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedAdminRoute

