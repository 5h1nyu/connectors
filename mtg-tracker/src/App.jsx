import { useEffect, useMemo, useState } from 'react'
import AddDeckForm from './components/AddDeckForm'
import DeckView from './components/DeckView'
import CollectionView from './components/CollectionView'
import BrewChecker from './components/BrewChecker'
import Backup from './components/Backup'
import { CardPreviewProvider } from './components/CardPreview'
import { loadState, saveState } from './lib/storage'
import { lookupEntries } from './lib/scryfall'
import * as col from './lib/collection'

const TABS = [
  ['decks', 'Decks'],
  ['collection', 'Collection'],
  ['brew', 'Brew checker'],
  ['backup', 'Backup'],
]

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('decks')
  const [selectedId, setSelectedId] = useState(null)

  // Save to the browser whenever anything changes.
  useEffect(() => saveState(state), [state])

  const collection = useMemo(() => col.buildCollection(state), [state])
  const selected = state.decks.find((d) => d.id === selectedId)
  const looseCount = (name) => col.countOf(state.loose, name)

  const openDeck = (id) => {
    setSelectedId(id)
    setTab('decks')
  }

  return (
    <CardPreviewProvider>
      <header className="app-header">
        <h1>MTG Deck Tracker</h1>
        <nav className="tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
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
                setState((s) => col.deleteDeck(s, selected.id, keepCards))
                setSelectedId(null)
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
        {tab === 'backup' && <Backup state={state} onRestore={setState} />}
      </main>}
    </CardPreviewProvider>
  )
}
