import { coverOf, colorsOf, deckSize } from '../lib/collection'
import { useTilt } from '../lib/useTilt'
import { useState } from 'react'
import PageHeader from './PageHeader'
import { useViewMode } from '../lib/useViewMode'
import RingInscription from './RingInscription'

// The back of a card: the theme colour with the ring inscription.
const CardBack = () => (
  <span className="card-back">
    <RingInscription size={100} rings={[{ r: 30, fontSize: 6.5 }]} />
  </span>
)

// A deck as a 3D stack of cards. It leans towards the mouse; hover and the cards turn face up and fan out.
export function DeckStack({ deck, index, onOpen, reorder }) {
  const { ref: tiltRef, onPointerMove, onPointerLeave } = useTilt(12)
  const cover = coverOf(deck)
  const others = deck.cards
    .filter((e) => e.status !== 'out' && e.card?.imageSmall && e.card.id !== cover?.id && !/Basic Land/.test(e.card.typeLine))
    .slice(0, 4)
    .map((e) => e.card)
  const cards = [...others, cover].filter(Boolean) // cover ends up on top
  const value = deck.cards.filter((e) => e.status !== 'out').reduce((n, e) => n + e.qty * Number(e.card?.priceUsd ?? 0), 0)

  return (
    <button
      ref={tiltRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`deck-stack ${deck.brew ? 'is-brew' : ''} ${reorder ? 'reorderable' : ''} ${reorder?.dragOver ? 'drag-over' : ''}`}
      style={{ '--n': index }}
      onClick={onOpen}
      draggable={!!reorder}
      onDragStart={reorder?.onDragStart}
      onDragOver={reorder?.onDragOver}
      onDragLeave={reorder?.onDragLeave}
      onDrop={reorder?.onDrop}
      onDragEnd={reorder?.onDragEnd}
    >
      {reorder && (
        <span className="reorder-arrows" onClick={(e) => e.stopPropagation()}>
          <span role="button" tabIndex={0} aria-label="Move left" onClick={() => reorder.step(-1)}>‹</span>
          <span role="button" tabIndex={0} aria-label="Move right" onClick={() => reorder.step(1)}>›</span>
        </span>
      )}
      <span className="stack3d">
        {cards.length === 0 && <span className="stack-card" style={{ '--pos': 0, '--depth': 0 }}><CardBack /></span>}
        {cards.map((card, i) => (
          <span
            key={card.id + i}
            className="stack-card"
            style={{ '--pos': i - (cards.length - 1) / 2, '--depth': cards.length - 1 - i, '--k': i }}
          >
            <span className="shuffle">
              <img src={card.imageSmall ?? card.image} alt="" loading="lazy" />
              {i < cards.length - 1 && <CardBack />}
            </span>
          </span>
        ))}
        {deck.brew && <span className="brew-badge">Brewing</span>}
      </span>
      <span className="deck-info">
        <strong className="deck-name">{deck.name}</strong>
        <span className="deck-meta">
          <span className="pips">{colorsOf(deck).map((c) => <span key={c} className={`pip pip-${c}`} />)}</span>
          {deckSize(deck)} cards{value > 0 && ` · $${value.toFixed(0)}`}
        </span>
      </span>
    </button>
  )
}

const SORTS = {
  custom: { label: 'My order (drag to move)' },
  newest: { label: 'Newest first', compare: (a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0) },
  oldest: { label: 'Oldest first', compare: (a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0) },
  name: { label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
  value: { label: 'Most valuable', compare: (a, b) => deckValue(b) - deckValue(a) },
  size: { label: 'Most cards', compare: (a, b) => deckSize(b) - deckSize(a) },
  colours: { label: 'Colours (WUBRG)', compare: (a, b) => colourKey(a).localeCompare(colourKey(b)) || a.name.localeCompare(b.name) },
}
const deckValue = (d) => d.cards.filter((e) => e.status !== 'out').reduce((n, e) => n + e.qty * Number(e.card?.priceUsd ?? 0), 0)
const colourKey = (d) => {
  const c = colorsOf(d)
  return `${c.length}${c.map((x) => 'WUBRG'.indexOf(x)).join('')}`
}

export default function DeckShelf({ decks, onOpen, onNew, onImport, onReorder }) {
  const [sort, setSort] = useViewMode('deck-sort', 'custom')
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const total = decks.reduce((n, d) => n + deckSize(d), 0)
  const sorted = SORTS[sort]?.compare ? [...decks].sort(SORTS[sort].compare) : decks
  const custom = !SORTS[sort]?.compare

  const reorderFor = (deck, i) =>
    custom && {
      dragOver: overId === deck.id && dragId !== deck.id,
      onDragStart: (e) => {
        setDragId(deck.id)
        e.dataTransfer.effectAllowed = 'move'
      },
      onDragOver: (e) => {
        e.preventDefault()
        setOverId(deck.id)
      },
      onDragLeave: () => setOverId(null),
      onDrop: (e) => {
        e.preventDefault()
        if (dragId && dragId !== deck.id) onReorder(dragId, i)
        setDragId(null)
        setOverId(null)
      },
      onDragEnd: () => {
        setDragId(null)
        setOverId(null)
      },
      step: (dir) => onReorder(deck.id, Math.max(0, Math.min(decks.length - 1, i + dir))),
    }

  return (
    <>
      <PageHeader
        title="Decks"
        subtitle={decks.length ? `${decks.length} deck${decks.length === 1 ? '' : 's'} · ${total} cards` : 'Build your first deck or add one you own.'}
        actions={
          <>
            {decks.length > 1 && (
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort decks">
                {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
              </select>
            )}
            <button className="secondary" onClick={onImport}>Import</button>
            <button onClick={onNew}>New deck</button>
          </>
        }
      />
      <section className="deck-shelf">
        {sorted.map((deck, i) => (
          <DeckStack key={deck.id} deck={deck} index={i} onOpen={() => onOpen(deck.id)} reorder={decks.length > 1 && reorderFor(deck, i)} />
        ))}
        <button className="deck-stack new-stack" onClick={onNew} style={{ '--n': decks.length }}>
          <span className="stack3d"><span className="stack-card empty"><span className="plus">+</span></span></span>
          <span className="deck-info">
            <strong className="deck-name">New deck</strong>
            <span className="deck-meta">Start from scratch</span>
          </span>
        </button>
      </section>
    </>
  )
}
