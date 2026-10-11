import { createContext, useCallback, useEffect, useState } from 'react'

// Each page has its own address after the #, so the browser/phone back button works:
//   #/decks  #/decks/import  #/deck/<id>  #/collection  #/friends  #/me  #/settings  #/u/<username>
export function parseHash(hash) {
  const h = hash.replace(/^#/, '')
  let m
  if ((m = h.match(/^\/u\/([^/?#]+)/))) return { tab: 'public', user: decodeURIComponent(m[1]) }
  if ((m = h.match(/^\/deck\/([^/?#]+)/))) return { tab: 'decks', deck: decodeURIComponent(m[1]) }
  if (h === '/decks/import') return { tab: 'decks', deck: 'import' }
  if ((m = h.match(/^\/(collection|friends|me|settings)$/))) return { tab: m[1] }
  return { tab: 'decks', deck: 'shelf' } // home (also for anything unknown)
}

export function useRoute() {
  const [hash, setHash] = useState(window.location.hash)
  const [trail, setTrail] = useState(() => [window.location.hash]) // where you've been, for the Back button
  useEffect(() => {
    const onChange = () => {
      const h = window.location.hash
      setHash(h)
      setTrail((t) => (t.length > 1 && t[t.length - 2] === h ? t.slice(0, -1) : [...t, h]))
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  // replace: swap the current page instead of adding one (e.g. import form → the new deck),
  // so Back doesn't land on a step you've finished.
  const go = useCallback((path, { replace = false } = {}) => {
    if (window.location.hash === path) return
    if (!replace) {
      window.location.hash = path
      return
    }
    window.history.replaceState(null, '', path)
    setHash(path)
    setTrail((t) => [...t.slice(0, -1), path])
  }, [])
  return { route: parseHash(hash), go, back: () => window.history.back(), canGoBack: trail.length > 1 }
}

// Lets any page header show a Back button.
export const NavContext = createContext({ canGoBack: false, back: () => {} })
