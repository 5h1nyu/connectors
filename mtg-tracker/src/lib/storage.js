// Saves everything in the browser (localStorage).
// Shape: { decks: [{ id, name, addedAt, cards: [entry] }], loose: [entry] }
// entry: { name, qty, card, status }  status is 'active' or 'out' (swapped out, still with the deck)

const KEY = 'mtg-tracker:v2'
const OLD_KEY = 'mtg-tracker:decks' // step 1 only stored decks

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved) return saved

    // Upgrade data saved by the first version of the app.
    const oldDecks = JSON.parse(localStorage.getItem(OLD_KEY)) ?? []
    const decks = oldDecks.map((deck) => ({
      ...deck,
      cards: deck.cards.map((e) => ({ ...e, name: e.card?.name ?? e.name, status: 'active' })),
    }))
    return { decks, loose: [] }
  } catch {
    return { decks: [], loose: [] }
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}
