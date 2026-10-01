import { useState } from 'react'
import { CardName } from './CardPreview'
import AddCardForm from './AddCardForm'
import RemoveCardDialog from './RemoveCardDialog'
import DeleteDeckDialog from './DeleteDeckDialog'

// Order card types the way most deck builders do.
const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']

function mainType(entry) {
  const typeLine = entry.card?.typeLine ?? ''
  return TYPE_ORDER.find((t) => typeLine.includes(t)) ?? 'Other'
}

const sum = (entries) => entries.reduce((total, e) => total + e.qty, 0)

export default function DeckView({ deck, looseCount, onAddCards, onMove, onReplace, onDelete }) {
  const [removing, setRemoving] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const active = deck.cards.filter((e) => e.status === 'active')
  const out = deck.cards.filter((e) => e.status === 'out')
  const groups = {}
  for (const entry of active) (groups[mainType(entry)] ??= []).push(entry)

  return (
    <section className="panel deck-view">
      <header>
        <h2>{deck.name}</h2>
        <span className="muted">{sum(active)} cards</span>
        <button className="danger" onClick={() => setDeleting(true)}>Delete deck</button>
      </header>

      <AddCardForm onAdd={onAddCards} looseCount={looseCount} buttonLabel="Add to deck" />

      <div className="type-groups">
        {[...TYPE_ORDER, 'Other']
          .filter((type) => groups[type])
          .map((type) => (
            <div key={type}>
              <h3>{type} ({sum(groups[type])})</h3>
              <ul>
                {groups[type].map((entry) => (
                  <li key={entry.name}>
                    <span className="qty">{entry.qty}</span>
                    <CardName card={entry.card}>{entry.name}</CardName>
                    <button className="icon" title="Take out of deck" onClick={() => setRemoving(entry)}>✕</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {out.length > 0 && (
        <div className="swapped-out">
          <h3>Swapped out, still with this deck ({sum(out)})</h3>
          <ul>
            {out.map((entry) => (
              <li key={entry.name}>
                <span className="qty">{entry.qty}</span>
                <s><CardName card={entry.card}>{entry.name}</CardName></s>
                <button className="link" onClick={() => onMove(entry, entry.qty, 'active')}>Put back in</button>
                <button className="link" onClick={() => onMove(entry, entry.qty, 'loose')}>Move to loose</button>
                <button className="link danger-text" onClick={() => onMove(entry, entry.qty, 'gone')}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {deleting && (
        <DeleteDeckDialog deck={deck} onCancel={() => setDeleting(false)} onConfirm={onDelete} />
      )}

      {removing && (
        <RemoveCardDialog
          entry={removing}
          deckName={deck.name}
          onCancel={() => setRemoving(null)}
          onConfirm={({ fate, qty, replacement }) => {
            onMove(removing, qty, fate)
            if (replacement) onReplace(replacement, qty)
            setRemoving(null)
          }}
        />
      )}
    </section>
  )
}
