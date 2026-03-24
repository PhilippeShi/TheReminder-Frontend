import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth error:', error)
          navigate('/login')
          return
        }

        if (data.session) {
          navigate('/dashboard')
        } else {
          navigate('/login')
        }
      } catch (error) {
        console.error('Error handling auth callback:', error)
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="spinner" aria-hidden />
        <p>Completing sign-in…</p>
      </div>
    </div>
  )
}
