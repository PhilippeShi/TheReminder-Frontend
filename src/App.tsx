import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'
import AuthCallback from './components/AuthCallback'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="loading-card">
            <div className="spinner" aria-hidden />
            <p>Loading…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="header-brand">
          <span className="header-logo">TheReminder</span>
          <span className="header-tagline">Email reminders</span>
        </Link>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <AuthComponent />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
