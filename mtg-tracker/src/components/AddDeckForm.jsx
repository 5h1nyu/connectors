import { useState } from 'react'
import { parseDecklist } from '../lib/parseDecklist'
import { fetchCards } from '../lib/scryfall'

export default function AddDeckForm({ onAdd }) {
  const [name, setName] = useState('')
  const [list, setList] = useState('')
  const [status, setStatus] = useState(null) // { loading } | { error } | { notFound }

  async function handleSubmit(e) {
    e.preventDefault()
    const entries = parseDecklist(list)
    if (!name.trim() || entries.length === 0) {
      setStatus({ error: 'Give the deck a name and paste at least one card.' })
      return
    }

    setStatus({ loading: true })
    try {
      const { found, notFound } = await fetchCards(entries.map((c) => c.name))
      const cards = entries.map((c) => ({ ...c, card: found[c.name.toLowerCase()] ?? null }))
      onAdd({ id: crypto.randomUUID(), name: name.trim(), addedAt: Date.now(), cards })
      setName('')
      setList('')
      setStatus(notFound.length ? { notFound } : null)
    } catch (err) {
      setStatus({ error: `Couldn't reach Scryfall: ${err.message}` })
    }
  }

  return (
    <form className="add-deck" onSubmit={handleSubmit}>
      <h2>Add a deck</h2>
      <input
        placeholder="Deck name, e.g. Atraxa precon"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        rows={10}
        placeholder={'Paste a decklist, one card per line:\n1 Sol Ring\n1 Command Tower\n...'}
        value={list}
        onChange={(e) => setList(e.target.value)}
      />
      <button disabled={status?.loading}>{status?.loading ? 'Looking up cards…' : 'Add deck'}</button>
      {status?.error && <p className="error">{status.error}</p>}
      {status?.notFound && (
        <p className="error">
          Saved, but Scryfall didn't recognise: {status.notFound.join(', ')}. Check the spelling.
        </p>
      )}
    </form>
  )
}
