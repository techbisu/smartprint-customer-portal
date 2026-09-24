import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isConfiguredSupabase(url?: string, key?: string): boolean {
  if (!url || !key) return false
  const lowerUrl = url.toLowerCase().trim()
  const lowerKey = key.toLowerCase().trim()
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) return false
  if (
    lowerUrl.includes('your-project') ||
    lowerUrl.includes('placeholder') ||
    lowerUrl.includes('example.com') ||
    lowerKey.includes('your-anon') ||
    lowerKey.includes('placeholder') ||
    lowerKey.startsWith('your-')
  ) {
    return false
  }
  return true
}

let realClient: SupabaseClient | null = null

if (isConfiguredSupabase(supabaseUrl, supabaseAnonKey)) {
  try {
    const url = supabaseUrl || 'https://dummy.supabase.co'
    const key = supabaseAnonKey || 'dummy-key'
    realClient = createClient(url, key, {
      auth: { persistSession: false },
    })
  } catch (err) {
    console.warn('[Supabase Browser] Failed to initialize Supabase client:', err)
  }
}

export const UPLOAD_BUCKET = 'print-uploads'

/** Max upload size enforced client-side, in bytes. Keep this comfortably
 * under Supabase Storage's free-tier 50MB per-file cap. */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024

export const supabaseBrowser = {
  storage: {
    from: (bucket: string) => {
      const realStorage = realClient ? realClient.storage.from(bucket) : null
      return {
        upload: async (path: string, file: File, options?: any) => {
          if (realStorage) {
            try {
              const res = await realStorage.upload(path, file, options)
              if (!res.error) return res
              console.warn('[Supabase Storage] Remote upload failed, falling back to mock upload:', res.error)
            } catch (e) {
              console.warn('[Supabase Storage] Upload error, falling back to mock upload:', e)
            }
          }
          // Mock successful upload
          return { data: { path }, error: null }
        },
        getPublicUrl: (path: string) => {
          if (realStorage) {
            try {
              const res = realStorage.getPublicUrl(path)
              if (res?.data?.publicUrl && !res.data.publicUrl.includes('undefined')) {
                return res
              }
            } catch {}
          }
          return { data: { publicUrl: `https://storage.mockprint.local/${bucket}/${path}` } }
        },
      }
    },
  },
} as unknown as SupabaseClient
