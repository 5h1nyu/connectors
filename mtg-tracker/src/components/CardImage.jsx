import { useOpenCard } from '../lib/previewContext'

// A clickable card picture for the visual views. Click opens the card page; the tick box selects it.
export default function CardImage({ card, name, qty, dim, small, badge, selected, onToggle }) {
  const openCard = useOpenCard()
  return (
    <div className={`card-tile ${dim ? 'dim' : ''} ${selected ? 'selected' : ''} ${badge?.kind === 'buy' ? 'wanted' : ''}`}>
      <button className="card-face" onClick={() => card && openCard(card)} title={name}>
        {card?.image ? (
          <img src={small ? card.imageSmall ?? card.image : card.image} alt={name} loading="lazy" />
        ) : (
          <span className="no-image">{name}</span>
        )}
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
