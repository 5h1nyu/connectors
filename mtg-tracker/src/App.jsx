import { useCallback, useEffect, useMemo, useState } from 'react'
import AddDeckForm from './components/AddDeckForm'
import DeckView from './components/DeckView'
import CollectionView from './components/CollectionView'
import BrewChecker from './components/BrewChecker'
import Backup from './components/Backup'
import Account from './components/Account'
import CardData from './components/CardData'
import Toast from './components/Toast'
import { CardPreviewProvider } from './components/CardPreview'
import { loadState, saveState } from './lib/storage'
import { lookupEntries } from './lib/scryfall'
import { useCloudSync } from './lib/useCloudSync'
import * as col from './lib/collection'

const TABS = [
  ['decks', 'Decks'],
  ['collection', 'Collection'],
  ['brew', 'Brew checker'],
  ['settings', 'Settings'],
]

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('decks')
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState(null) // { message, undo }
  const sync = useCloudSync(state, setState)

  // Save to the browser whenever anything changes.
  useEffect(() => saveState(state), [state])

  const collection = useMemo(() => col.buildCollection(state), [state])
  const selected = state.decks.find((d) => d.id === selectedId)
  const looseCount = (name) => col.countOf(state.loose, name)

  const closeToast = useCallback(() => setToast(null), [])

  const openDeck = (id) => {
    setSelectedId(id)
    setTab('decks')
  }

  return (
    <CardPreviewProvider>
      <header className="app-header">
        <h1><span className="logo" aria-hidden="true">⛨</span> Shinyu's Vault</h1>
        <nav className="tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        {sync.user && (
          <span className={`sync-badge ${sync.status === 'error' ? 'error' : ''}`}>
            {sync.status === 'synced' ? '✓ Synced' : sync.status === 'saving' ? 'Saving…' : sync.status === 'error' ? '⚠ Not synced' : ''}
          </span>
        )}
      </header>

      {tab === 'decks' && (
        <main className="with-sidebar">
          <aside className="panel">
            <h2>My decks</h2>
            {state.decks.length === 0 && <p className="muted">No decks yet. Add your first one.</p>}
            <ul className="deck-list">
              {state.decks.map((deck) => (
                <li key={deck.id}>
                  <button className={deck.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(deck.id)}>
                    {deck.name}
                  </button>
                </li>
              ))}
            </ul>
            <button className="secondary wide" onClick={() => setSelectedId(null)}>+ Add a deck</button>
          </aside>

          {selected ? (
            <DeckView
              key={selected.id}
              deck={selected}
              looseCount={looseCount}
              onAddCards={(cards, takeFromLoose) => setState((s) => col.addToDeck(s, selected.id, cards, takeFromLoose))}
              onMove={(entry, qty, fate) => setState((s) => col.moveFromDeck(s, selected.id, entry, qty, fate))}
              onReplace={async (name, qty) => {
                const { cards } = await lookupEntries([{ name, qty }])
                setState((s) => col.addToDeck(s, selected.id, cards.filter((c) => c.card), true))
              }}
              onDelete={(keepCards) => {
                const before = state
                setState((s) => col.deleteDeck(s, selected.id, keepCards))
                setSelectedId(null)
                setToast({
                  message: `Deleted ${selected.name}${keepCards ? ', cards moved to loose' : ''}.`,
                  undo: () => {
                    setState(before)
                    setSelectedId(selected.id)
                  },
                })
              }}
            />
          ) : (
            <AddDeckForm
              onAdd={(deck) => {
                setState((s) => ({ ...s, decks: [...s.decks, deck] }))
                setSelectedId(deck.id)
              }}
            />
          )}
        </main>
      )}

      {tab !== 'decks' && <main>
        {tab === 'collection' && (
          <CollectionView
            collection={collection}
            onAddLoose={(cards) => setState((s) => col.addLoose(s, cards))}
            onRemoveLoose={(name) => setState((s) => col.removeLoose(s, name, 1))}
            onOpenDeck={openDeck}
          />
        )}
        {tab === 'brew' && <BrewChecker collection={collection} onOpenDeck={openDeck} />}
        {tab === 'settings' && (
          <div className="stack">
            <Account sync={sync} />
            <CardData
              names={[...collection.values()].map((item) => item.name)}
              onRefresh={(found) => setState((s) => col.refreshCards(s, found))}
            />
            <Backup state={state} onRestore={setState} />
          </div>
        )}
      </main>}
      {toast && <Toast message={toast.message} onUndo={toast.undo} onClose={closeToast} />}
    </CardPreviewProvider>
  )
}
