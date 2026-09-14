import { createClient } from '@supabase/supabase-js'

// This client is safe to ship to the browser: it only ever uses the anon
// key, and the actual access control is enforced by Supabase Row Level
// Security policies (see the hosting guide's SQL). It never touches the
// service role key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

export const UPLOAD_BUCKET = 'print-uploads'

/** Max upload size enforced client-side, in bytes. Keep this comfortably
 * under Supabase Storage's free-tier 50MB per-file cap. */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024
