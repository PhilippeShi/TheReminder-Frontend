import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authenticatedFetch, handleApiResponse } from '../lib/api'
import { Form, Button, Alert } from 'react-bootstrap'

interface Reminder {
  id: number
  user_id: string
  message: string
  next_reminder: string
  interval: number
  recipient_email: string
  reminders_left: number,
}

export default function Dashboard() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 600)

  // Form state
  const [formData, setFormData] = useState({
    recipient_email: '',
    message: '',
    reminder_date: '',
    reminder_time: '',
    reminders_left: 1,
    interval: 1,
  })

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 600)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'reminders_left' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    if (!formData.reminder_date) {
      setError('Please select a reminder date')
      setSubmitting(false)
      return
    }
    try {
      const date = formData.reminder_date
      let time = formData.reminder_time
      if (!time) time = '00:00'
      const first_reminder_datetime = `${date}T${time}:00`

      const response = await authenticatedFetch('/reminder', {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: formData.recipient_email,
          message: formData.message,
          first_reminder_datetime: first_reminder_datetime,
          num_reminders: formData.reminders_left,
          interval: formData.interval
        })
      })
      await handleApiResponse(response)
      setFormData({
        recipient_email: '',
        message: '',
        reminder_date: '',
        reminder_time: '',
        reminders_left: 1,
        interval: 1,
      })
      setShowForm(false)
      await loadReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder')
    } finally {
      setSubmitting(false)
    }
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
    <div className={`dashboard${isMobile ? ' dashboard-mobile' : ''}`}>
      <div className="dashboard-header d-flex flex-column flex-md-row align-items-md-center align-items-start">
        <h1 className="dashboard-title mb-2 mb-md-0 flex-grow-1">Welcome {session.user.email}!</h1>
        <Button
          variant="outline-secondary"
          onClick={handleLogout}
          className={isMobile ? "w-100 mt-2" : ""}
        >Logout</Button>
      </div>
      <div className="reminders-section">
        <div className={`reminders-header d-flex ${isMobile ? 'flex-column align-items-stretch' : 'justify-content-between align-items-center'} mb-3`}>
          <h2 className="reminders-title mb-2 mb-md-0">Your Reminders</h2>
          <div className={`reminders-actions d-flex ${isMobile ? 'flex-column' : 'flex-row'}`}>
            <Button 
              variant={showForm ? "secondary" : "primary"} 
              onClick={() => setShowForm(!showForm)}
              className={isMobile ? "mb-2" : "me-2"}
              style={isMobile ? { width: '100%' } : undefined}
            >
              {showForm ? 'Cancel' : 'Create Reminder'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={loadReminders}
              className={isMobile ? "mb-2" : ""}
              style={isMobile ? { width: '100%' } : undefined}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {showForm && (
          <Form onSubmit={handleSubmit} className="reminder-form">
            <Form.Group className="mb-3">
              <Form.Label htmlFor="recipient_email">Recipient Email</Form.Label>
              <Form.Control
                type="email"
                id="recipient_email"
                name="recipient_email"
                value={formData.recipient_email}
                onChange={handleInputChange}
                required
                placeholder="example@email.com"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label htmlFor="message">Message</Form.Label>
              <Form.Control
                as="textarea"
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Enter your reminder message..."
              />
            </Form.Group>
            
            <div className={isMobile ? "d-flex flex-column gap-2" : "row"}>
              <Form.Group className={isMobile ? "mb-3" : "mb-3 col-md-4"}>
                <Form.Label htmlFor="reminder_date">Reminder Date</Form.Label>
                <Form.Control
                  type="date"
                  id="reminder_date"
                  name="reminder_date"
                  value={formData.reminder_date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
              
              <Form.Group className={isMobile ? "mb-3" : "mb-3 col-md-4"}>
                <Form.Label htmlFor="reminder_time">Reminder Time (Hour)</Form.Label>
                <Form.Select
                  id="reminder_time"
                  name="reminder_time"
                  value={formData.reminder_time}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select hour</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0')
                    return (
                      <option key={i} value={`${hour}:00`}>
                        {hour}:00
                      </option>
                    )
                  })}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className={isMobile ? "mb-3" : "mb-3 col-md-4"}>
                <Form.Label htmlFor="reminders_left">Number of Reminders</Form.Label>
                <Form.Control
                  type="number"
                  id="reminders_left"
                  name="reminders_left"
                  value={formData.reminders_left}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </Form.Group>
            </div>

            <Form.Group className={isMobile ? "mb-3" : "mb-3 col-md-4"}>
              <Form.Label htmlFor="interval">Interval (in hours)</Form.Label>
              <Form.Control
                type="number"
                id="interval"
                name="interval"
                value={formData.interval}
                onChange={handleInputChange}
                required
                min="1"
              />
            </Form.Group>
            <div className={isMobile ? "d-flex flex-column" : "d-flex justify-content-end"}>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                style={isMobile ? { width: "100%" } : undefined}
              >
                {submitting ? 'Creating...' : 'Create Reminder'}
              </Button>
            </div>
          </Form>
        )}
        
        {error && (
          <Alert variant="danger" className="mt-3">{error}</Alert>
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
              <li key={reminder.id} className={`reminder-item ${isMobile ? 'reminder-item-mobile' : ''}`}>
                <div className="reminder-email" style={isMobile ? { fontSize: '1rem' } : undefined}>
                  To: {reminder.recipient_email}
                </div>
                <div className="reminder-message" style={isMobile ? { fontSize: '0.95rem' } : undefined}>
                  {reminder.message}
                </div>
                <div
                  className="reminder-meta"
                  style={{
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? "0.5em" : undefined
                  }}
                >
                  <div
                    style={{
                      background: 'var(--card-bg, #f8f9fa)',
                      border: '1px solid var(--border-color, #dee2e6)',
                      borderRadius: '999px',
                      padding: isMobile ? '0.35em 0.9em' : '0.4em 1em',
                      marginRight: isMobile ? '0' : '1rem',
                      marginBottom: isMobile ? '0.4rem' : '0',
                      display: 'inline-block',
                      fontSize: isMobile ? '0.93em' : '0.95em',
                      color: 'var(--text-color, #343a40)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    Next Reminder: {new Date(reminder.next_reminder).toLocaleString()}
                  </div>
                  <div
                    style={{
                      background: 'var(--card-bg, #f8f9fa)',
                      border: '1px solid var(--border-color, #dee2e6)',
                      borderRadius: '999px',
                      padding: isMobile ? '0.35em 0.9em' : '0.4em 1em',
                      marginRight: isMobile ? '0' : '1rem',
                      marginBottom: isMobile ? '0.4rem' : '0',
                      display: 'inline-block',
                      fontSize: isMobile ? '0.93em' : '0.95em',
                      color: 'var(--text-color, #343a40)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    Reminders Left: {reminder.reminders_left}
                  </div>
                  <div
                    style={{
                      background: 'var(--card-bg, #f8f9fa)',
                      border: '1px solid var(--border-color, #dee2e6)',
                      borderRadius: '999px',
                      padding: isMobile ? '0.35em 0.9em' : '0.4em 1em',
                      marginRight: isMobile ? '0' : '1rem',
                      marginBottom: isMobile ? '0.4rem' : '0',
                      display: 'inline-block',
                      fontSize: isMobile ? '0.93em' : '0.95em',
                      color: 'var(--text-color, #343a40)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    Interval: {reminder.interval} hours
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}