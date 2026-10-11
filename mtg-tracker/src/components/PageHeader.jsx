import { useContext } from 'react'
import { NavContext } from '../lib/route'

// The same header on every page: a Back button, big title, a short line under it, and the main buttons on the right.
// `back` is for steps inside a page (e.g. a friend's deck → their vault); otherwise Back goes to the previous page.
export default function PageHeader({ title, subtitle, actions, back, children }) {
  const nav = useContext(NavContext)
  const goBack = back ?? (nav.canGoBack ? { label: 'Back', onClick: nav.back } : null)
  return (
    <header className="page-header">
      {goBack && <button className="link back" onClick={goBack.onClick}>← {goBack.label}</button>}
      <div className="page-header-row">
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
