import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authenticatedFetch, handleApiResponse } from '../lib/api'

/** Matches public.reminders (Supabase) */
interface Reminder {
  id: number
  user_id: string
  recipient_email: string | null
  message: string | null
  next_reminder: string | null
  reminders_left: number
  interval: number
  created_at?: string
}

function formatReminderTime(iso: string | null): string {
  if (!iso) return 'Not scheduled'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalToIso(local: string): string {
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date and time')
  }
  return d.toISOString()
}

export default function Dashboard() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [nextReminderLocal, setNextReminderLocal] = useState('')
  const [remindersLeft, setRemindersLeft] = useState(1)
  const [intervalHours, setIntervalHours] = useState(24)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  const openCreate = () => {
    setEditingId(null)
    setRecipientEmail('')
    setMessage('')
    setNextReminderLocal(toDatetimeLocalValue(new Date().toISOString()))
    setRemindersLeft(1)
    setIntervalHours(24)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (r: Reminder) => {
    setEditingId(r.id)
    setRecipientEmail(r.recipient_email ?? '')
    setMessage(r.message ?? '')
    setNextReminderLocal(
      r.next_reminder
        ? toDatetimeLocalValue(r.next_reminder)
        : toDatetimeLocalValue(new Date().toISOString()),
    )
    setRemindersLeft(r.reminders_left)
    setIntervalHours(r.interval > 0 ? r.interval : 24)
    setFormError(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      let next_reminder: string
      try {
        next_reminder = fromDatetimeLocalToIso(nextReminderLocal)
      } catch {
        setFormError('Please choose a valid date and time.')
        setSaving(false)
        return
      }

      const body: Record<string, string | number> = {
        recipient_email: recipientEmail.trim(),
        message: message.trim(),
        next_reminder,
        reminders_left: remindersLeft,
        interval: intervalHours,
      }

      if (!body.recipient_email || !body.message) {
        setFormError('Recipient email and message are required.')
        setSaving(false)
        return
      }

      if (intervalHours < 1) {
        setFormError('Interval must be at least 1 hour.')
        setSaving(false)
        return
      }

      if (editingId == null) {
        const res = await authenticatedFetch('/reminder', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        await handleApiResponse<Reminder>(res)
      } else {
        const res = await authenticatedFetch(`/reminder/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        await handleApiResponse<Reminder>(res)
      }
      closeForm()
      await loadReminders()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this reminder? This cannot be undone.')) {
      return
    }
    setError(null)
    try {
      const res = await authenticatedFetch(`/reminder/${id}`, { method: 'DELETE' })
      await handleApiResponse<{ ok?: boolean }>(res)
      if (editingId === id) {
        closeForm()
      }
      await loadReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder')
    }
  }

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-card">
          <div className="spinner" aria-hidden />
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Signed in as {session.user.email}</p>
        </div>
        <div className="dashboard-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
      <div className="reminders-section">
        <div className="reminders-header">
          <h2 className="reminders-title">Your reminders</h2>
          <div className="reminders-header-actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={openCreate}
              disabled={loadingReminders}
            >
              New reminder
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={loadReminders}
              disabled={loadingReminders}
            >
              Refresh
            </button>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {formOpen && (
          <form className="reminder-form" onSubmit={handleSubmit} noValidate>
            <h3 className="reminder-form-title">{editingId == null ? 'New reminder' : 'Edit reminder'}</h3>
            {formError && <div className="error-message">{formError}</div>}
            <div className="form-field">
              <label className="form-label" htmlFor="recipient-email">
                Recipient email
              </label>
              <input
                id="recipient-email"
                type="email"
                autoComplete="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reminder-message">
                Message
              </label>
              <textarea
                id="reminder-message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="next-reminder-when">
                Next reminder
              </label>
              <input
                id="next-reminder-when"
                type="datetime-local"
                required
                value={nextReminderLocal}
                onChange={(e) => setNextReminderLocal(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reminders-left">
                Reminders left{' '}
                <span className="form-label-hint">(emails still to send, ≥ 0)</span>
              </label>
              <input
                id="reminders-left"
                type="number"
                min={0}
                step={1}
                required
                value={remindersLeft}
                onChange={(e) => setRemindersLeft(Number.parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="interval-hours">
                Repeat interval{' '}
                <span className="form-label-hint">(hours between sends, minimum 1)</span>
              </label>
              <input
                id="interval-hours"
                type="number"
                min={1}
                step={1}
                required
                value={intervalHours}
                onChange={(e) => setIntervalHours(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : editingId == null ? 'Create' : 'Save changes'}
              </button>
              <button type="button" className="btn btn--secondary" disabled={saving} onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        )}
        {loadingReminders ? (
          <div className="loading loading--inline" role="status" aria-live="polite">
            <div className="spinner" aria-hidden />
            <p>Loading reminders…</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="empty-state">
            <p>No reminders yet. Create your first reminder!</p>
            <p className="empty-state-hint">Scheduled reminders will show up here with recipient, message, and time.</p>
            <div className="empty-state-actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
                New reminder
              </button>
            </div>
          </div>
        ) : (
          <ul className="reminders-list">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="reminder-item">
                <div className="reminder-to-label">Recipient</div>
                <div className="reminder-email">{reminder.recipient_email ?? '—'}</div>
                <div className="reminder-message">{reminder.message ?? '—'}</div>
                <div className="reminder-item-footer">
                  <div className="reminder-meta">
                    <span className="pill pill--accent">Next {formatReminderTime(reminder.next_reminder)}</span>
                    <span className="pill">
                      {reminder.reminders_left} left · every {reminder.interval}h
                    </span>
                  </div>
                  <div className="reminder-item-actions">
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => openEdit(reminder)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      Delete
                    </button>
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
