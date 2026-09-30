import { placeRank } from '../lib/collection'

// Little tags showing where your copies are: "Loose ×2", "Atraxa ×1", "Edgar (swapped out)".
export default function Places({ places, onOpenDeck }) {
  return (
    <span className="places">
      {[...places].sort((a, b) => placeRank(a) - placeRank(b)).map((p, i) =>
        p.loose ? (
          <span key={i} className="tag loose">Loose ×{p.qty}</span>
        ) : (
          <button key={i} className={`tag ${p.swappedOut ? 'out' : ''}`} onClick={() => onOpenDeck(p.deckId)}>
            {p.deckName}{p.swappedOut && ' (swapped out)'} ×{p.qty}
          </button>
        ),
      )}
    </span>
  )
}
