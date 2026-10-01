import { useState } from 'react'
import CardSearch from './CardSearch'
import Portal from './Portal'

// Move some copies of a card anywhere: another deck, swapped out, loose, or out of your collection.
export default function MoveDialog({ entry, from, decks, allowReplacement, onConfirm, onCancel }) {
  const fromDeck = from.type === 'deck' ? decks.find((d) => d.id === from.deckId) : null
  const otherDecks = decks.filter((d) => !fromDeck || d.id !== fromDeck.id)

  const options = [
    fromDeck && from.status === 'active' && ['out', `Keep with ${fromDeck.name}, crossed off`, 'Still in the deck box, just not being played.'],
    fromDeck && from.status === 'out' && ['active', `Put it back into ${fromDeck.name}`, 'Play it in the deck again.'],
    from.type !== 'loose' && ['loose', 'Loose cards', 'Binder, box or trade pile.'],
    otherDecks.length > 0 && ['deck', 'Another deck', null],
    ['gone', 'Remove from my collection', "Added by mistake, sold or traded. It won't be counted anymore."],
  ].filter(Boolean)

  const [choice, setChoice] = useState(options[0][0])
  const [deckId, setDeckId] = useState(otherDecks[0]?.id ?? '')
  const [qty, setQty] = useState(entry.qty)
  const [replacement, setReplacement] = useState('')

  function destination() {
    if (choice === 'out' || choice === 'active') return { type: 'deck', deckId: fromDeck.id, status: choice }
    if (choice === 'deck') return { type: 'deck', deckId, status: 'active' }
    return { type: choice }
  }

  return (
    <Portal>
    <div className="dialog-backdrop top" onClick={onCancel}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onConfirm({ to: destination(), qty: Math.min(entry.qty, Math.max(1, Number(qty) || 1)), replacement: replacement.trim() })
        }}
      >
        <h2>Move {entry.name}</h2>
        <p className="muted">From: {fromDeck ? `${fromDeck.name}${from.status === 'out' ? ' (swapped out)' : ''}` : 'Loose cards'}
          {entry.card?.set && ` · ${entry.card.set.toUpperCase()} #${entry.card.number}`}</p>
        {entry.qty > 1 && (
          <label className="row">
            How many?
            <input className="qty-input" type="number" min="1" max={entry.qty} value={qty} onChange={(e) => setQty(e.target.value)} />
            of {entry.qty}
          </label>
        )}
        {options.map(([value, label, hint]) => (
          <label key={value} className={`option ${choice === value ? 'selected' : ''}`}>
            <input type="radio" name="dest" checked={choice === value} onChange={() => setChoice(value)} />
            <span>
              {label}
              {value === 'deck' && (
                <select value={deckId} onClick={() => setChoice('deck')} onChange={(e) => { setDeckId(e.target.value); setChoice('deck') }}>
                  {otherDecks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
              {hint && <><br /><small className="muted">{hint}</small></>}
            </span>
          </label>
        ))}
        {allowReplacement && (
          <label>
            Replace it with (optional)
            <CardSearch value={replacement} onChange={setReplacement} placeholder="e.g. Mana Crypt" />
          </label>
        )}
        <div className="row end">
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
          <button className={choice === 'gone' ? 'danger-fill' : ''}>{choice === 'gone' ? 'Remove' : 'Move'}</button>
        </div>
      </form>
    </div>
    </Portal>
  )
}
