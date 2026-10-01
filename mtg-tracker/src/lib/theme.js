import { useEffect, useState } from 'react'

// Colour themes. Each one is a set of CSS variables in index.css under [data-theme="..."].
export const THEMES = [
  { id: 'midnight', name: 'Midnight', note: 'Deep navy and lavender. Calm, for late-night brewing.', swatch: ['#11131a', '#1b1e29', '#a99bff'] },
  { id: 'ember', name: 'Ember', note: 'Warm charcoal and peach. Cosy, like a kitchen at night.', swatch: ['#16120f', '#211b17', '#f2a56f'] },
  { id: 'chalk', name: 'Chalk', note: 'Light, clean and bright. Gym-floor chalk with a coral accent.', swatch: ['#f3f2ee', '#ffffff', '#e2583e'] },
]

const KEY = 'mtg-tracker:theme'

function read() {
  try {
    return localStorage.getItem(KEY) ?? 'midnight'
  } catch {
    return 'midnight'
  }
}

// The chosen theme, remembered on this device.
export function useTheme() {
  const [theme, setTheme] = useState(read)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // private browsing: just don't remember
    }
  }, [theme])
  return [theme, setTheme]
}
