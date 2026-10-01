import { useEffect, useState } from 'react'

// Colour themes: a primary colour (buttons, logo, highlights) and an accent (the sigils, selections).
// Pick a Magic colour pair, or any two colours you like. Everything else is worked out from those two.

// Each Magic colour: its colour and a dark background tint. Black is ash and bone, not purple.
const MANA = {
  W: { name: 'White', colour: '#f1dc9a', tint: '#1b1913' },
  U: { name: 'Blue', colour: '#72b2ff', tint: '#0e1520' },
  B: { name: 'Black', colour: '#cfc8bd', tint: '#121212' },
  R: { name: 'Red', colour: '#ff8064', tint: '#1d1110' },
  G: { name: 'Green', colour: '#78d597', tint: '#0f1813' },
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
const brightness = (h) => {
  const [r, g, b] = hex(h)
  return (r * 299 + g * 587 + b * 114) / 255000
}

// Make sure a colour stands out on a dark background (very dark picks get lifted).
const readable = (h) => (brightness(h) < 0.45 ? mix(h, '#ffffff', 0.45 - brightness(h)) : h)

// All the page's CSS variables from a primary colour, an accent and a background tint.
export function themeVars(primary, accent, tint) {
  const p = readable(primary)
  const a = readable(accent)
  const bg = tint ?? mix('#0e0f13', primary, 0.07)
  return {
    '--bg': bg,
    '--surface': mix(bg, '#ffffff', 0.045),
    '--surface-2': mix(bg, '#ffffff', 0.085),
    '--line': 'rgb(255 255 255 / 0.07)',
    '--line-strong': 'rgb(255 255 255 / 0.14)',
    '--text': mix('#ecebf0', p, 0.06),
    '--muted': mix('#9599a8', p, 0.1),
    '--accent': p,
    '--accent-ink': brightness(p) > 0.55 ? '#121214' : '#ffffff',
    '--accent-soft': alpha(p, 0.13),
    '--accent-2': a,
    '--sigil': a,
    '--sigil-opacity': '0.1',
    '--green': '#8fd6a4',
    '--blue': '#8ec5ff',
    '--gold': '#f0cd7c',
    '--red': '#ff8f7a',
    '--shadow': '0 10px 30px rgb(0 0 0 / 0.35)',
  }
}

function varsFor(theme, custom) {
  if (theme === 'custom') return themeVars(custom.primary, custom.accent)
  if (theme.startsWith('mana-')) {
    const [first, second = first] = theme.slice(5).split('').map((c) => MANA[c])
    return themeVars(first.colour, second.colour, mix(first.tint, second.tint, 0.5))
  }
  return {} // the original look (index.css)
}

const KEY = 'mtg-tracker:theme'
const CUSTOM_KEY = 'mtg-tracker:theme-custom'
const VARS_KEY = 'mtg-tracker:theme-vars' // read by index.html so the page opens in the right colours
const FONT_KEY = 'mtg-tracker:brand-font'

export const DEFAULT_CUSTOM = { primary: '#a99bff', accent: '#72b2ff' }

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // private browsing: just don't remember
  }
}

// The old "vibe" themes were removed; anyone still on one gets the matching custom colours.
function migrate(theme) {
  if (theme === 'midnight' || theme === 'chalk') return 'custom'
  if (theme === 'ember') return 'mana-R'
  return theme
}

function readTheme() {
  try {
    const raw = localStorage.getItem(KEY)
    return migrate(raw ?? 'custom')
  } catch {
    return 'custom'
  }
}

// The chosen theme + custom colours, remembered on this device.
export function useTheme() {
  const [theme, setTheme] = useState(readTheme)
  const [custom, setCustom] = useState(() => read(CUSTOM_KEY, DEFAULT_CUSTOM))
  useEffect(() => {
    const vars = varsFor(theme, custom)
    const root = document.documentElement
    root.dataset.theme = 'mana'
    root.removeAttribute('style')
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.style.setProperty('--brand-font', BRAND_FONTS[readFontId()]?.family ?? BRAND_FONTS.wizard.family)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // ignore
    }
    write(CUSTOM_KEY, custom)
    write(VARS_KEY, { ...vars, '--brand-font': BRAND_FONTS[readFontId()]?.family })
  }, [theme, custom])
  return { theme, setTheme, custom, setCustom }
}

// Fonts for the "SHINYU'S VAULT" title.
export const BRAND_FONTS = {
  wizard: { name: 'Wizard', family: "'Uncial Antiqua', serif" },
  regal: { name: 'Regal', family: "'Cinzel Decorative', serif" },
  blocky: { name: 'Blocky', family: "'Bungee', sans-serif" },
  fluid: { name: 'Fluid', family: "'Righteous', sans-serif" },
  clean: { name: 'Clean', family: "'Inter', sans-serif" },
}

function readFontId() {
  const id = read(FONT_KEY, 'wizard')
  return BRAND_FONTS[id] ? id : 'wizard'
}

export function useBrandFont() {
  const [font, setFont] = useState(readFontId)
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-font', BRAND_FONTS[font].family)
    write(FONT_KEY, font)
    const vars = read(VARS_KEY, {})
    write(VARS_KEY, { ...vars, '--brand-font': BRAND_FONTS[font].family })
  }, [font])
  return [font, setFont]
}
