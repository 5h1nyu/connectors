import { useState } from 'react'
import CardSearch from './CardSearch'
import PrintingPicker from './PrintingPicker'
import { lookupEntries } from '../lib/scryfall'
import { parseDecklist } from '../lib/parseDecklist'

// Add one card (with autocomplete and a printing choice) or paste several at once.
// onAdd receives [{ name, qty, card }]. looseCount(name) is optional: shows "take from loose" when set.
export default function AddCardForm({ onAdd, looseCount, buttonLabel = 'Add' }) {
  const [mode, setMode] = useState('single')
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [printing, setPrinting] = useState(null) // chosen printing, or null for the default one
  const [picking, setPicking] = useState(false)
  const [list, setList] = useState('')
  const [takeFromLoose, setTakeFromLoose] = useState(true)
  const [status, setStatus] = useState(null)

  const inLoose = looseCount && mode === 'single' && name ? looseCount(name) : 0

  function changeName(value) {
    setName(value)
    setPrinting(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ loading: true })
    try {
      let cards
      let notFound = []
      if (mode === 'single' && printing) {
        cards = [{ name: printing.name, qty: Number(qty) || 1, card: printing }]
      } else {
        const entries = mode === 'single' ? [{ name: name.trim(), qty: Number(qty) || 1 }] : parseDecklist(list)
        if (!entries.length || !entries[0].name) return setStatus(null)
        ;({ cards, notFound } = await lookupEntries(entries))
      }
      const good = cards.filter((c) => c.card)
      if (good.length) onAdd(good, looseCount ? takeFromLoose : undefined)
      setStatus(notFound.length ? { error: `Not found: ${notFound.join(', ')}` } : { ok: `✓ Added ${good.reduce((n, c) => n + c.qty, 0)} card(s)` })
      if (!notFound.length) {
        changeName('')
        setQty(1)
        setList('')
      }
    } catch (err) {
      setStatus({ error: `Couldn't reach Scryfall: ${err.message}` })
    }
  }

  return (
    <form className="add-card" onSubmit={handleSubmit}>
      <div className="row">
        {mode === 'single' ? (
          <>
            <input className="qty-input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="How many" />
            <CardSearch value={name} onChange={changeName} />
          </>
        ) : (
          <textarea rows={5} placeholder={'1 Sol Ring\n1 Arcane Signet (CMM) 381'} value={list} onChange={(e) => setList(e.target.value)} />
        )}
        <button disabled={status?.loading}>{status?.loading ? <span className="spinner" /> : buttonLabel}</button>
      </div>
      <div className="row small">
        {mode === 'single' && name.trim().length > 2 && (
          <button type="button" className="printing-choice" onClick={() => setPicking(true)}>
            {printing?.imageSmall && <img src={printing.imageSmall} alt="" />}
            {printing ? `${printing.set.toUpperCase()} #${printing.number} · change` : 'Printing: newest · choose…'}
          </button>
        )}
        <button type="button" className="link" onClick={() => setMode(mode === 'single' ? 'list' : 'single')}>
          {mode === 'single' ? 'Paste a list instead' : 'Add one card instead'}
        </button>
        {looseCount && (mode === 'list' || inLoose > 0) && (
          <label>
            <input type="checkbox" checked={takeFromLoose} onChange={(e) => setTakeFromLoose(e.target.checked)} />
            Take from my loose cards{inLoose > 0 && ` (you have ${inLoose})`}
          </label>
        )}
        {status?.error && <span className="error">{status.error}</span>}
        {status?.ok && <span className="ok">{status.ok}</span>}
      </div>
      {picking && (
        <PrintingPicker
          name={name.trim()}
          currentId={printing?.id}
          onCancel={() => setPicking(false)}
          onPick={(p) => {
            setPrinting(p)
            setPicking(false)
          }}
        />
      )}
    </form>
  )
}
