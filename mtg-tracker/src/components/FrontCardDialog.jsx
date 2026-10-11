import Portal from './Portal'
import { canBeCommander } from '../lib/collection'

// Pick the deck's commander from the cards that can actually be one (legendary creatures etc.).
// The commander is also the card shown on the front of the deck.
export default function FrontCardDialog({ deck, onPick, onCancel }) {
  const seen = new Set()
  const options = deck.cards.filter(
    (e) => e.status !== 'out' && canBeCommander(e.card) && !seen.has(e.name) && seen.add(e.name),
  )

  return (
    <Portal>
      <div className="dialog-backdrop top" onClick={onCancel}>
        <div className="dialog wide" onClick={(e) => e.stopPropagation()}>
          <div className="row">
            <h2>Choose your commander</h2>
            <button className="icon close" onClick={onCancel} aria-label="Close">✕</button>
          </div>
          {options.length === 0 ? (
            <p className="muted">
              There's no legendary creature in this deck yet. Add one (search it in the box on the deck page), then
              come back here to make it the commander.
            </p>
          ) : (
            <>
              <p className="muted small">Only cards that can be a commander are shown: legendary creatures, and cards that say "can be your commander".</p>
              <div className="printing-grid">
                {options.map((e) => (
                  <button key={e.name} className={`printing ${deck.commander === e.name ? 'current' : ''}`} onClick={() => onPick(e.name, { commander: true })}>
                    {e.card.image ? <img src={e.card.imageSmall ?? e.card.image} alt="" loading="lazy" /> : <span className="no-image">{e.name}</span>}
                    <span className="printing-label">
                      <strong>{e.name}</strong>
                      {deck.commander === e.name && <span className="muted">Current commander</span>}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}
