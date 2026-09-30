import { createContext, useContext, useState } from 'react'

// One shared preview popup for the whole app.
// Desktop: hover a card name to see it. Phone (no hover): tap to open, tap again to close.

const PreviewContext = createContext(null)

export function CardPreviewProvider({ children }) {
  const [preview, setPreview] = useState(null) // { card, x, y, pinned }

  return (
    <PreviewContext.Provider value={setPreview}>
      {children}
      {preview && <PreviewPopup {...preview} onClose={() => setPreview(null)} />}
    </PreviewContext.Provider>
  )
}

export function CardName({ card, children }) {
  const setPreview = useContext(PreviewContext)
  if (!card) return <span className="card-name missing">{children}</span>

  const show = (e) => setPreview({ card, x: e.clientX, y: e.clientY, pinned: false })
  const hide = () => setPreview((p) => (p?.pinned ? p : null))
  const tap = (e) => {
    if (e.pointerType === 'mouse') return
    setPreview({ card, pinned: true })
  }

  return (
    <span
      className="card-name"
      onMouseEnter={show}
      onMouseMove={show}
      onMouseLeave={hide}
      onPointerUp={tap}
    >
      {children ?? card.name}
    </span>
  )
}

function PreviewPopup({ card, x, y, pinned, onClose }) {
  // Keep the popup on screen: flip to the left of the cursor near the right edge.
  const style = pinned
    ? undefined
    : {
        left: x + 360 > window.innerWidth ? x - 340 : x + 20,
        top: Math.max(8, Math.min(y - 150, window.innerHeight - 520)),
      }

  return (
    <div className={pinned ? 'preview-backdrop' : undefined} onClick={pinned ? onClose : undefined}>
      <div className={`preview ${pinned ? 'pinned' : ''}`} style={style}>
        {card.image && <img src={card.image} alt={card.name} />}
        <div className="preview-text">
          <strong>{card.name}</strong> <span className="mana">{card.manaCost}</span>
          <div className="type">{card.typeLine}</div>
          <p>{card.oracleText}</p>
          <div className="links">
            {card.priceUsd && <span>${card.priceUsd}</span>}
            <a href={card.scryfallUrl} target="_blank" rel="noreferrer">Scryfall</a>
            {card.buyUrl && <a href={card.buyUrl} target="_blank" rel="noreferrer">TCGplayer</a>}
          </div>
        </div>
      </div>
    </div>
  )
}
