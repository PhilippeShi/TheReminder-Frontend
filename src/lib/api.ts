import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/**
 * Make an authenticated API call to the Flask backend
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No active session')
  }

  // Add Authorization header with Bearer token
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)
  headers.set('Content-Type', 'application/json')

  // Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return response
}

/**
 * Helper function to handle API responses (reads body once; supports empty success bodies)
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!response.ok) {
    let message = 'API request failed'
    if (text.trim()) {
      try {
        const error = JSON.parse(text) as { error_message?: string; error?: string }
        message = error.error_message || error.error || message
      } catch {
        message = text
      }
    }
    throw new Error(message)
  }
  if (!text.trim()) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

