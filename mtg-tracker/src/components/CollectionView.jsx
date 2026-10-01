import { useMemo, useState } from 'react'
import PageHeader from './PageHeader'
import { CardName } from './CardPreview'
import CardImage from './CardImage'
import AddCardForm from './AddCardForm'
import Places from './Places'
import ViewToggle from './ViewToggle'
import SelectionBar, { MoveToSelect } from './SelectionBar'
import ConfirmRemoveDialog from './ConfirmRemoveDialog'
import { useViewMode } from '../lib/useViewMode'
import { copyKey } from '../lib/collection'

const money = (n) => `$${n.toFixed(2)}`

export default function CollectionView({ collection, decks, onAddLoose, onMoveMany, onRemoveMany, onOpenDeck }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useViewMode('collection')
  const [selected, setSelected] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const [adding, setAdding] = useState(false)

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
    <section>
      <PageHeader
        title="Collection"
        subtitle={`${totalCards} cards · ${items.length} different · about ${money(value)}`}
        actions={<button onClick={() => setAdding(!adding)}>{adding ? 'Done adding' : 'Add cards'}</button>}
      />

      {adding && (
        <div className="panel add-panel">
          <h3>Add cards you own</h3>
          <p className="muted small">Singles, binder, bulk box: anything not in a deck. Search one card or paste a list.</p>
          <AddCardForm onAdd={(cards) => onAddLoose(cards)} buttonLabel="Add" />
        </div>
      )}

      <div className="search-row">
        <input className="big-search" type="search" placeholder="Search your cards" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ViewToggle mode={view} onChange={setView} />
      </div>
      <div className="row chips" role="group" aria-label="Show">
        {[['all', 'All'], ['loose', 'Loose'], ['out', 'Swapped out']].map(([id, label]) => (
          <button key={id} className={`chip ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <label className="row small select-all">
        <input type="checkbox" checked={allShownSelected} onChange={(e) => setMany(shownKeys, e.target.checked)} />
        Select all {shown.length} shown
      </label>

      <SelectionBar count={picked.reduce((n, c) => n + c.entry.qty, 0)} onClear={done}>
        <MoveToSelect decks={decks} onMove={(to) => { onMoveMany(picked, to); done() }} />
        <button className="danger" onClick={() => setConfirming(true)}>Remove from collection…</button>
      </SelectionBar>

      {view === 'visual' ? (
        <div className="card-grid binder">
          {shown.map((item, i) => (
            <div key={item.name} className="binder-slot" style={{ '--n': i }}>
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
      {confirming && (
        <ConfirmRemoveDialog
          copies={picked}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { onRemoveMany(picked); done(); setConfirming(false) }}
        />
      )}
      {shown.length > 0 && <p className="muted small">Tick cards to move or remove several at once. Click a card for its details.</p>}
    </section>
  )
}
