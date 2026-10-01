import { placeRank } from '../lib/collection'

// Little tags showing where your copies are: "Loose ×2", "Atraxa ×1", "Edgar (swapped out)".
// compact: just the first place plus "+N" (for the picture grid).
export default function Places({ places, onOpenDeck, compact }) {
  const sorted = [...places].sort((a, b) => placeRank(a) - placeRank(b))
  const shown = compact ? sorted.slice(0, 1) : sorted
  return (
    <span className="places">
      {shown.map((p, i) =>
        p.loose ? (
          <span key={i} className="tag loose">Loose ×{p.qty}</span>
        ) : (
          <button key={i} className={`tag ${p.swappedOut ? 'out' : ''}`} onClick={() => onOpenDeck(p.deckId)}>
            {p.deckName}{p.swappedOut && ' (out)'} ×{p.qty}
          </button>
        ),
      )}
      {compact && sorted.length > 1 && <span className="tag">+{sorted.length - 1}</span>}
    </span>
  )
}
