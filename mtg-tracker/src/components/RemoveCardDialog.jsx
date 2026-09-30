import { useState } from 'react'
import CardSearch from './CardSearch'

// Asked when you take a card out of a deck: where does it go, and what replaces it?
export default function RemoveCardDialog({ entry, deckName, onConfirm, onCancel }) {
  const [fate, setFate] = useState('out')
  const [qty, setQty] = useState(1)
  const [replacement, setReplacement] = useState('')

  const options = [
    ['out', `Keep it with ${deckName}, crossed off`, 'Still in the deck box, just not being played.'],
    ['loose', 'Move it to my loose cards', 'Binder, box, or trade pile.'],
    ['gone', "Remove it from my collection", "Sold, traded, or lost. It won't be counted anymore."],
  ]

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onConfirm({ fate, qty: Number(qty), replacement: replacement.trim() })
        }}
      >
        <h2>Take out {entry.name}</h2>
        {entry.qty > 1 && (
          <label className="row">
            How many?
            <input className="qty-input" type="number" min="1" max={entry.qty} value={qty} onChange={(e) => setQty(e.target.value)} />
            of {entry.qty}
          </label>
        )}
        {options.map(([value, label, hint]) => (
          <label key={value} className="option">
            <input type="radio" name="fate" checked={fate === value} onChange={() => setFate(value)} />
            <span>
              {label}
              <br />
              <small className="muted">{hint}</small>
            </span>
          </label>
        ))}
        <label>
          Replace it with (optional)
          <CardSearch value={replacement} onChange={setReplacement} placeholder="e.g. Mana Crypt" />
        </label>
        <div className="row end">
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
          <button>Confirm</button>
        </div>
      </form>
    </div>
  )
}
