import { useMemo, useState } from 'react'
import { CardName } from './CardPreview'
import CardImage from './CardImage'
import AddCardForm from './AddCardForm'
import Places from './Places'
import ViewToggle from './ViewToggle'
import SelectionBar, { MoveToSelect } from './SelectionBar'
import { useViewMode } from '../lib/useViewMode'
import { copyKey } from '../lib/collection'

const money = (n) => `$${n.toFixed(2)}`

export default function CollectionView({ collection, decks, onAddLoose, onMoveMany, onRemoveMany, onOpenDeck }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useViewMode('collection')
  const [selected, setSelected] = useState(() => new Set())

  const items = useMemo(() => [...collection.values()].sort((a, b) => a.name.localeCompare(b.name)), [collection])
  const matches = (c) => filter === 'all' || (filter === 'loose' && c.loc.type === 'loose') || (filter === 'out' && c.loc.status === 'out')
  const shown = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && item.copies.some(matches))
  const allCopies = items.flatMap((i) => i.copies)
  const picked = allCopies.filter((c) => selected.has(copyKey(c)))

  const totalCards = items.reduce((n, i) => n + i.total, 0)
  const value = allCopies.reduce((n, c) => n + c.entry.qty * Number(c.entry.card?.priceUsd ?? 0), 0)

  const setMany = (keys, on) => {
    const next = new Set(selected)
    keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
    setSelected(next)
  }
  const itemKeys = (item) => item.copies.filter(matches).map(copyKey)
  const itemSelected = (item) => itemKeys(item).every((k) => selected.has(k))
  const shownKeys = shown.flatMap(itemKeys)
  const allShownSelected = shownKeys.length > 0 && shownKeys.every((k) => selected.has(k))
  const done = () => setSelected(new Set())

  return (
    <section className="panel">
      <div className="stats">
        <div><strong>{items.length}</strong><span>different cards</span></div>
        <div><strong>{totalCards}</strong><span>cards total</span></div>
        <div><strong>{money(value)}</strong><span>estimated value</span></div>
      </div>

      <h3>Add loose cards (singles, binder, etc.)</h3>
      <AddCardForm onAdd={(cards) => onAddLoose(cards)} buttonLabel="Add to collection" />

      <div className="row filters">
        <input placeholder="Search your cards" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All cards</option>
          <option value="loose">Loose cards only</option>
          <option value="out">Swapped-out cards only</option>
        </select>
        <ViewToggle mode={view} onChange={setView} />
      </div>
      <label className="row small select-all">
        <input type="checkbox" checked={allShownSelected} onChange={(e) => setMany(shownKeys, e.target.checked)} />
        Select all {shown.length} shown
      </label>

      <SelectionBar count={picked.reduce((n, c) => n + c.entry.qty, 0)} onClear={done}>
        <MoveToSelect decks={decks} onMove={(to) => { onMoveMany(picked, to); done() }} />
        <button className="danger" onClick={() => { onRemoveMany(picked); done() }}>Remove from collection</button>
      </SelectionBar>

      {view === 'visual' ? (
        <div className="card-grid binder">
          {shown.map((item) => (
            <div key={item.name} className="binder-slot">
              <CardImage card={item.card} name={item.name} qty={item.total} small
                selected={itemSelected(item)} onToggle={() => setMany(itemKeys(item), !itemSelected(item))} />
              <Places places={item.places} onOpenDeck={onOpenDeck} compact />
            </div>
          ))}
        </div>
      ) : (
        <table className="cards-table">
          <thead>
            <tr><th /><th>#</th><th>Card</th><th>Printing</th><th>Where</th><th>Price</th></tr>
          </thead>
          <tbody>
            {shown.flatMap((item) =>
              item.copies.filter(matches).map((c) => {
                const k = copyKey(c)
                return (
                  <tr key={k} className={selected.has(k) ? 'selected' : ''}>
                    <td><input type="checkbox" checked={selected.has(k)} onChange={(e) => setMany([k], e.target.checked)} aria-label={`Select ${c.entry.name}`} /></td>
                    <td className="qty">{c.entry.qty}</td>
                    <td><CardName card={c.entry.card}>{c.entry.name}</CardName></td>
                    <td className="muted small">{c.entry.card?.set ? `${c.entry.card.set.toUpperCase()} #${c.entry.card.number}` : ''}</td>
                    <td>
                      {c.loc.type === 'loose' ? <span className="tag loose">Loose</span> : (
                        <button className={`tag ${c.loc.status === 'out' ? 'out' : ''}`} onClick={() => onOpenDeck(c.loc.deckId)}>{c.label}</button>
                      )}
                    </td>
                    <td className="muted">{c.entry.card?.priceUsd ? `$${c.entry.card.priceUsd}` : ''}</td>
                  </tr>
                )
              }),
            )}
          </tbody>
        </table>
      )}
      {shown.length === 0 && <p className="muted">No cards here yet.</p>}
      {shown.length > 0 && <p className="muted small">Tick cards to move or remove several at once. Click a card for its details.</p>}
    </section>
  )
}
