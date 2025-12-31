import { Routes, Route, Navigate } from 'react-router-dom'
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
        <div className="loading">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <h1>TheReminder</h1>
        <ThemeToggle />
      </div>
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
    </div>
  )
}

export default App
