import { useEffect, useState } from 'react'
import AddDeckForm from './components/AddDeckForm'
import DeckView from './components/DeckView'
import { CardPreviewProvider } from './components/CardPreview'
import { loadDecks, saveDecks } from './lib/storage'

export default function App() {
  const [decks, setDecks] = useState(loadDecks)
  const [selectedId, setSelectedId] = useState(null)

  // Save to the browser whenever decks change.
  useEffect(() => saveDecks(decks), [decks])

  const selected = decks.find((d) => d.id === selectedId)

  return (
    <CardPreviewProvider>
      <header className="app-header">
        <h1>MTG Deck Tracker</h1>
      </header>
      <main>
        <aside>
          <h2>My decks</h2>
          {decks.length === 0 && <p className="muted">No decks yet. Add your first one.</p>}
          <ul className="deck-list">
            {decks.map((deck) => (
              <li key={deck.id}>
                <button
                  className={deck.id === selectedId ? 'active' : ''}
                  onClick={() => setSelectedId(deck.id)}
                >
                  {deck.name}
                </button>
              </li>
            ))}
          </ul>
          <button className="secondary" onClick={() => setSelectedId(null)}>+ Add a deck</button>
        </aside>

        {selected ? (
          <DeckView
            deck={selected}
            onDelete={(id) => {
              setDecks(decks.filter((d) => d.id !== id))
              setSelectedId(null)
            }}
          />
        ) : (
          <AddDeckForm
            onAdd={(deck) => {
              setDecks([...decks, deck])
              setSelectedId(deck.id)
            }}
          />
        )}
      </main>
    </CardPreviewProvider>
  )
}
