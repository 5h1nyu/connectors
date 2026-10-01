import { useCallback, useEffect, useMemo, useState } from 'react'
import AddDeckForm from './components/AddDeckForm'
import DeckShelf from './components/DeckShelf'
import DeckView from './components/DeckView'
import CollectionView from './components/CollectionView'
import NewDeckDialog from './components/NewDeckDialog'
import Backup from './components/Backup'
import Account from './components/Account'
import CardData from './components/CardData'
import CardDetail from './components/CardDetail'
import Toast from './components/Toast'
import Logo from './components/Logo'
import { CardPreviewProvider } from './components/CardPreview'
import { loadState, saveState } from './lib/storage'
import { lookupEntries } from './lib/scryfall'
import { useCloudSync } from './lib/useCloudSync'
import * as col from './lib/collection'

const TABS = [
  ['decks', 'Decks'],
  ['collection', 'Collection'],
  ['settings', 'Settings'],
]

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('decks')
  const [deckScreen, setDeckScreen] = useState('shelf') // 'shelf' | 'import' | a deck id
  const [creating, setCreating] = useState(false) // the "Build a new deck" dialog
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
    moveMany: (copies, to) => {
      const undo = snapshotUndo()
      setState((s) => col.moveMany(s, copies, to))
      const n = copies.reduce((sum, c) => sum + c.entry.qty, 0)
      const where = to.type === 'loose' ? 'loose cards' : state.decks.find((d) => d.id === to.deckId)?.name
      const message = to.status === 'out' ? `Swapped out ${n} card(s).` : `Moved ${n} card(s) to ${where}.`
      setToast({ message, undo })
    },
    removeMany: (copies) => {
      const undo = snapshotUndo()
      setState((s) => col.moveMany(s, copies, { type: 'gone' }))
      setToast({ message: `Removed ${copies.reduce((n, c) => n + c.entry.qty, 0)} card(s).`, undo })
    },
    addToDeck: (deck, cards, { takeFromLoose, wanted } = {}) =>
      setState((s) => (deck.brew || wanted ? col.addWanted(s, deck.id, cards) : col.addToDeck(s, deck.id, cards, takeFromLoose))),
    markBought: (deckId, entries) => setState((s) => col.markBought(s, deckId, entries)),
    finishBuild: (deckId, opts) => {
      const undo = snapshotUndo()
      const { log } = col.finishBuild(state, deckId, opts)
      setState((s) => col.finishBuild(s, deckId, opts).state)
      const taken = log.loose + log.out + Object.values(log.decks).reduce((a, b) => a + b, 0)
      setToast({ message: `Deck built: ${taken} card(s) gathered${log.buy ? `, ${log.buy} still to buy` : ''}.`, undo })
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
        <h1 className="brand-h1"><Logo /></h1>
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
        {tab === 'decks' && !selected && deckScreen !== 'import' && (
          <DeckShelf decks={state.decks} onOpen={setDeckScreen} onNew={() => setCreating(true)} onImport={() => setDeckScreen('import')} />
        )}
        {creating && (
          <NewDeckDialog
            onCancel={() => setCreating(false)}
            onImport={() => { setCreating(false); setDeckScreen('import') }}
            onCreate={(name, cards) => {
              const deck = col.newDeck(name, cards, { brew: true })
              setState((s) => ({ ...s, decks: [...s.decks, deck] }))
              setCreating(false)
              setTab('decks')
              setDeckScreen(deck.id)
            }}
          />
        )}
        {tab === 'decks' && deckScreen === 'import' && (
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
            state={state}
            collection={collection}
            looseCount={looseCount}
            actions={actions}
            onBack={() => setDeckScreen('shelf')}
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
            decks={state.decks}
            onAddLoose={(cards) => setState((s) => col.addLoose(s, cards))}
            onMoveMany={actions.moveMany}
            onRemoveMany={actions.removeMany}
            onOpenDeck={openDeck}
          />
        )}
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
          wantedIn={state.decks
            .filter((d) => d.cards.some((e) => e.status === 'wanted' && col.key(e.name) === col.key(detailCard.name)))
            .map((d) => d.name)}
          decks={state.decks.filter((d) => !d.brew)}
          actions={actions}
          onClose={() => setDetailCard(null)}
        />
      )}
      {toast && <Toast message={toast.message} onUndo={toast.undo} onClose={closeToast} />}
    </CardPreviewProvider>
  )
}
