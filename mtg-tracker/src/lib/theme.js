import { useEffect, useState } from 'react'

// Colour themes.
// The three "vibes" are written out in index.css under [data-theme="..."].
// The mana themes are worked out here from each colour, and set as CSS variables on the page.

export const THEMES = [
  { id: 'midnight', name: 'Midnight', note: 'Deep navy and lavender. Calm, for late-night brewing.', swatch: ['#11131a', '#1b1e29', '#a99bff'] },
  { id: 'ember', name: 'Ember', note: 'Warm charcoal and peach. Cosy, like a kitchen at night.', swatch: ['#16120f', '#211b17', '#f2a56f'] },
  { id: 'chalk', name: 'Chalk', note: 'Light, clean and bright. Gym-floor chalk with a coral accent.', swatch: ['#f3f2ee', '#ffffff', '#e2583e'] },
]

// Each Magic colour: its accent and a dark background tint.
const MANA = {
  W: { name: 'White', accent: '#f1dc9a', tint: '#1b1913' },
  U: { name: 'Blue', accent: '#72b2ff', tint: '#0e1520' },
  B: { name: 'Black', accent: '#c1aee0', tint: '#141118' },
  R: { name: 'Red', accent: '#ff8064', tint: '#1d1110' },
  G: { name: 'Green', accent: '#78d597', tint: '#0f1813' },
}

const GUILDS = [
  ['WU', 'Azorius'], ['UB', 'Dimir'], ['BR', 'Rakdos'], ['RG', 'Gruul'], ['GW', 'Selesnya'],
  ['WB', 'Orzhov'], ['UR', 'Izzet'], ['BG', 'Golgari'], ['RW', 'Boros'], ['GU', 'Simic'],
]

export const MANA_THEMES = [
  ...Object.entries(MANA).map(([c, m]) => ({ id: `mana-${c}`, name: `Mono ${m.name}`, colors: [c] })),
  ...GUILDS.map(([pair, name]) => ({ id: `mana-${pair}`, name, colors: pair.split('') })),
]

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t))
const alpha = (h, a) => `rgb(${hex(h).join(' ')} / ${a})`

// All the CSS variables for a mana theme, e.g. "mana-UB" (Dimir).
function manaVars(id) {
  const [first, second = first] = id.replace('mana-', '').split('').map((c) => MANA[c])
  const bg = mix(first.tint, second.tint, 0.5)
  return {
    '--bg': bg,
    '--surface': mix(bg, '#ffffff', 0.045),
    '--surface-2': mix(bg, '#ffffff', 0.085),
    '--line': 'rgb(255 255 255 / 0.07)',
    '--line-strong': 'rgb(255 255 255 / 0.14)',
    '--text': mix('#ecebf0', first.accent, 0.08),
    '--muted': mix('#9599a8', first.accent, 0.12),
    '--accent': first.accent,
    '--accent-ink': '#121214',
    '--accent-soft': alpha(first.accent, 0.13),
    '--accent-2': second.accent,
    '--sigil': second.accent,
    '--sigil-opacity': '0.1',
    '--green': '#8fd6a4',
    '--blue': '#8ec5ff',
    '--gold': '#f0cd7c',
    '--red': '#ff8f7a',
    '--shadow': '0 10px 30px rgb(0 0 0 / 0.35)',
  }
}

const KEY = 'mtg-tracker:theme'
const VARS_KEY = 'mtg-tracker:theme-vars' // read by index.html so the page opens in the right colours

function read() {
  try {
    return localStorage.getItem(KEY) ?? 'midnight'
  } catch {
    return 'midnight'
  }
}

function apply(theme) {
  const root = document.documentElement
  const vars = theme.startsWith('mana-') ? manaVars(theme) : {}
  root.dataset.theme = theme.startsWith('mana-') ? 'mana' : theme
  root.removeAttribute('style')
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  try {
    localStorage.setItem(KEY, theme)
    localStorage.setItem(VARS_KEY, JSON.stringify(vars))
  } catch {
    // private browsing: just don't remember
  }
}

// The chosen theme, remembered on this device.
export function useTheme() {
  const [theme, setTheme] = useState(read)
  useEffect(() => apply(theme), [theme])
  return [theme, setTheme]
}
