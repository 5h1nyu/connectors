import { CardName } from './CardPreview'

// Order card types the way most deck builders do.
const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']

function mainType(entry) {
  const typeLine = entry.card?.typeLine ?? ''
  return TYPE_ORDER.find((t) => typeLine.includes(t)) ?? 'Other'
}

export default function DeckView({ deck, onDelete }) {
  const groups = {}
  for (const entry of deck.cards) (groups[mainType(entry)] ??= []).push(entry)
  const total = deck.cards.reduce((sum, c) => sum + c.qty, 0)

  return (
    <section className="deck-view">
      <header>
        <h2>{deck.name}</h2>
        <span className="muted">{total} cards</span>
        <button className="danger" onClick={() => confirm(`Delete "${deck.name}"?`) && onDelete(deck.id)}>
          Delete
        </button>
      </header>
      <div className="type-groups">
        {[...TYPE_ORDER, 'Other']
          .filter((type) => groups[type])
          .map((type) => (
            <div key={type}>
              <h3>
                {type} ({groups[type].reduce((sum, c) => sum + c.qty, 0)})
              </h3>
              <ul>
                {groups[type].map((entry) => (
                  <li key={entry.name}>
                    <span className="qty">{entry.qty}</span>
                    <CardName card={entry.card}>{entry.name}</CardName>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  )
}
