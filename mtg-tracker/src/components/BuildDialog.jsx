import { useState } from 'react'
import { finishBuild } from '../lib/collection'
import Portal from './Portal'

// "Finish building": gather the cards you own into this deck, see what's left to buy.
export default function BuildDialog({ state, deck, onConfirm, onCancel }) {
  const otherDecks = state.decks.filter((d) => d.id !== deck.id && !d.brew)
  const [pullFrom, setPullFrom] = useState(() => new Set(otherDecks.map((d) => d.id)))
  const [boughtRest, setBoughtRest] = useState(false)
  const [markMissing, setMarkMissing] = useState(true)

  // Preview with every deck allowed, so we can list what each one could give.
  const possible = finishBuild(state, deck.id, { pullFrom: new Set(otherDecks.map((d) => d.id)) }).log
  const plan = finishBuild(state, deck.id, { pullFrom }).log
  const toggle = (id) => {
    const next = new Set(pullFrom)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPullFrom(next)
  }

  return (
    <Portal>
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{deck.brew ? 'Finish building' : 'Get missing cards'} · {deck.name}</h2>
        <ul className="plan">
          <li><span className="avail avail-loose">Loose</span> {plan.loose} card(s) from your loose cards</li>
          <li><span className="avail avail-out">Spares</span> {plan.out} card(s) from swapped-out piles</li>
          {otherDecks.filter((d) => possible.decks[d.id]).map((d) => (
            <li key={d.id}>
              <label className="row">
                <input type="checkbox" checked={pullFrom.has(d.id)} onChange={() => toggle(d.id)} />
                <span className="avail avail-deck">Deck</span> Take {possible.decks[d.id]} from {d.name}
              </label>
            </li>
          ))}
          <li><span className="avail avail-buy">Buy</span> {plan.buy} card(s) you don't own yet</li>
        </ul>
        {Object.keys(plan.decks).length > 0 && (
          <label className="row small">
            <input type="checkbox" checked={markMissing} onChange={(e) => setMarkMissing(e.target.checked)} />
            Mark cards I take as "to buy" in their old decks
          </label>
        )}
        {plan.buy > 0 && (
          <label className="row small">
            <input type="checkbox" checked={boughtRest} onChange={(e) => setBoughtRest(e.target.checked)} />
            I already have / bought the other {plan.buy}. Count them as owned
          </label>
        )}
        <div className="row end">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button onClick={() => onConfirm({ pullFrom, boughtRest, markMissing })}>
            {deck.brew ? 'Build deck' : 'Get cards'}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
