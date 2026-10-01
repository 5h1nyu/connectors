import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'

// Your picture in the top corner. Click it for: your profile, settings, log out.
export default function HeaderMenu({ user, profile, onNavigate, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const go = (tab) => {
    setOpen(false)
    onNavigate(tab)
  }

  return (
    <div className="header-menu" ref={ref}>
      <button className="header-avatar" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} title="Your profile and settings">
        {user ? <Avatar profile={profile ?? { username: user.email }} size={36} /> : <span className="avatar guest">?</span>}
        <span className="chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          {user && (
            <div className="menu-who">
              <strong>{profile?.display_name || profile?.username || 'Your account'}</strong>
              <small className="muted">{user.email}</small>
            </div>
          )}
          <button role="menuitem" onClick={() => go('me')}>{user ? 'Your profile' : 'Log in / sign up'}</button>
          <button role="menuitem" onClick={() => go('settings')}>Settings</button>
          {user && (
            <button role="menuitem" className="danger-text" onClick={() => { setOpen(false); onSignOut() }}>Log out</button>
          )}
        </div>
      )}
    </div>
  )
}
