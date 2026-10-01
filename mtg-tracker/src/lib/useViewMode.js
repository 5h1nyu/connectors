import { useState } from 'react'

// Remembers whether you like the picture view or the list view (per screen, on this device).
export function useViewMode(name, initial = 'visual') {
  const storageKey = `mtg-tracker:view:${name}`
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(storageKey) ?? initial
    } catch {
      return initial
    }
  })
  const change = (next) => {
    setMode(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // private browsing: just don't remember
    }
  }
  return [mode, change]
}
