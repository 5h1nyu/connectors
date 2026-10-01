import { useContext, useLayoutEffect, useRef, useState } from 'react'
import { PreviewContext } from '../lib/previewContext'

// Hover a card name to see the card (desktop). Click or tap it to open the full card page.

export function CardPreviewProvider({ onOpenCard, children }) {
  const [hover, setHover] = useState(null) // { card, x, y }

  return (
    <PreviewContext.Provider value={{ setHover, onOpenCard }}>
      {children}
      {hover && <HoverPopup {...hover} />}
    </PreviewContext.Provider>
  )
}

export function CardName({ card, children }) {
  const { setHover, onOpenCard } = useContext(PreviewContext)
  if (!card) return <span className="card-name missing">{children}</span>

  const show = (e) => e.pointerType === 'mouse' && setHover({ card, x: e.clientX, y: e.clientY })
  return (
    <span
      className="card-name"
      role="button"
      tabIndex={0}
      onPointerEnter={show}
      onPointerMove={show}
      onPointerLeave={() => setHover(null)}
      onClick={() => {
        setHover(null)
        onOpenCard(card)
      }}
      onKeyDown={(e) => e.key === 'Enter' && onOpenCard(card)}
    >
      {children ?? card.name}
    </span>
  )
}

// Measures itself after drawing, then moves so it's never cut off by the edge of the screen.
function HoverPopup({ card, x, y }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    const { width, height } = el.getBoundingClientRect()
    const gap = 16
    const left = x + gap + width > window.innerWidth ? x - gap - width : x + gap
    const top = Math.min(Math.max(8, y - height / 2), window.innerHeight - height - 8)
    el.style.left = `${Math.max(8, left)}px`
    el.style.top = `${Math.max(8, top)}px`
    el.style.visibility = 'visible'
  }, [x, y, card])

  return (
    <div ref={ref} className="hover-card" style={{ visibility: 'hidden' }}>
      {card.image ? <img src={card.image} alt={card.name} /> : <div className="no-image">{card.name}</div>}
      <div className="hover-caption">
        {card.set && <span>{card.set.toUpperCase()} #{card.number}</span>}
        {card.priceUsd && <span>${card.priceUsd}</span>}
      </div>
    </div>
  )
}
