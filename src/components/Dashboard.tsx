import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authenticatedFetch, handleApiResponse } from '../lib/api'

interface Reminder {
  id: number
  user_id: string
  recipient_email: string
  message: string
  reminder_time: string
  num_reminders: number
}

export default function Dashboard() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login')
    }
  }, [session, loading, navigate])

  useEffect(() => {
    if (session) {
      loadReminders()
    }
  }, [session])

  const loadReminders = async () => {
    setLoadingReminders(true)
    setError(null)
    try {
      const response = await authenticatedFetch('/reminders')
      const data = await handleApiResponse<Reminder[]>(response)
      setReminders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders')
    } finally {
      setLoadingReminders(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome {session.user.email}!</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="reminders-section">
        <div className="reminders-header">
          <h2 className="reminders-title">Your Reminders</h2>
          <button onClick={loadReminders}>Refresh</button>
        </div>
        {error && (
          <div className="error-message">{error}</div>
        )}
        {loadingReminders ? (
          <div className="loading">
            <p>Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="empty-state">
            <p>No reminders yet. Create your first reminder!</p>
          </div>
        ) : (
          <ul className="reminders-list">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="reminder-item">
                <div className="reminder-email">To: {reminder.recipient_email}</div>
                <div className="reminder-message">{reminder.message}</div>
                <div className="reminder-meta">
                  Time: {reminder.reminder_time} | Reminders: {reminder.num_reminders}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

