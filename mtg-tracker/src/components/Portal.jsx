import { createPortal } from 'react-dom'

// Puts popups straight onto the page body, so they always open in the middle of the screen
// (never trapped inside a moving or tilted part of the page). Clicks inside don't leak out to
// whatever opened the popup.
export default function Portal({ children }) {
  return createPortal(<div className="portal" onClick={(e) => e.stopPropagation()}>{children}</div>, document.body)
}
