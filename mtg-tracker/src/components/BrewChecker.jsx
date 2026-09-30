import { useState } from 'react'
import { CardName } from './CardPreview'
import Places from './Places'
import { parseDecklist } from '../lib/parseDecklist'
import { lookupEntries } from '../lib/scryfall'
import { key } from '../lib/collection'

// Paste a deck you want to build: see what you own (and where it is) and what to buy.
export default function BrewChecker({ collection, onOpenDeck }) {
  const [list, setList] = useState('')
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)

  async function check(e) {
    e.preventDefault()
    const entries = parseDecklist(list)
    if (!entries.length) return
    setStatus({ loading: true })
    try {
      const { cards, notFound } = await lookupEntries(entries)
      setRows(cards)
      setStatus(notFound.length ? { error: `Not found: ${notFound.join(', ')}` } : null)
    } catch (err) {
      setStatus({ error: `Couldn't reach Scryfall: ${err.message}` })
    }
  }

  // For each card: how many you own and how many you still need.
  const results = rows?.map((row) => {
    const owned = collection.get(key(row.name))
    const have = Math.min(row.qty, owned?.total ?? 0)
    return { ...row, owned, have, need: row.qty - have }
  })
  const toBuy = results?.filter((r) => r.need > 0) ?? []
  const have = results?.filter((r) => r.have > 0) ?? []
  const cost = toBuy.reduce((n, r) => n + r.need * Number(r.card?.priceUsd ?? 0), 0)
  const buyList = toBuy.map((r) => `${r.need} ${r.name}`).join('\n')

  return (
    <section className="panel">
      <h2>Brew checker</h2>
      <p className="muted">Paste a decklist you want to build. You'll see which cards you already own, where they are, and what's left to buy.</p>
      <form className="stack" onSubmit={check}>
        <textarea rows={8} placeholder={'1 Sol Ring\n1 Arcane Signet\n...'} value={list} onChange={(e) => setList(e.target.value)} />
        <button disabled={status?.loading}>{status?.loading ? 'Checking…' : 'Check my collection'}</button>
      </form>
      {status?.error && <p className="error">{status.error}</p>}

      {results && (
        <div className="brew-results">
          <div>
            <h3>Need to buy ({toBuy.reduce((n, r) => n + r.need, 0)}) · about ${cost.toFixed(2)}</h3>
            {toBuy.length > 0 && (
              <div className="row small">
                <button
                  className="secondary"
                  onClick={() => navigator.clipboard.writeText(buyList).then(() => setCopied(true))}
                >
                  {copied ? 'Copied!' : 'Copy buy list'}
                </button>
                <span className="muted">
                  then paste into{' '}
                  <a href="https://www.tcgplayer.com/massentry" target="_blank" rel="noreferrer">TCGplayer Mass Entry</a> or{' '}
                  <a href="https://www.cardkingdom.com/builder" target="_blank" rel="noreferrer">Card Kingdom</a>
                </span>
              </div>
            )}
            <ul>
              {toBuy.map((r) => (
                <li key={r.name}>
                  <span className="qty">{r.need}</span>
                  <CardName card={r.card}>{r.name}</CardName>
                  <span className="muted">{r.card?.priceUsd && `$${r.card.priceUsd}`}</span>
                  {r.card?.buyUrl && <a href={r.card.buyUrl} target="_blank" rel="noreferrer">buy</a>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Already have ({have.reduce((n, r) => n + r.have, 0)})</h3>
            <ul>
              {have.map((r) => (
                <li key={r.name}>
                  <span className="qty">{r.have}</span>
                  <CardName card={r.card}>{r.name}</CardName>
                  <Places places={r.owned.places} onOpenDeck={onOpenDeck} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
