import { useEffect, useState } from 'react'
import PageHeader from './PageHeader'
import Avatar from './Avatar'
import CardImage from './CardImage'
import { DeckStack } from './DeckShelf'
import { getSharedVault } from '../lib/social'
import { colorsOf, deckSize } from '../lib/collection'

const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']
const mainType = (e) => TYPE_ORDER.find((t) => (e.card?.typeLine ?? '').includes(t)) ?? 'Other'

// One of someone else's decks, read-only. Clicking a card shows whether *you* own it.
function SharedDeck({ deck, owner, onBack }) {
  const cards = deck.cards.filter((e) => e.status !== 'out')
  const groups = {}
  for (const e of cards) (groups[mainType(e)] ??= []).push(e)
  return (
    <section>
      <PageHeader
        back={{ label: `${owner}'s vault`, onClick: onBack }}
        title={deck.name}
        subtitle={
          <span className="deck-meta">
            <span className="pips">{colorsOf(deck).map((c) => <span key={c} className={`pip pip-${c}`} />)}</span>
            {deckSize(deck)} cards
          </span>
        }
      />
      <div className="deck-columns">
        {[...TYPE_ORDER, 'Other'].filter((t) => groups[t]).map((t) => (
          <div key={t} className="type-section">
            <h3>{t} ({groups[t].reduce((n, e) => n + e.qty, 0)})</h3>
            <div className="card-pile">
              {groups[t].map((e, i) => <CardImage key={i} card={e.card} name={e.name} qty={e.qty} />)}
            </div>
          </div>
        ))}
      </div>
      <p className="muted small">Click a card to see it, and whether you own a copy.</p>
    </section>
  )
}

// Someone's vault: the decks and collection they've chosen to share with you.
export default function VaultView({ profile, onBack, backLabel = 'Friends' }) {
  const [vault, setVault] = useState(null)
  const [error, setError] = useState(null)
  const [openDeck, setOpenDeck] = useState(null)

  useEffect(() => {
    getSharedVault(profile.id).then(setVault).catch((err) => setError(err.message))
  }, [profile.id])

  const name = profile.display_name || profile.username
  if (openDeck) return <SharedDeck deck={openDeck} owner={name} onBack={() => setOpenDeck(null)} />

  const loose = vault?.loose
  return (
    <section>
      <PageHeader
        back={onBack && { label: backLabel, onClick: onBack }}
        title={<span className="profile-title"><Avatar profile={profile} size={64} /> {name}</span>}
        subtitle={`@${profile.username}`}
      />
      {error && <p className="error">Couldn't load this vault: {error}</p>}
      {!vault && !error && <p className="muted"><span className="spinner" /> Opening the vault…</p>}
      {vault && (
        <>
          <h3>Decks</h3>
          {vault.decks.length === 0 ? (
            <p className="muted">No decks shared with you yet.</p>
          ) : (
            <section className="deck-shelf">
              {vault.decks.map((deck, i) => <DeckStack key={deck.id} deck={deck} index={i} onOpen={() => setOpenDeck(deck)} />)}
            </section>
          )}
          <h3>Loose cards</h3>
          {loose == null ? (
            <p className="muted">{name} keeps their collection private.</p>
          ) : loose.length === 0 ? (
            <p className="muted">No loose cards.</p>
          ) : (
            <div className="card-grid binder">
              {loose.map((e, i) => (
                <div key={i} className="binder-slot" style={{ '--n': i }}>
                  <CardImage card={e.card} name={e.name} qty={e.qty} small index={i} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
