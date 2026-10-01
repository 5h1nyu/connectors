import { useMemo, useState } from 'react'
import { CardName } from './CardPreview'
import { useOpenCard } from '../lib/previewContext'
import CardImage from './CardImage'
import AddCardForm from './AddCardForm'
import Places from './Places'
import { useViewMode } from '../lib/useViewMode'
import ViewToggle from './ViewToggle'

const money = (n) => `$${n.toFixed(2)}`

export default function CollectionView({ collection, onAddLoose, onOpenDeck }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useViewMode('collection')
  const openCard = useOpenCard()

  const items = useMemo(() => [...collection.values()].sort((a, b) => a.name.localeCompare(b.name)), [collection])
  const shown = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' ||
        (filter === 'loose' && item.places.some((p) => p.loose)) ||
        (filter === 'out' && item.places.some((p) => p.swappedOut))),
  )

  const totalCards = items.reduce((n, i) => n + i.total, 0)
  const value = items.reduce((n, i) => n + i.copies.reduce((m, c) => m + c.entry.qty * Number(c.entry.card?.priceUsd ?? 0), 0), 0)

  return (
    <section className="panel">
      <div className="stats">
        <div><strong>{items.length}</strong><span>different cards</span></div>
        <div><strong>{totalCards}</strong><span>cards total</span></div>
        <div><strong>{money(value)}</strong><span>estimated value</span></div>
      </div>

      <h3>Add loose cards (singles, binder, etc.)</h3>
      <AddCardForm onAdd={onAddLoose} buttonLabel="Add to collection" />

      <div className="row filters">
        <input placeholder="Search your cards" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All cards</option>
          <option value="loose">Have loose copies</option>
          <option value="out">Have swapped-out copies</option>
        </select>
        <ViewToggle mode={view} onChange={setView} />
      </div>

      {view === 'visual' ? (
        <div className="card-grid binder">
          {shown.map((item) => (
            <div key={item.name} className="binder-slot">
              <CardImage card={item.card} name={item.name} qty={item.total} small />
              <Places places={item.places} onOpenDeck={onOpenDeck} compact />
            </div>
          ))}
        </div>
      ) : (
        <table className="cards-table">
          <thead>
            <tr><th>#</th><th>Card</th><th>Where</th><th>Price</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.name}>
                <td className="qty">{item.total}</td>
                <td><CardName card={item.card}>{item.name}</CardName></td>
                <td><Places places={item.places} onOpenDeck={onOpenDeck} /></td>
                <td className="muted">{item.card?.priceUsd ? `$${item.card.priceUsd}` : ''}</td>
                <td><button className="secondary small-btn" onClick={() => openCard(item.card)}>Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {shown.length === 0 && <p className="muted">No cards here yet.</p>}
      {view === 'visual' && shown.length > 0 && <p className="muted small">Click a card to move it, delete it or change its printing.</p>}
    </section>
  )
}
