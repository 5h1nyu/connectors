import { useCallback, useEffect, useState } from 'react'
import { getProfile, saveProfile } from './social'

// Your own profile (username, picture, collection visibility), loaded when you log in.
export function useProfile(user) {
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'ready' | 'missing' | 'error'
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setStatus('loading')
    try {
      const p = await getProfile(user.id)
      setProfile(p)
      setStatus(p ? 'ready' : 'missing')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [user])

  useEffect(() => {
    // load() only sets state after waiting for Supabase.
    // oxlint-disable-next-line react/set-state-in-effect
    load()
  }, [load])

  const save = async (changes) => {
    const next = await saveProfile({ ...(profile ?? {}), ...changes, id: user.id })
    setProfile(next)
    setStatus('ready')
    return next
  }

  return { profile: user ? profile : null, status: user ? status : 'idle', error, save, reload: load }
}
