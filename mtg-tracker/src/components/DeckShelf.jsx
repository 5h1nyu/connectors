import { coverOf, colorsOf, deckSize } from '../lib/collection'
import RingInscription from './RingInscription'

// The back of every card on the shelf: black, with the ring inscription.
const CardBack = () => (
  <div className="card-back">
    <RingInscription size={100} rings={[{ r: 30, fontSize: 6.5 }]} />
  </div>
)

// Your decks as little card stacks. Hover one and it fans out to show some of its cards.
function DeckStack({ deck, onOpen }) {
  const cover = coverOf(deck)
  const peek = deck.cards
    .filter((e) => e.status !== 'out' && e.card?.image && e.card.id !== cover?.id && !/Basic Land/.test(e.card.typeLine))
    .slice(0, 4)
    .map((e) => e.card)
  const fan = [...peek, cover].filter(Boolean) // cover ends up on top

  return (
    <button className={`deck-stack ${deck.brew ? 'is-brew' : ''}`} onClick={onOpen} aria-label={`Open ${deck.name}`}>
      <div className="fan">
        {fan.map((card, i) => (
          <div key={card.id + i} className="stack-card" style={{ '--i': i - (fan.length - 1) / 2, '--depth': fan.length - 1 - i }}>
            <img src={card.imageSmall ?? card.image} alt="" loading="lazy" />
            {i < fan.length - 1 && <CardBack />}
          </div>
        ))}
        {fan.length === 0 && <div className="stack-card"><CardBack /></div>}
        {deck.brew && <span className="brew-ribbon">⚒ Brewing</span>}
      </div>
      <span className="deck-label">
        <strong>{deck.name}</strong>
        <span className="row pips">
          {colorsOf(deck).map((c) => <span key={c} className={`pip pip-${c}`} />)}
          <span className="muted">{deckSize(deck)} cards</span>
        </span>
      </span>
    </button>
  )
}

export default function DeckShelf({ decks, onOpen, onNew, onImport }) {
  return (
    <>
      <div className="shelf-actions row">
        <button onClick={onNew}>＋ Build a new deck</button>
        <button className="secondary" onClick={onImport}>Add a precon / paste a list</button>
      </div>
      <section className="shelf">
        {decks.map((deck) => <DeckStack key={deck.id} deck={deck} onOpen={() => onOpen(deck.id)} />)}
        <button className="deck-stack new-deck" onClick={onNew}>
          <div className="fan"><div className="stack-card empty">＋</div></div>
          <span className="deck-label"><strong>Build a new deck</strong><span className="muted">Start from scratch</span></span>
        </button>
      </section>
    </>
  )
}
