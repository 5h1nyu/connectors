import { coverOf, colorsOf, deckSize } from '../lib/collection'
import { useRef } from 'react'
import { useTilt } from '../lib/useTilt'
import { gather, shuffleAndFan } from '../lib/shuffle'
import PageHeader from './PageHeader'
import RingInscription from './RingInscription'

// The back of a card: the theme colour with the ring inscription.
const CardBack = () => (
  <span className="card-back">
    <RingInscription size={100} rings={[{ r: 30, fontSize: 6.5 }]} />
  </span>
)

// A deck as a 3D stack of cards. It leans towards the mouse; hover and the cards riffle-shuffle,
// flip face up and fan out.
export function DeckStack({ deck, index, onOpen }) {
  const { ref: tiltRef, onPointerMove, onPointerLeave } = useTilt(12)
  const stackRef = useRef(null)
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
      onPointerEnter={(e) => e.pointerType === 'mouse' && shuffleAndFan(stackRef.current)}
      onPointerLeave={(e) => {
        onPointerLeave(e)
        gather(stackRef.current)
      }}
      className={`deck-stack ${deck.brew ? 'is-brew' : ''}`}
      style={{ '--n': index }}
      onClick={onOpen}
    >
      <span className="stack3d" ref={stackRef}>
        {cards.length === 0 && <span className="stack-card" style={{ '--pos': 0, '--depth': 0 }}><CardBack /></span>}
        {cards.map((card, i) => (
          <span
            key={card.id + i}
            className="stack-card"
            data-pos={i - (cards.length - 1) / 2}
            data-depth={cards.length - 1 - i}
            style={{ '--depth': cards.length - 1 - i }}
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
      <section className="deck-shelf">
        {decks.map((deck, i) => <DeckStack key={deck.id} deck={deck} index={i} onOpen={() => onOpen(deck.id)} />)}
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
