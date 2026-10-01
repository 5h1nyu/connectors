import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCloud, openedFromResetLink, pushCloud, supabase } from './supabase'

// Keeps this device and your Supabase copy in step.
//  - Every change you make is uploaded ~1.5s later.
//  - When you open/return to the app, newer data from your other device is downloaded.
//  - If both devices changed while out of sync, you're asked which one to keep.

const META_KEY = 'mtg-tracker:sync' // { lastSyncedAt, dirty } - remembered across reloads

function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) ?? {}
  } catch {
    return {}
  }
}
const writeMeta = (meta) => localStorage.setItem(META_KEY, JSON.stringify(meta))

const summary = (s) => `${s.decks.length} decks, ${s.loose.length} loose cards`

export function useCloudSync(state, replaceState) {
  const [user, setUser] = useState(null)
  const [recovering, setRecovering] = useState(openedFromResetLink) // true after clicking a "reset password" email link
  const [status, setStatus] = useState('synced')
  const [errorDetail, setErrorDetail] = useState(null) // Supabase's own error message, shown in Settings // 'synced' | 'saving' | 'error' while logged in
  const fromCloud = useRef(false) // true while applying downloaded data, so we don't upload it straight back
  const prevState = useRef(state)
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  }, [state])

  // Who's logged in?
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const upload = useCallback(async () => {
    setStatus('saving')
    try {
      const updatedAt = await pushCloud(user.id, latest.current)
      writeMeta({ lastSyncedAt: updatedAt, dirty: false })
      setStatus('synced')
      setErrorDetail(null)
    } catch (err) {
      setStatus('error')
      setErrorDetail([err.code, err.message, err.hint].filter(Boolean).join(' · '))
    }
  }, [user])

  // Download if the cloud has something newer than what this device last saw.
  const pull = useCallback(async () => {
    try {
      const cloud = await fetchCloud(user.id)
      const meta = readMeta()
      if (!cloud) return upload() // first time: this device's data becomes the cloud copy
      if (cloud.updated_at === meta.lastSyncedAt) {
        if (meta.dirty) return upload()
        return setStatus('synced')
      }
      const local = latest.current
      const localEmpty = local.decks.length === 0 && local.loose.length === 0
      const keepCloud =
        localEmpty ||
        !meta.dirty ||
        confirm(
          `Your cloud copy and this device both changed.\n\nCloud: ${summary(cloud.data)}\nThis device: ${summary(local)}\n\nOK = use the cloud copy, Cancel = keep this device's copy`,
        )
      if (keepCloud) {
        fromCloud.current = true
        replaceState(cloud.data)
        writeMeta({ lastSyncedAt: cloud.updated_at, dirty: false })
        setStatus('synced')
      } else {
        upload()
      }
    } catch (err) {
      setStatus('error')
      setErrorDetail([err.code, err.message, err.hint].filter(Boolean).join(' · '))
    }
  }, [user, replaceState, upload])

  // On login, and whenever you come back to the tab/app.
  useEffect(() => {
    if (!user) return
    // pull() only updates state after waiting for Supabase, so this is safe.
    // oxlint-disable-next-line react/set-state-in-effect
    pull()
    const onVisible = () => document.visibilityState === 'visible' && pull()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, pull])

  // Upload after you change something.
  useEffect(() => {
    if (prevState.current === state) return // re-ran because you logged in/out, not because data changed
    prevState.current = state
    if (fromCloud.current) {
      fromCloud.current = false
      return
    }
    writeMeta({ ...readMeta(), dirty: true })
    if (!user) return
    const timer = setTimeout(upload, 1500)
    return () => clearTimeout(timer)
  }, [state, user, upload])

  // Phones often add a space or a capital letter to emails; clean that up.
  const clean = (email) => email.trim().toLowerCase()
  const appUrl = window.location.origin + window.location.pathname // where email links send you back to
  const auth = {
    signIn: (email, password) => supabase.auth.signInWithPassword({ email: clean(email), password }),
    signUp: (email, password) =>
      supabase.auth.signUp({ email: clean(email), password, options: { emailRedirectTo: appUrl } }),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(clean(email), { redirectTo: appUrl }),
    setNewPassword: async (password) => {
      const result = await supabase.auth.updateUser({ password })
      if (!result.error) setRecovering(false)
      return result
    },
    signOut: () => supabase.auth.signOut(),
  }

  const lastSyncedAt = status === 'synced' ? readMeta().lastSyncedAt : null
  return { user, recovering, errorDetail, lastSyncedAt, retry: pull, status: !supabase ? 'not-set-up' : user ? status : 'signed-out', auth }
}
