import { useOpenCard } from '../lib/previewContext'
import { useTilt } from '../lib/useTilt'

// A clickable card picture. It leans towards the mouse with a foil-like shine.
// Click opens the card page; the tick box selects it.
export default function CardImage({ card, name, qty, dim, small, badge, selected, onToggle, index = 0 }) {
  const openCard = useOpenCard()
  const { ref: tiltRef, onPointerMove, onPointerLeave } = useTilt(9)
  return (
    <div
      ref={tiltRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`card-tile ${dim ? 'dim' : ''} ${selected ? 'selected' : ''} ${badge?.kind === 'buy' ? 'wanted' : ''}`}
      style={{ '--n': index }}
    >
      <button className="card-face" onClick={() => card && openCard(card)} title={name}>
        {card?.image ? (
          <img src={small ? card.imageSmall ?? card.image : card.image} alt={name} loading="lazy" />
        ) : (
          <span className="no-image">{name}</span>
        )}
        <span className="glare" aria-hidden="true" />
      </button>
      {onToggle && (
        <label className="tick" title="Select">
          <input type="checkbox" checked={!!selected} onChange={onToggle} aria-label={`Select ${name}`} />
        </label>
      )}
      {qty > 1 && <span className="qty-badge">×{qty}</span>}
      {dim && <span className="out-ribbon">Swapped out</span>}
      {badge && <span className={`avail avail-${badge.kind}`}>{badge.label}</span>}
    </div>
  )
}
