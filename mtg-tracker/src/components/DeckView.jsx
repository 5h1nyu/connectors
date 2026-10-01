import { useState } from 'react'
import { CardName } from './CardPreview'
import CardImage from './CardImage'
import AddCardForm from './AddCardForm'
import MoveDialog from './MoveDialog'
import DeleteDeckDialog from './DeleteDeckDialog'
import ExportDialog from './ExportDialog'
import { useViewMode } from '../lib/useViewMode'
import ViewToggle from './ViewToggle'
import { colorsOf, deckSize } from '../lib/collection'

// Order card types the way most deck builders do.
const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']

function mainType(entry) {
  const typeLine = entry.card?.typeLine ?? ''
  return TYPE_ORDER.find((t) => typeLine.includes(t)) ?? 'Other'
}

const sum = (entries) => entries.reduce((total, e) => total + e.qty, 0)
const entryKey = (e) => `${e.name}|${e.card?.id}|${e.status}`

export default function DeckView({ deck, decks, looseCount, onBack, onAddCards, onMove, onReplace, onDelete }) {
  const [view, setView] = useViewMode('deck')
  const [moving, setMoving] = useState(null)
  const [dialog, setDialog] = useState(null) // 'delete' | 'export'

  const active = deck.cards.filter((e) => e.status === 'active')
  const out = deck.cards.filter((e) => e.status === 'out')
  const groups = {}
  for (const entry of active) (groups[mainType(entry)] ??= []).push(entry)
  const location = (status) => ({ type: 'deck', deckId: deck.id, status })

  return (
    <section className="panel deck-view">
      <button className="link back" onClick={onBack}>← All decks</button>
      <header>
        <h2>{deck.name}</h2>
        <span className="row pips">
          {colorsOf(deck).map((c) => <span key={c} className={`pip pip-${c}`} />)}
          <span className="muted">{deckSize(deck)} cards</span>
        </span>
        <span className="row header-actions">
          <ViewToggle mode={view} onChange={setView} />
          <button className="secondary" onClick={() => setDialog('export')}>Export</button>
          <button className="danger" onClick={() => setDialog('delete')}>Delete</button>
        </span>
      </header>

      <AddCardForm onAdd={onAddCards} looseCount={looseCount} buttonLabel="Add to deck" />

      <div className={view === 'visual' ? 'deck-columns' : ''}>
      {[...TYPE_ORDER, 'Other']
        .filter((type) => groups[type])
        .map((type) => (
          <div key={type} className={view === 'visual' ? 'type-section' : 'type-section list'}>
            <h3>{type} ({sum(groups[type])})</h3>
            {view === 'visual' ? (
              <div className="card-pile">
                {groups[type].map((e) => <CardImage key={entryKey(e)} card={e.card} name={e.name} qty={e.qty} />)}
              </div>
            ) : (
              <ul>
                {groups[type].map((e) => (
                  <li key={entryKey(e)}>
                    <span className="qty">{e.qty}</span>
                    <CardName card={e.card}>{e.name}</CardName>
                    <button className="icon" title="Move or take out" onClick={() => setMoving(e)}>✕</button>
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
              {out.map((e) => <CardImage key={entryKey(e)} card={e.card} name={e.name} qty={e.qty} dim />)}
            </div>
          ) : (
            <ul>
              {out.map((e) => (
                <li key={entryKey(e)}>
                  <span className="qty">{e.qty}</span>
                  <s><CardName card={e.card}>{e.name}</CardName></s>
                  <button className="link" onClick={() => onMove(e, location('out'), location('active'), e.qty)}>Put back in</button>
                  <button className="link" onClick={() => setMoving(e)}>Move…</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === 'visual' && <p className="muted small">Tip: click a card to move it, change its printing or take it out.</p>}

      {dialog === 'delete' && (
        <DeleteDeckDialog deck={deck} onCancel={() => setDialog(null)} onConfirm={onDelete} />
      )}
      {dialog === 'export' && <ExportDialog deck={deck} onClose={() => setDialog(null)} />}

      {moving && (
        <MoveDialog
          entry={moving}
          from={location(moving.status)}
          decks={decks}
          allowReplacement={moving.status === 'active'}
          onCancel={() => setMoving(null)}
          onConfirm={({ to, qty, replacement }) => {
            onMove(moving, location(moving.status), to, qty)
            if (replacement) onReplace(replacement, qty)
            setMoving(null)
          }}
        />
      )}
    </section>
  )
}
