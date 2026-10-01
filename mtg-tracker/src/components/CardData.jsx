import { useState } from 'react'
import { fetchCards } from '../lib/scryfall'

// Card info (prices especially) is saved when you add a card. This fetches the latest from Scryfall.
export default function CardData({ names, onRefresh }) {
  const [status, setStatus] = useState(null)

  async function refresh() {
    setStatus('Updating…')
    try {
      const { found } = await fetchCards(names)
      onRefresh(found)
      setStatus(`Updated ${names.length} cards.`)
    } catch (err) {
      setStatus(`Couldn't reach Scryfall: ${err.message}`)
    }
  }

  return (
    <section className="panel stack">
      <h2>Card prices & info</h2>
      <p className="muted">
        Prices are saved when you add a card, so they slowly go out of date. Update them whenever you like
        (takes a few seconds per 1,000 cards).
      </p>
      <div><button onClick={refresh} disabled={status === 'Updating…' || !names.length}>Update prices & card info</button></div>
      {status && <p className="muted">{status}</p>}
    </section>
  )
}
