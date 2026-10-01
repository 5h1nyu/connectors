import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCloud, pushCloud, supabase } from './supabase'

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
  const [status, setStatus] = useState('synced') // 'synced' | 'saving' | 'error' while logged in
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
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const upload = useCallback(async () => {
    setStatus('saving')
    try {
      const updatedAt = await pushCloud(user.id, latest.current)
      writeMeta({ lastSyncedAt: updatedAt, dirty: false })
      setStatus('synced')
    } catch {
      setStatus('error')
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
    } catch {
      setStatus('error')
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

  const auth = {
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) =>
      supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href.split('#')[0] } }),
    signOut: () => supabase.auth.signOut(),
  }

  return { user, status: !supabase ? 'not-set-up' : user ? status : 'signed-out', auth }
}
