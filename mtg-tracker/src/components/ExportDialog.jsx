import { useState } from 'react'
import { exportDeck } from '../lib/collection'
import Portal from './Portal'

// Get a decklist out to Moxfield, Archidekt or Tabletop Simulator.
export default function ExportDialog({ deck, onClose }) {
  const [withPrintings, setWithPrintings] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = exportDeck(deck, withPrintings)

  function download() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = `${deck.name}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Portal>
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Export {deck.name}</h2>
        <label className={`option ${!withPrintings ? 'selected' : ''}`}>
          <input type="radio" checked={!withPrintings} onChange={() => setWithPrintings(false)} />
          <span>Card names only<br /><small className="muted">Tabletop Simulator, MTGO, most websites. Uses official card names.</small></span>
        </label>
        <label className={`option ${withPrintings ? 'selected' : ''}`}>
          <input type="radio" checked={withPrintings} onChange={() => setWithPrintings(true)} />
          <span>With printings<br /><small className="muted">Moxfield, Archidekt. Keeps your exact versions, e.g. (C21) 263.</small></span>
        </label>
        <textarea rows={10} readOnly value={text} onFocus={(e) => e.target.select()} />
        <div className="row end">
          <button className="secondary" onClick={download}>Download .txt</button>
          <button onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
