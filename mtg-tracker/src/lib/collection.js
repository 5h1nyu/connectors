// Pure functions that change your collection. Each takes the current state and returns a new one,
// which is how React likes it (never edit state in place).

export const key = (name) => name.toLowerCase()

// Add copies to a list of entries, merging with an existing entry of the same name + status.
export function addEntry(list, { name, card, qty }, status = 'active') {
  const i = list.findIndex((e) => key(e.name) === key(name) && e.status === status)
  if (i === -1) return [...list, { name, card, qty, status }]
  return list.map((e, j) => (j === i ? { ...e, qty: e.qty + qty, card: e.card ?? card } : e))
}

export function removeEntry(list, name, status, qty) {
  return list.flatMap((e) =>
    key(e.name) === key(name) && e.status === status
      ? e.qty > qty ? [{ ...e, qty: e.qty - qty }] : []
      : [e],
  )
}

export const countOf = (list, name, status = 'active') =>
  list.find((e) => key(e.name) === key(name) && e.status === status)?.qty ?? 0

const updateDeck = (state, deckId, fn) => ({
  ...state,
  decks: state.decks.map((d) => (d.id === deckId ? { ...d, cards: fn(d.cards) } : d)),
})

// Add cards to a deck. With takeFromLoose, copies you already have loose are moved instead of counted as new.
export function addToDeck(state, deckId, cards, takeFromLoose) {
  let loose = state.loose
  if (takeFromLoose) {
    for (const c of cards) {
      const moved = Math.min(c.qty, countOf(loose, c.name))
      if (moved) loose = removeEntry(loose, c.name, 'active', moved)
    }
  }
  const next = updateDeck(state, deckId, (list) => cards.reduce((l, c) => addEntry(l, c), list))
  return { ...next, loose }
}

// Move copies out of a deck. fate: 'active' | 'out' (stay with the deck) | 'loose' | 'gone' (sold/traded)
export function moveFromDeck(state, deckId, entry, qty, fate) {
  const moved = { ...entry, qty }
  let next = updateDeck(state, deckId, (list) => {
    const without = removeEntry(list, entry.name, entry.status, qty)
    return fate === 'active' || fate === 'out' ? addEntry(without, moved, fate) : without
  })
  if (fate === 'loose') next = { ...next, loose: addEntry(next.loose, moved) }
  return next
}

export function addLoose(state, cards) {
  return { ...state, loose: cards.reduce((l, c) => addEntry(l, c), state.loose) }
}

export function removeLoose(state, name, qty) {
  return { ...state, loose: removeEntry(state.loose, name, 'active', qty) }
}

export function deleteDeck(state, deckId, keepCards) {
  const deck = state.decks.find((d) => d.id === deckId)
  const next = { ...state, decks: state.decks.filter((d) => d.id !== deckId) }
  return keepCards ? addLoose(next, deck.cards) : next
}

// Every card you own in one place: { name, card, total, places: [{ deckId, deckName, swappedOut, loose, qty }] }
export function buildCollection({ decks, loose }) {
  const map = new Map()
  const add = (entry, where) => {
    const item = map.get(key(entry.name)) ?? { name: entry.name, card: entry.card, total: 0, places: [] }
    item.card ??= entry.card
    item.total += entry.qty
    item.places.push({ ...where, qty: entry.qty })
    map.set(key(entry.name), item)
  }
  for (const deck of decks) {
    for (const e of deck.cards) add(e, { deckId: deck.id, deckName: deck.name, swappedOut: e.status === 'out' })
  }
  for (const e of loose) add(e, { loose: true })
  return map
}

// Best places to grab a card from first: loose, then swapped-out copies, then other decks.
export const placeRank = (p) => (p.loose ? 0 : p.swappedOut ? 1 : 2)

export function newDeck(name, cards) {
  return {
    id: crypto.randomUUID(),
    name,
    addedAt: Date.now(),
    cards: cards.map((c) => ({ ...c, status: 'active' })),
  }
}
