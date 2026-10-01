import { useState } from 'react'
import CardSearch from './CardSearch'
import PrintingPicker from './PrintingPicker'
import { lookupEntries } from '../lib/scryfall'
import Portal from './Portal'

// Start a brand-new deck: a name and (optionally) a commander. Cards get added on the next screen.
export default function NewDeckDialog({ onCreate, onImport, onCancel }) {
  const [name, setName] = useState('')
  const [commander, setCommander] = useState('')
  const [printing, setPrinting] = useState(null)
  const [picking, setPicking] = useState(false)
  const [status, setStatus] = useState(null)

  async function create(e) {
    e.preventDefault()
    setStatus({ loading: true })
    try {
      let cards = []
      if (printing) cards = [{ name: printing.name, qty: 1, card: printing, commander: true }]
      else if (commander.trim()) {
        const { cards: found, notFound } = await lookupEntries([{ name: commander.trim(), qty: 1, commander: true }])
        if (notFound.length) return setStatus({ error: `Couldn't find "${commander}". Check the spelling.` })
        cards = found
      }
      onCreate(name.trim() || cards[0]?.name || 'New deck', cards)
    } catch (err) {
      setStatus({ error: `Couldn't reach Scryfall: ${err.message}` })
    }
  }

  return (
    <Portal>
    <div className="dialog-backdrop" onClick={onCancel}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={create}>
        <h2>Build a new deck</h2>
        <p className="muted">Start empty, add cards as you go. You'll see which you already own and what you'd need to buy.</p>
        <label>Deck name<input autoFocus placeholder="e.g. Dragons go brrr" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>
          Commander (optional)
          <CardSearch value={commander} onChange={(v) => { setCommander(v); setPrinting(null) }} placeholder="e.g. The Ur-Dragon" />
        </label>
        {commander.trim().length > 2 && (
          <button type="button" className="printing-choice" onClick={() => setPicking(true)}>
            {printing?.imageSmall && <img src={printing.imageSmall} alt="" />}
            {printing ? `${printing.set.toUpperCase()} #${printing.number} · change` : 'Printing: newest · choose…'}
          </button>
        )}
        {status?.error && <p className="error">{status.error}</p>}
        <div className="row end">
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
          <button disabled={status?.loading}>{status?.loading ? <><span className="spinner" /> Creating…</> : 'Start building'}</button>
        </div>
        <p className="muted small divider-text">
          Already own the deck?{' '}
          <button type="button" className="link" onClick={onImport}>Add a precon or paste a list</button>
        </p>
        {picking && (
          <PrintingPicker name={commander.trim()} currentId={printing?.id} onCancel={() => setPicking(false)}
            onPick={(p) => { setPrinting(p); setPicking(false) }} />
        )}
      </form>
    </div>
    </Portal>
  )
}
