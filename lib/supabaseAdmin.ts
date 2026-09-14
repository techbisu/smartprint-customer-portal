import 'server-only'
import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY. The service role key bypasses Row Level Security entirely,
// so this file must never be imported from a client component or a route
// that leaks it. The `server-only` import above makes Next.js throw a
// build error if that ever happens by mistake.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})
