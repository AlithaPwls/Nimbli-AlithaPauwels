import { useAuth } from '@/hooks/useAuth.js'

/**
 * Profile row for the current user (same fetch as auth role — no second round-trip).
 */
export function useProfile() {
  const { user, profile, loading } = useAuth()

  return {
    profile: user ? profile : null,
    loading,
  }
}
