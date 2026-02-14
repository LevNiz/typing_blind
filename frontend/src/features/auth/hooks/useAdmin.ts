import { useAuth } from './useAuth'

/**
 * Hook to check if current user is admin.
 * @returns {boolean} True if user is admin, false otherwise
 */
export function useAdmin(): boolean {
  const { user } = useAuth()
  return user?.is_admin ?? false
}

