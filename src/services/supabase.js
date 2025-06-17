import { createClient } from '@supabase/supabase-js'
import { API_CONFIG } from './api/config'

// Create a single shared Supabase client instance
const supabase = createClient(
  API_CONFIG.SUPABASE.URL,
  API_CONFIG.SUPABASE.ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

export default supabase 