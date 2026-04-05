import { useCallback, useState } from 'react'
import supabase from '@/lib/supabaseClient.js'

export function useLogout() {
  const [loading, setLoading] = useState(false)

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }, [])

  return { logout, loading }
}
