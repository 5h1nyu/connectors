// Saves your decks in the browser (localStorage).
// Step 1 keeps everything on this device; syncing between phone and PC comes later.

const KEY = 'mtg-tracker:decks'

export function loadDecks() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function saveDecks(decks) {
  localStorage.setItem(KEY, JSON.stringify(decks))
}
