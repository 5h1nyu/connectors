import { useState } from 'react'
import { CardName } from './CardPreview'
import CardImage from './CardImage'
import AddCardForm from './AddCardForm'
import MoveDialog from './MoveDialog'
import DeleteDeckDialog from './DeleteDeckDialog'
import ExportDialog from './ExportDialog'
import BuildDialog from './BuildDialog'
import SelectionBar, { MoveToSelect } from './SelectionBar'
import ConfirmRemoveDialog from './ConfirmRemoveDialog'
import ViewToggle from './ViewToggle'
import PageHeader from './PageHeader'
import { useViewMode } from '../lib/useViewMode'
import { availability, colorsOf, copyKey, deckSize, key } from '../lib/collection'

// Order card types the way most deck builders do.
const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']

function mainType(entry) {
  const typeLine = entry.card?.typeLine ?? ''
  return TYPE_ORDER.find((t) => typeLine.includes(t)) ?? 'Other'
}

const sum = (entries) => entries.reduce((total, e) => total + e.qty, 0)
const money = (n) => `$${n.toFixed(2)}`

export default function DeckView({ deck, state, collection, looseCount, actions, onBack, onDelete }) {
  const [view, setView] = useViewMode('deck')
  const [moving, setMoving] = useState(null)
  const [dialog, setDialog] = useState(null) // 'delete' | 'export' | 'build' | 'remove'
  const [selected, setSelected] = useState(() => new Set())
  const [copied, setCopied] = useState(false)

  const loc = (status) => ({ type: 'deck', deckId: deck.id, status })
  const copyOf = (e) => ({ entry: e, loc: loc(e.status) })
  const playing = deck.cards.filter((e) => e.status !== 'out')
  const out = deck.cards.filter((e) => e.status === 'out')
  const wanted = deck.cards.filter((e) => e.status === 'wanted')
  const avail = availability(deck, collection)
  const toBuy = wanted.filter((e) => avail[key(e.name)]?.kind === 'buy')
  const cost = toBuy.reduce((n, e) => n + e.qty * Number(e.card?.priceUsd ?? 0), 0)
  const owned = sum(playing.filter((e) => e.status === 'active'))
  const elsewhere = sum(wanted) - sum(toBuy)

  const groups = {}
  for (const entry of playing) (groups[mainType(entry)] ??= []).push(entry)

  const badgeFor = (e) => (e.status === 'wanted' ? avail[key(e.name)] : null)
  const toggle = (e) => {
    const k = copyKey(copyOf(e))
    const next = new Set(selected)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setSelected(next)
  }
  const isSelected = (e) => selected.has(copyKey(copyOf(e)))
  const picked = deck.cards.filter(isSelected)
  const pickedOwned = picked.filter((e) => e.status !== 'wanted')
  const done = () => setSelected(new Set())

  function copyBuyList() {
    navigator.clipboard.writeText(toBuy.map((e) => `${e.qty} ${e.name}`).join('\n')).then(() => setCopied(true))
  }

  return (
    <section className="deck-view">
      <PageHeader
        back={{ label: 'Decks', onClick: onBack }}
        title={<>{deck.name} {deck.brew && <span className="brew-badge inline">Brewing</span>}</>}
        subtitle={
          <span className="deck-meta">
            <span className="pips">{colorsOf(deck).map((c) => <span key={c} className={`pip pip-${c}`} />)}</span>
            {deckSize(deck)} cards
          </span>
        }
        actions={
          <>
            <ViewToggle mode={view} onChange={setView} />
            <button className="secondary" onClick={() => setDialog('export')}>Export</button>
            <button className="secondary danger" onClick={() => setDialog('delete')}>Delete</button>
          </>
        }
      />

      {(deck.brew || wanted.length > 0) && (
        <div className="brew-summary">
          <div className="stat-chip"><strong>{owned}</strong><span>in this deck</span></div>
          <div className="stat-chip"><strong>{elsewhere}</strong><span>you own elsewhere</span></div>
          <div className="stat-chip buy"><strong>{sum(toBuy)}</strong><span>to buy · {money(cost)}</span></div>
          <div className="row brew-actions">
            {toBuy.length > 0 && <button className="secondary" onClick={copyBuyList}>{copied ? '✓ Copied' : 'Copy buy list'}</button>}
            {wanted.length > 0 && (
              <button onClick={() => setDialog('build')}>{deck.brew ? 'Finish building →' : 'Get missing cards →'}</button>
            )}
          </div>
          {toBuy.length > 0 && (
            <p className="muted small">
              Paste the buy list into <a href="https://www.tcgplayer.com/massentry" target="_blank" rel="noreferrer">TCGplayer Mass Entry</a> or{' '}
              <a href="https://www.cardkingdom.com/builder" target="_blank" rel="noreferrer">Card Kingdom</a>.
            </p>
          )}
        </div>
      )}

      <AddCardForm
        placeholder={deck.brew ? 'Search a card to add to this brew' : 'Card name'}
        looseCount={deck.brew ? undefined : looseCount}
        allowWanted={!deck.brew}
        buttonLabel="Add to deck"
        onAdd={(cards, opts) => actions.addToDeck(deck, cards, opts)}
      />
      {deck.brew && deck.cards.length === 0 && (
        <p className="muted empty-hint">Your brew is empty. Search for cards above, or click “Paste a list instead”.</p>
      )}

      <SelectionBar count={picked.length} onClear={done}>
        {pickedOwned.length > 0 && (
          <MoveToSelect decks={state.decks.filter((d) => d.id !== deck.id)} onMove={(to) => { actions.moveMany(pickedOwned.map(copyOf), to); done() }} />
        )}
        {picked.some((e) => e.status === 'active') && (
          <button className="secondary" onClick={() => { actions.moveMany(picked.filter((e) => e.status === 'active').map(copyOf), loc('out')); done() }}>
            Swap out
          </button>
        )}
        {picked.some((e) => e.status === 'out') && (
          <button className="secondary" onClick={() => { actions.moveMany(picked.filter((e) => e.status === 'out').map(copyOf), loc('active')); done() }}>
            Put back in
          </button>
        )}
        {picked.some((e) => e.status === 'wanted') && (
          <button className="secondary" onClick={() => { actions.markBought(deck.id, picked.filter((e) => e.status === 'wanted')); done() }}>
            Mark as bought
          </button>
        )}
        <button className="danger" onClick={() => setDialog('remove')}>Remove…</button>
      </SelectionBar>

      <div className={view === 'visual' ? 'deck-columns' : ''}>
        {[...TYPE_ORDER, 'Other']
          .filter((type) => groups[type])
          .map((type) => (
            <div key={type} className={view === 'visual' ? 'type-section' : 'type-section list'}>
              <h3>{type} ({sum(groups[type])})</h3>
              {view === 'visual' ? (
                <div className="card-pile">
                  {groups[type].map((e) => (
                    <CardImage key={copyKey(copyOf(e))} card={e.card} name={e.name} qty={e.qty} badge={badgeFor(e)}
                      selected={isSelected(e)} onToggle={() => toggle(e)} />
                  ))}
                </div>
              ) : (
                <ul>
                  {groups[type].map((e) => (
                    <li key={copyKey(copyOf(e))} className={isSelected(e) ? 'selected' : ''}>
                      <input type="checkbox" checked={isSelected(e)} onChange={() => toggle(e)} aria-label={`Select ${e.name}`} />
                      <span className="qty">{e.qty}</span>
                      <CardName card={e.card}>{e.name}</CardName>
                      {badgeFor(e) && <span className={`avail avail-${badgeFor(e).kind}`}>{badgeFor(e).label}</span>}
                      {e.status === 'active' && <button className="icon" title="Move or take out" onClick={() => setMoving(e)}>✕</button>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>

      {out.length > 0 && (
        <div className="swapped-out">
          <h3>Swapped out, still with this deck ({sum(out)})</h3>
          {view === 'visual' ? (
            <div className="card-pile row-pile">
              {out.map((e) => (
                <CardImage key={copyKey(copyOf(e))} card={e.card} name={e.name} qty={e.qty} dim selected={isSelected(e)} onToggle={() => toggle(e)} />
              ))}
            </div>
          ) : (
            <ul>
              {out.map((e) => (
                <li key={copyKey(copyOf(e))}>
                  <input type="checkbox" checked={isSelected(e)} onChange={() => toggle(e)} aria-label={`Select ${e.name}`} />
                  <span className="qty">{e.qty}</span>
                  <s><CardName card={e.card}>{e.name}</CardName></s>
                  <button className="link" onClick={() => actions.move(e, loc('out'), loc('active'), e.qty)}>Put back in</button>
                  <button className="link" onClick={() => setMoving(e)}>Move…</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {deck.cards.length > 0 && <p className="muted small">Tick cards to move or remove several at once. Click a card for its details.</p>}

      {dialog === 'delete' && <DeleteDeckDialog deck={deck} onCancel={() => setDialog(null)} onConfirm={onDelete} />}
      {dialog === 'export' && <ExportDialog deck={deck} onClose={() => setDialog(null)} />}
      {dialog === 'remove' && (
        <ConfirmRemoveDialog
          copies={picked.map((e) => ({ ...copyOf(e), label: e.status === 'out' ? `${deck.name} (swapped out)` : deck.name }))}
          onCancel={() => setDialog(null)}
          onConfirm={() => { actions.removeMany(picked.map(copyOf)); done(); setDialog(null) }}
        />
      )}
      {dialog === 'build' && (
        <BuildDialog state={state} deck={deck} onCancel={() => setDialog(null)}
          onConfirm={(opts) => { actions.finishBuild(deck.id, opts); setDialog(null) }} />
      )}
      {moving && (
        <MoveDialog
          entry={moving}
          from={loc(moving.status)}
          decks={state.decks.filter((d) => !d.brew)}
          allowReplacement={moving.status === 'active'}
          onCancel={() => setMoving(null)}
          onConfirm={({ to, qty, replacement }) => {
            actions.move(moving, loc(moving.status), to, qty)
            if (replacement) actions.replace(deck.id, replacement, qty)
            setMoving(null)
          }}
        />
      )}
    </section>
  )
}
