import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabaseClient.js'

// De lege doos aanmaken
const AuthContext = createContext()

// De Provider component
export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Stap 1: check wie er ingelogd is bij het opstarten
    async function getSession() {
      const { data } = await supabase.auth.getSession()

      setUser(data.session?.user ?? null)

      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single()

        setRole(profile?.role ?? null)
      }

      setLoading(false)
    }

    getSession()

    }, [])


    return (
        <AuthContext.Provider value={{ user, role, loading }}>
        {children}
        </AuthContext.Provider>
    )
    }

    // Custom hook om de context makkelijk te gebruiken
    export function useAuth() {
    return useContext(AuthContext)
    }