import { createClient } from '@supabase/supabase-js'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'

// null until src/config.js is filled in; the app then works offline-only like before.
export const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

export async function fetchCloud(userId) {
  const { data, error } = await supabase
    .from('collections')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data // null if you've never synced
}

export async function pushCloud(userId, state) {
  const { data, error } = await supabase
    .from('collections')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() })
    .select('updated_at')
    .single()
  if (error) throw error
  return data.updated_at
}
