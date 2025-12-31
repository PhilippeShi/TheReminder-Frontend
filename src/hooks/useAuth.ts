import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']

export function useAuth() {
  const [session, setSession] = useState<Session>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}

