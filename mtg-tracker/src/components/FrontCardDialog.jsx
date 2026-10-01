import { useState } from 'react'
import Portal from './Portal'

// Pick which of the deck's cards goes on the front of its stack (and whether it's the commander).
export default function FrontCardDialog({ deck, onPick, onCancel }) {
  const seen = new Set()
  const cards = deck.cards.filter((e) => e.status !== 'out' && e.card?.image && !seen.has(e.name) && seen.add(e.name))
  const [isCommander, setIsCommander] = useState(!!deck.commander && deck.commander === deck.cover)

  return (
    <Portal>
      <div className="dialog-backdrop top" onClick={onCancel}>
        <div className="dialog wide" onClick={(e) => e.stopPropagation()}>
          <div className="row">
            <h2>Choose the front card</h2>
            <button className="icon close" onClick={onCancel} aria-label="Close">✕</button>
          </div>
          <label className="row small">
            <input type="checkbox" checked={isCommander} onChange={(e) => setIsCommander(e.target.checked)} />
            It's also the deck's commander (used when exporting)
          </label>
          <div className="printing-grid">
            {cards.map((e) => (
              <button
                key={e.name}
                className={`printing ${deck.cover === e.name ? 'current' : ''}`}
                onClick={() => onPick(e.name, { commander: isCommander })}
              >
                <img src={e.card.imageSmall ?? e.card.image} alt="" loading="lazy" />
                <span className="printing-label">
                  <strong>{e.name}</strong>
                  {deck.cover === e.name && <span className="muted">Current front card</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  )
}
