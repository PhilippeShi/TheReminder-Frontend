import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabasePublishableKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

