import { useMemo, useState } from 'react'
import { CardName } from './CardPreview'
import AddCardForm from './AddCardForm'
import Places from './Places'

const money = (n) => `$${n.toFixed(2)}`

export default function CollectionView({ collection, onAddLoose, onRemoveLoose, onOpenDeck }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const items = useMemo(() => [...collection.values()].sort((a, b) => a.name.localeCompare(b.name)), [collection])
  const shown = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' ||
        (filter === 'loose' && item.places.some((p) => p.loose)) ||
        (filter === 'out' && item.places.some((p) => p.swappedOut))),
  )

  const totalCards = items.reduce((n, i) => n + i.total, 0)
  const value = items.reduce((n, i) => n + i.total * Number(i.card?.priceUsd ?? 0), 0)

  return (
    <section className="panel">
      <h2>My collection</h2>
      <p className="muted">
        {items.length} different cards · {totalCards} total · worth about {money(value)}
      </p>

      <h3>Add loose cards (singles, binder, etc.)</h3>
      <AddCardForm onAdd={onAddLoose} buttonLabel="Add to collection" />

      <div className="row filters">
        <input placeholder="Search your cards" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All cards</option>
          <option value="loose">Have loose copies</option>
          <option value="out">Have swapped-out copies</option>
        </select>
      </div>

      <table className="cards-table">
        <thead>
          <tr><th>#</th><th>Card</th><th>Where</th><th>Price</th></tr>
        </thead>
        <tbody>
          {shown.map((item) => {
            const loose = item.places.find((p) => p.loose)
            return (
              <tr key={item.name}>
                <td className="qty">{item.total}</td>
                <td><CardName card={item.card}>{item.name}</CardName></td>
                <td>
                  <Places places={item.places} onOpenDeck={onOpenDeck} />
                  {loose && (
                    <button className="icon" title="Remove one loose copy" onClick={() => onRemoveLoose(item.name)}>−</button>
                  )}
                </td>
                <td className="muted">{item.card?.priceUsd ? `$${item.card.priceUsd}` : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {shown.length === 0 && <p className="muted">No cards here yet.</p>}
    </section>
  )
}
