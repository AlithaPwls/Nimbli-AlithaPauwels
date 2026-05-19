import { createClient } from '@supabase/supabase-js'

// Local dev (`npm run dev`): optional VITE_SUPABASE_LOCAL_* → old/test project.
// Vercel staging & production: only VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (never LOCAL_*).
const supabaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_LOCAL_URL || import.meta.env.VITE_SUPABASE_URL
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_ANON_LOCAL_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
