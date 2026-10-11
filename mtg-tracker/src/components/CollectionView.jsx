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
const PAGE = 60
const printingLabel = (card) => (card?.set ? `${card.setName ?? card.set.toUpperCase()} · ${card.set.toUpperCase()} #${card.number}` : 'Unknown printing')
const printingsOf = (copies) => new Set(copies.map((c) => c.entry.card?.id ?? c.entry.name)).size
function priceRange(copies) {
  const prices = copies.map((c) => Number(c.entry.card?.priceUsd ?? 0)).filter(Boolean)
  if (!prices.length) return ''
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return lo === hi ? `$${lo.toFixed(2)}` : `$${lo.toFixed(2)}–$${hi.toFixed(2)}`
}

export default function CollectionView({ collection, decks, onAddLoose, onMoveMany, onRemoveMany, onOpenDeck }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useViewMode('collection-sort', 'name')
  const [view, setView] = useViewMode('collection')
  const [selected, setSelected] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(() => new Set()) // list rows opened to show their printings
  // Show 60 cards at a time; start again from 60 whenever the filters or sort change.
  const signature = JSON.stringify(filters) + sort
  const [paging, setPaging] = useState({ signature, limit: PAGE })
  const limit = paging.signature === signature ? paging.limit : PAGE

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
  const visible = shown.slice(0, limit)
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
          {visible.map((item, i) => {
            const copies = shownCopies(item)
            const printings = printingsOf(copies)
            return (
              <div key={item.name} className="binder-slot" style={{ '--n': i }}>
                <CardImage card={item.card} name={item.name} qty={copies.reduce((n, c) => n + c.entry.qty, 0)} small
                  selected={itemSelected(item)} onToggle={() => setMany(itemKeys(item), !itemSelected(item))} />
                {printings > 1 && <span className="printings-badge">{printings} printings</span>}
                <Places places={item.places} onOpenDeck={onOpenDeck} compact />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grouped-list">
          {visible.map((item) => {
            const copies = shownCopies(item)
            const keys = copies.map(copyKey)
            const all = keys.every((k) => selected.has(k))
            const some = !all && keys.some((k) => selected.has(k))
            const isOpen = open.has(item.name)
            const printings = printingsOf(copies)
            const toggleOpen = () => {
              const next = new Set(open)
              if (isOpen) next.delete(item.name)
              else next.add(item.name)
              setOpen(next)
            }
            return (
              <div key={item.name} className={`group ${isOpen ? 'open' : ''} ${all ? 'selected' : ''}`}>
                <div className="group-row">
                  <input
                    type="checkbox"
                    checked={all}
                    ref={(el) => el && (el.indeterminate = some)}
                    onChange={(e) => setMany(keys, e.target.checked)}
                    aria-label={`Select all ${item.name}`}
                  />
                  <button className="expand" onClick={toggleOpen} aria-expanded={isOpen} title={isOpen ? 'Hide printings' : 'Show printings'}>
                    {isOpen ? '▾' : '▸'}
                  </button>
                  <span className="qty">{copies.reduce((n, c) => n + c.entry.qty, 0)}</span>
                  <span className="group-name"><CardName card={item.card}>{item.name}</CardName></span>
                  <button className="printing-count" onClick={toggleOpen}>
                    {printings > 1 ? `${printings} printings` : printingLabel(copies[0]?.entry.card).split(' · ')[1] ?? ''}
                  </button>
                  <span className="group-where"><Places places={item.places} onOpenDeck={onOpenDeck} compact /></span>
                  <span className="muted group-price">{priceRange(copies)}</span>
                </div>
                {isOpen && (
                  <ul className="printing-rows">
                    {copies
                      .slice()
                      .sort((a, b) => (a.entry.card?.setName ?? '').localeCompare(b.entry.card?.setName ?? ''))
                      .map((c) => {
                        const k = copyKey(c)
                        return (
                          <li key={k} className={selected.has(k) ? 'selected' : ''}>
                            <input type="checkbox" checked={selected.has(k)} onChange={(e) => setMany([k], e.target.checked)} aria-label={`Select ${c.entry.name}, ${printingLabel(c.entry.card)}`} />
                            {c.entry.card?.imageSmall ? <img src={c.entry.card.imageSmall} alt="" /> : <span className="no-image mini" />}
                            <span className="qty">{c.entry.qty}×</span>
                            <span className="printing-name"><CardName card={c.entry.card}>{printingLabel(c.entry.card)}</CardName></span>
                            {c.loc.type === 'loose' ? <span className="tag loose">Loose</span> : (
                              <button className={`tag ${c.loc.status === 'out' ? 'out' : ''}`} onClick={() => onOpenDeck(c.loc.deckId)}>{c.label}</button>
                            )}
                            <span className="muted">{c.entry.card?.priceUsd ? `$${c.entry.card.priceUsd}` : ''}</span>
                          </li>
                        )
                      })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
      {shown.length > limit && (
        <div className="show-more">
          <button className="secondary" onClick={() => setPaging({ signature, limit: limit + PAGE })}>
            Show more ({shown.length - limit} left)
          </button>
        </div>
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
