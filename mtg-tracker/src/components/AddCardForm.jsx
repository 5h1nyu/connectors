import { useState } from 'react'
import CardSearch from './CardSearch'
import { lookupEntries } from '../lib/scryfall'
import { parseDecklist } from '../lib/parseDecklist'

// Add one card (with autocomplete) or paste several at once.
// onAdd receives [{ name, qty, card }]. looseCount(name) is optional: shows "take from loose" when set.
export default function AddCardForm({ onAdd, looseCount, buttonLabel = 'Add' }) {
  const [mode, setMode] = useState('single')
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [list, setList] = useState('')
  const [takeFromLoose, setTakeFromLoose] = useState(true)
  const [status, setStatus] = useState(null)

  const inLoose = looseCount && mode === 'single' && name ? looseCount(name) : 0

  async function handleSubmit(e) {
    e.preventDefault()
    const entries = mode === 'single' ? [{ name: name.trim(), qty: Number(qty) || 1 }] : parseDecklist(list)
    if (!entries.length || !entries[0].name) return

    setStatus({ loading: true })
    try {
      const { cards, notFound } = await lookupEntries(entries)
      const good = cards.filter((c) => c.card)
      if (good.length) onAdd(good, looseCount ? takeFromLoose : undefined)
      setStatus(notFound.length ? { error: `Not found: ${notFound.join(', ')}` } : { ok: `Added ${good.length} card(s)` })
      if (!notFound.length) {
        setName('')
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
            <input className="qty-input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            <CardSearch value={name} onChange={setName} />
          </>
        ) : (
          <textarea rows={5} placeholder={'1 Sol Ring\n1 Arcane Signet'} value={list} onChange={(e) => setList(e.target.value)} />
        )}
        <button disabled={status?.loading}>{status?.loading ? '…' : buttonLabel}</button>
      </div>
      <div className="row small">
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
        {status?.ok && <span className="muted">{status.ok}</span>}
      </div>
    </form>
  )
}
