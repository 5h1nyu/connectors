import { useState } from 'react'
import MoveDialog from './MoveDialog'
import PrintingPicker from './PrintingPicker'

const COLOR_NAMES = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' }

// The full card page: big picture, rules text, prices, and every copy you own with buttons to manage them.
export default function CardDetail({ card, item, decks, actions, onClose }) {
  const [flipped, setFlipped] = useState(false)
  const [moving, setMoving] = useState(null) // a copy from item.copies
  const [reprinting, setReprinting] = useState(null)

  const image = flipped && card.backImage ? card.backImage : card.image

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog card-detail" onClick={(e) => e.stopPropagation()}>
        <button className="icon close" onClick={onClose} aria-label="Close">✕</button>

        <div className="card-detail-image">
          {image ? <img src={image} alt={card.name} /> : <div className="no-image big">{card.name}</div>}
          {card.backImage && (
            <button className="secondary" onClick={() => setFlipped(!flipped)}>↻ Flip card</button>
          )}
        </div>

        <div className="card-detail-info">
          <h2>{card.name} <span className="mana">{card.manaCost}</span></h2>
          {card.flavorName && <p className="muted">This printing is called “{card.flavorName}”</p>}
          <p className="type">{card.typeLine}</p>
          <p className="oracle">{card.oracleText}</p>

          <dl className="facts">
            {card.setName && <><dt>Printing</dt><dd>{card.setName} ({card.set.toUpperCase()} #{card.number}) · {card.rarity} · {card.released?.slice(0, 4)}</dd></>}
            {card.colors?.length > 0 && <><dt>Colours</dt><dd>{card.colors.map((c) => COLOR_NAMES[c]).join(', ')}</dd></>}
            {card.commanderLegal && <><dt>Commander</dt><dd>{card.commanderLegal === 'legal' ? '✓ Legal' : card.commanderLegal.replace('_', ' ')}</dd></>}
            <dt>Price</dt>
            <dd>{card.priceUsd ? `$${card.priceUsd}` : '–'}{card.priceEur && ` · €${card.priceEur}`}</dd>
          </dl>
          <p className="row links">
            {card.scryfallUrl && <a href={card.scryfallUrl} target="_blank" rel="noreferrer">Scryfall</a>}
            {card.buyUrl && <a href={card.buyUrl} target="_blank" rel="noreferrer">Buy on TCGplayer</a>}
            {card.cardmarketUrl && <a href={card.cardmarketUrl} target="_blank" rel="noreferrer">Cardmarket</a>}
          </p>

          <h3>Your copies {item && `(${item.total})`}</h3>
          {!item && <p className="muted">You don't own this card yet.</p>}
          {item && (
            <ul className="copies">
              {item.copies.map((copy, i) => (
                <li key={i}>
                  {copy.entry.card?.imageSmall && <img className="thumb" src={copy.entry.card.imageSmall} alt="" />}
                  <span className="copy-info">
                    <strong>{copy.entry.qty}× {copy.label}</strong>
                    <small className="muted">
                      {copy.entry.card?.set ? `${copy.entry.card.set.toUpperCase()} #${copy.entry.card.number}` : 'unknown printing'}
                    </small>
                  </span>
                  <span className="row copy-actions">
                    <button className="secondary small-btn" onClick={() => setMoving(copy)}>Move</button>
                    <button className="secondary small-btn" onClick={() => setReprinting(copy)}>Printing</button>
                    {copy.loc.type === 'deck' && copy.loc.status === 'active' && (
                      <button
                        className="secondary small-btn"
                        title="Show this card on top of the deck"
                        onClick={() => actions.setCover(copy.loc.deckId, copy.entry.name)}
                      >
                        ★ Cover
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button className="secondary" onClick={() => actions.addLoose([{ name: card.name, qty: 1, card }])}>
            + Add a copy of this printing to loose cards
          </button>
        </div>
      </div>

      {moving && (
        <MoveDialog
          entry={moving.entry}
          from={moving.loc}
          decks={decks}
          allowReplacement={moving.loc.type === 'deck' && moving.loc.status === 'active'}
          onCancel={() => setMoving(null)}
          onConfirm={({ to, qty, replacement }) => {
            actions.move(moving.entry, moving.loc, to, qty)
            if (replacement) actions.replace(moving.loc.deckId, replacement, qty)
            setMoving(null)
          }}
        />
      )}
      {reprinting && (
        <PrintingPicker
          name={card.name}
          currentId={reprinting.entry.card?.id}
          onCancel={() => setReprinting(null)}
          onPick={(printing) => {
            actions.changePrinting(reprinting.entry, reprinting.loc, printing)
            setReprinting(null)
          }}
        />
      )}
    </div>
  )
}
