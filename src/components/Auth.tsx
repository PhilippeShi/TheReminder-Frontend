import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function AuthComponent() {
  const navigate = useNavigate()
  const { session } = useAuth()

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (session) {
      navigate('/dashboard')
    }
  }, [session, navigate])

  return (
    <div className="auth-container">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
        redirectTo={window.location.origin + '/auth/callback'}
      />
    </div>
  )
}

