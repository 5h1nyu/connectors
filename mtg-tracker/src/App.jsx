import { useCallback, useEffect, useMemo, useState } from 'react'
import AddDeckForm from './components/AddDeckForm'
import DeckShelf from './components/DeckShelf'
import DeckView from './components/DeckView'
import CollectionView from './components/CollectionView'
import BrewChecker from './components/BrewChecker'
import Backup from './components/Backup'
import Account from './components/Account'
import CardData from './components/CardData'
import CardDetail from './components/CardDetail'
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
  const [deckScreen, setDeckScreen] = useState('shelf') // 'shelf' | 'new' | a deck id
  const [detailCard, setDetailCard] = useState(null) // card shown on the full card page
  const [toast, setToast] = useState(null) // { message, undo }
  const sync = useCloudSync(state, setState)

  // Save to the browser whenever anything changes.
  useEffect(() => saveState(state), [state])

  const collection = useMemo(() => col.buildCollection(state), [state])
  const selected = state.decks.find((d) => d.id === deckScreen)
  const looseCount = (name) => col.countOf(state.loose, name)
  const closeToast = useCallback(() => setToast(null), [])

  const openDeck = (id) => {
    setDeckScreen(id)
    setTab('decks')
    setDetailCard(null)
  }

  // Everything the card page and deck screens can do to your collection.
  const actions = {
    move: (entry, from, to, qty) => {
      setState((s) => col.moveCards(s, entry, from, to, qty))
      if (to.type === 'gone') setToast({ message: `Removed ${qty}× ${entry.name}.`, undo: snapshotUndo() })
    },
    changePrinting: (entry, loc, card) => setState((s) => col.changePrinting(s, entry, loc, card)),
    setCover: (deckId, name) => setState((s) => col.setCover(s, deckId, name)),
    addLoose: (cards) => {
      setState((s) => col.addLoose(s, cards))
      setToast({ message: `Added ${cards[0].name} to loose cards.` })
    },
    replace: async (deckId, name, qty) => {
      const { cards } = await lookupEntries([{ name, qty }])
      setState((s) => col.addToDeck(s, deckId, cards.filter((c) => c.card), true))
    },
  }

  function snapshotUndo() {
    const before = state
    return () => setState(before)
  }

  return (
    <CardPreviewProvider onOpenCard={setDetailCard}>
      <header className="app-header">
        <h1><span className="logo" aria-hidden="true">⛨</span> Shinyu's Vault</h1>
        <nav className="tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); if (id === 'decks') setDeckScreen('shelf') }}>
              {label}
            </button>
          ))}
        </nav>
        {sync.user && (
          <span className={`sync-badge ${sync.status === 'error' ? 'error' : ''}`}>
            {sync.status === 'synced' ? '✓ Synced' : sync.status === 'saving' ? 'Saving…' : '⚠ Not synced'}
          </span>
        )}
      </header>

      <main>
        {tab === 'decks' && !selected && deckScreen !== 'new' && (
          <DeckShelf decks={state.decks} onOpen={setDeckScreen} onNew={() => setDeckScreen('new')} />
        )}
        {tab === 'decks' && deckScreen === 'new' && (
          <AddDeckForm
            onBack={() => setDeckScreen('shelf')}
            onAdd={(deck) => {
              setState((s) => ({ ...s, decks: [...s.decks, deck] }))
              setDeckScreen(deck.id)
            }}
          />
        )}
        {tab === 'decks' && selected && (
          <DeckView
            key={selected.id}
            deck={selected}
            decks={state.decks}
            looseCount={looseCount}
            onBack={() => setDeckScreen('shelf')}
            onAddCards={(cards, takeFromLoose) => setState((s) => col.addToDeck(s, selected.id, cards, takeFromLoose))}
            onMove={actions.move}
            onReplace={(name, qty) => actions.replace(selected.id, name, qty)}
            onDelete={(keepCards) => {
              const undo = snapshotUndo()
              setState((s) => col.deleteDeck(s, selected.id, keepCards))
              setDeckScreen('shelf')
              setToast({
                message: `Deleted ${selected.name}${keepCards ? ', cards moved to loose' : ''}.`,
                undo: () => {
                  undo()
                  setDeckScreen(selected.id)
                },
              })
            }}
          />
        )}

        {tab === 'collection' && (
          <CollectionView
            collection={collection}
            onAddLoose={(cards) => setState((s) => col.addLoose(s, cards))}
            onOpenDeck={openDeck}
          />
        )}
        {tab === 'brew' && <BrewChecker collection={collection} onOpenDeck={openDeck} />}
        {tab === 'settings' && (
          <div className="stack">
            <Account sync={sync} />
            <CardData state={state} onRefresh={(byId) => setState((s) => col.refreshCards(s, byId))} />
            <Backup state={state} onRestore={setState} />
          </div>
        )}
      </main>

      {detailCard && (
        <CardDetail
          card={detailCard}
          item={collection.get(col.key(detailCard.name))}
          decks={state.decks}
          actions={actions}
          onClose={() => setDetailCard(null)}
        />
      )}
      {toast && <Toast message={toast.message} onUndo={toast.undo} onClose={closeToast} />}
    </CardPreviewProvider>
  )
}
