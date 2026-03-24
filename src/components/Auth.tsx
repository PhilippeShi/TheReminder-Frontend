import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'

export default function AuthComponent() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    if (session) {
      navigate('/dashboard')
    }
  }, [session, navigate])

  const appearance = useMemo(
    () => ({
      theme: ThemeSupa,
      variables: {
        default: {
          colors:
            theme === 'light'
              ? {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  brandButtonText: '#ffffff',
                  inputBackground: '#ffffff',
                  inputBorder: '#cbd5e1',
                  inputBorderHover: '#94a3b8',
                  inputBorderFocus: '#2563eb',
                  inputText: '#0f172a',
                  inputLabelText: '#475569',
                  inputPlaceholder: '#94a3b8',
                  dividerBackground: '#e2e8f0',
                  anchorTextColor: '#2563eb',
                  anchorTextHoverColor: '#1d4ed8',
                }
              : {
                  brand: '#3b82f6',
                  brandAccent: '#60a5fa',
                  brandButtonText: '#ffffff',
                  inputBackground: '#1e293b',
                  inputBorder: '#475569',
                  inputBorderHover: '#64748b',
                  inputBorderFocus: '#3b82f6',
                  inputText: '#e8eaed',
                  inputLabelText: '#94a3b8',
                  inputPlaceholder: '#64748b',
                  dividerBackground: '#334155',
                  anchorTextColor: '#60a5fa',
                  anchorTextHoverColor: '#93c5fd',
                },
          radii: {
            borderRadiusButton: '10px',
            buttonBorderRadius: '10px',
            inputBorderRadius: '10px',
          },
          fonts: {
            bodyFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            buttonFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            inputFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            labelFontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          },
        },
      },
    }),
    [theme],
  )

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <Auth
          supabaseClient={supabase}
          appearance={appearance}
          dark={theme === 'dark'}
          providers={['google']}
          redirectTo={window.location.origin + '/auth/callback'}
        />
      </div>
    </div>
  )
}
