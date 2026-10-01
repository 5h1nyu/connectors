import { useOpenCard } from '../lib/previewContext'

// A clickable card picture for the visual views. Click opens the card page.
export default function CardImage({ card, name, qty, dim, small }) {
  const openCard = useOpenCard()
  return (
    <button className={`card-tile ${dim ? 'dim' : ''}`} onClick={() => card && openCard(card)} title={name}>
      {card?.image ? (
        <img src={small ? card.imageSmall ?? card.image : card.image} alt={name} loading="lazy" />
      ) : (
        <span className="no-image">{name}</span>
      )}
      {qty > 1 && <span className="qty-badge">×{qty}</span>}
      {dim && <span className="out-ribbon">Swapped out</span>}
    </button>
  )
}
