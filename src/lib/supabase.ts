import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Null until a Supabase project is connected (milestone M2). Until then the app
 * runs on mock data so the UI can be built and reviewed without a backend.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true } }) : null

/** Every user gets an anonymous account on first launch (name + city only, no email). */
export async function ensureSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const { data: signed, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return signed.session
}
