import { useState } from 'react'
import { fetchByIds } from '../lib/scryfall'

// Card info (prices especially) is saved when you add a card. This fetches the latest from Scryfall,
// keeping the exact printing of every copy.
export default function CardData({ state, onRefresh }) {
  const [status, setStatus] = useState(null)
  const ids = [...new Set([...state.decks.flatMap((d) => d.cards), ...state.loose].map((e) => e.card?.id).filter(Boolean))]

  async function refresh() {
    setStatus('Updating…')
    try {
      const byId = await fetchByIds(ids)
      onRefresh(byId)
      setStatus(`✓ Updated ${Object.keys(byId).length} printings.`)
    } catch (err) {
      setStatus(`Couldn't reach Scryfall: ${err.message}`)
    }
  }

  return (
    <section className="panel stack">
      <h2>Card prices & info</h2>
      <p className="muted">
        Prices are saved when you add a card, so they slowly go out of date. Update them whenever you like.
      </p>
      <div>
        <button onClick={refresh} disabled={status === 'Updating…' || !ids.length}>
          {status === 'Updating…' ? <><span className="spinner" /> Updating…</> : 'Update prices & card info'}
        </button>
      </div>
      {status && status !== 'Updating…' && <p className="muted">{status}</p>}
    </section>
  )
}
