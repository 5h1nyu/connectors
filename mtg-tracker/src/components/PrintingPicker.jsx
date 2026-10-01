import { useEffect, useState } from 'react'
import { fetchPrintings } from '../lib/scryfall'
import Portal from './Portal'

// Pick one printing of a card from a grid of every version Scryfall knows.
export default function PrintingPicker({ name, currentId, onPick, onCancel }) {
  const [printings, setPrintings] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchPrintings(name).then(setPrintings).catch((err) => setError(err.message))
  }, [name])

  const shown = printings?.filter((p) =>
    `${p.setName} ${p.set} ${p.flavorName ?? ''}`.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <Portal>
    <div className="dialog-backdrop top" onClick={onCancel}>
      <div className="dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <h2>Choose a printing of {name}</h2>
          <button className="icon close" onClick={onCancel} aria-label="Close">✕</button>
        </div>
        {!printings && !error && <p className="muted"><span className="spinner" /> Loading printings…</p>}
        {error && <p className="error">Couldn't load printings: {error}</p>}
        {printings && (
          <>
            <input placeholder={`Filter ${printings.length} printings by set name`} value={filter} onChange={(e) => setFilter(e.target.value)} />
            <div className="printing-grid">
              {shown.map((p) => (
                <button key={p.id} className={`printing ${p.id === currentId ? 'current' : ''}`} onClick={() => onPick(p)}>
                  {p.imageSmall ? <img src={p.imageSmall} alt="" loading="lazy" /> : <span className="no-image">{p.setName}</span>}
                  <span className="printing-label">
                    <strong>{p.set.toUpperCase()} #{p.number}</strong>
                    <span>{p.setName}</span>
                    <span className="muted">{p.released?.slice(0, 4)}{p.priceUsd && ` · $${p.priceUsd}`}</span>
                    {p.flavorName && <span className="muted">“{p.flavorName}”</span>}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </Portal>
  )
}
