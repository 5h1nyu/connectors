import { coverOf, colorsOf, deckSize } from '../lib/collection'
import PageHeader from './PageHeader'

// A deck as a big art tile (like Moxfield). Hover it and a few of its cards fan up.
function DeckTile({ deck, onOpen }) {
  const cover = coverOf(deck)
  const peek = deck.cards
    .filter((e) => e.status !== 'out' && e.card?.imageSmall && e.card.id !== cover?.id && !/Basic Land/.test(e.card.typeLine))
    .slice(0, 3)
    .map((e) => e.card)
  const cards = deck.cards.filter((e) => e.status !== 'out')
  const value = cards.reduce((n, e) => n + e.qty * Number(e.card?.priceUsd ?? 0), 0)

  return (
    <button className="deck-tile" onClick={onOpen}>
      <div className="deck-art">
        {cover ? (
          <img src={cover.artCrop ?? cover.image} alt="" loading="lazy" className={cover.artCrop ? '' : 'from-card'} />
        ) : (
          <div className="deck-art-empty">No cards yet</div>
        )}
        {deck.brew && <span className="brew-badge">Brewing</span>}
        <div className="peek" aria-hidden="true">
          {peek.map((card, i) => (
            <img key={card.id} src={card.imageSmall} alt="" loading="lazy" style={{ '--i': i - (peek.length - 1) / 2 }} />
          ))}
        </div>
      </div>
      <div className="deck-info">
        <strong className="deck-name">{deck.name}</strong>
        <span className="deck-meta">
          <span className="pips">{colorsOf(deck).map((c) => <span key={c} className={`pip pip-${c}`} />)}</span>
          {deckSize(deck)} cards{value > 0 && ` · $${value.toFixed(0)}`}
        </span>
      </div>
    </button>
  )
}

export default function DeckShelf({ decks, onOpen, onNew, onImport }) {
  const total = decks.reduce((n, d) => n + deckSize(d), 0)
  return (
    <>
      <PageHeader
        title="Decks"
        subtitle={decks.length ? `${decks.length} deck${decks.length === 1 ? '' : 's'} · ${total} cards` : 'Build your first deck or add one you own.'}
        actions={
          <>
            <button className="secondary" onClick={onImport}>Import</button>
            <button onClick={onNew}>New deck</button>
          </>
        }
      />
      <section className="deck-grid">
        {decks.map((deck) => <DeckTile key={deck.id} deck={deck} onOpen={() => onOpen(deck.id)} />)}
        <button className="deck-tile new-tile" onClick={onNew}>
          <div className="deck-art"><span className="plus">+</span></div>
          <div className="deck-info">
            <strong className="deck-name">New deck</strong>
            <span className="deck-meta">Start from scratch</span>
          </div>
        </button>
      </section>
    </>
  )
}
