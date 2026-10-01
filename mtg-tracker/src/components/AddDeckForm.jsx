import { useState } from 'react'
import { parseDecklist } from '../lib/parseDecklist'
import { lookupEntries } from '../lib/scryfall'
import { fetchPrecon, fetchPreconList } from '../lib/mtgjson'
import { newDeck } from '../lib/collection'

export default function AddDeckForm({ onAdd, onBack }) {
  const [mode, setMode] = useState('precon')
  const [name, setName] = useState('')
  const [list, setList] = useState('')
  const [precons, setPrecons] = useState(null)
  const [preconSearch, setPreconSearch] = useState('')
  const [status, setStatus] = useState(null) // { loading } | { error } | { notFound }

  async function loadPrecons() {
    setStatus({ loading: 'Loading precon list…' })
    try {
      setPrecons(await fetchPreconList())
      setStatus(null)
    } catch (err) {
      setStatus({ error: `Couldn't load the precon list (${err.message}). You can paste the list instead.` })
    }
  }

  async function saveDeck(deckName, entries) {
    setStatus({ loading: 'Looking up cards…' })
    try {
      const { cards, notFound } = await lookupEntries(entries)
      onAdd(newDeck(deckName, cards))
      setName('')
      setList('')
      setStatus(notFound.length ? { notFound } : null)
    } catch (err) {
      setStatus({ error: `Couldn't reach Scryfall: ${err.message}` })
    }
  }

  async function pickPrecon(precon) {
    setStatus({ loading: `Loading ${precon.name}…` })
    try {
      await saveDeck(precon.name, await fetchPrecon(precon.fileName))
    } catch (err) {
      setStatus({ error: `Couldn't load that precon: ${err.message}` })
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const entries = parseDecklist(list)
    if (!name.trim() || entries.length === 0) {
      setStatus({ error: 'Give the deck a name and paste at least one card.' })
      return
    }
    saveDeck(name.trim(), entries)
  }

  const shown = precons?.filter((p) => p.name.toLowerCase().includes(preconSearch.toLowerCase())).slice(0, 50)

  return (
    <section className="panel add-deck">
      <button className="link back" onClick={onBack}>← All decks</button>
      <h2>Add a deck</h2>
      <div className="tabs">
        <button className={mode === 'precon' ? 'active' : ''} onClick={() => setMode('precon')}>Pick a precon</button>
        <button className={mode === 'paste' ? 'active' : ''} onClick={() => setMode('paste')}>Paste a list</button>
      </div>

      {mode === 'precon' && !precons && (
        <button onClick={loadPrecons} disabled={!!status?.loading}>Load Commander precons</button>
      )}
      {mode === 'precon' && precons && (
        <>
          <input placeholder="Search precons, e.g. Atraxa" value={preconSearch} onChange={(e) => setPreconSearch(e.target.value)} />
          <ul className="precon-list">
            {shown.map((p) => (
              <li key={p.fileName}>
                <button className="link" disabled={!!status?.loading} onClick={() => pickPrecon(p)}>{p.name}</button>
                <span className="muted"> {p.code} · {p.releaseDate.slice(0, 4)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {mode === 'paste' && (
        <form className="stack" onSubmit={handlePaste}>
          <input placeholder="Deck name, e.g. Atraxa precon" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea
            rows={10}
            placeholder={'Paste a decklist, one card per line:\n1 Sol Ring\n1 Command Tower (C21) 279\n...\n\nPrintings like (C21) 279 are kept.'}
            value={list}
            onChange={(e) => setList(e.target.value)}
          />
          <button disabled={!!status?.loading}>Add deck</button>
        </form>
      )}

      {status?.loading && <p className="muted">{status.loading}</p>}
      {status?.error && <p className="error">{status.error}</p>}
      {status?.notFound && (
        <p className="error">Saved, but Scryfall didn't recognise: {status.notFound.join(', ')}. Check the spelling.</p>
      )}
    </section>
  )
}
