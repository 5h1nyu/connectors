import { useMemo, useState } from 'react'
import PageHeader from './PageHeader'
import { CardName } from './CardPreview'
import CardImage from './CardImage'
import AddCardForm from './AddCardForm'
import Places from './Places'
import SelectionBar, { MoveToSelect } from './SelectionBar'
import ConfirmRemoveDialog from './ConfirmRemoveDialog'
import { useViewMode } from '../lib/useViewMode'
import { copyKey } from '../lib/collection'
import CollectionFilters from './CollectionFilters'
import { EMPTY_FILTERS, copyMatches, itemMatches, sortItems } from '../lib/collectionFilters'

const money = (n) => `$${n.toFixed(2)}`

export default function CollectionView({ collection, decks, onAddLoose, onMoveMany, onRemoveMany, onOpenDeck }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useViewMode('collection-sort', 'name')
  const [view, setView] = useViewMode('collection')
  const [selected, setSelected] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const [adding, setAdding] = useState(false)

  const items = useMemo(() => [...collection.values()], [collection])
  const matches = (c) => copyMatches(c, filters)
  const shownCopies = (item) => item.copies.filter(matches)
  const shown = sortItems(
    items.filter((item) => itemMatches(item, filters) && item.copies.some(matches)),
    sort,
    shownCopies,
  )
  // Every set in your collection, for the Set filter
  const sets = useMemo(() => {
    const all = new Map()
    for (const item of collection.values()) for (const c of item.copies) if (c.entry.card?.set) all.set(c.entry.card.set, c.entry.card.setName ?? c.entry.card.set)
    return [...all].sort((a, b) => a[1].localeCompare(b[1]))
  }, [collection])
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

      <CollectionFilters
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        view={view}
        setView={setView}
        decks={decks}
        sets={sets}
        shownCount={shown.length}
        totalCount={items.length}
      />
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
