import { useEffect } from 'react'

// A small message at the bottom of the screen, with an optional Undo button. Disappears after 8 seconds.
export default function Toast({ message, onUndo, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      {onUndo && <button className="link" onClick={() => { onUndo(); onClose() }}>Undo</button>}
    </div>
  )
}
