// Pure functions that change your collection. Each takes the current state and returns a new one,
// which is how React likes it (never edit state in place).
//
// An entry is { name, qty, card, status }: `card` is the exact printing (card.id), and status is
// 'active' (in the deck) or 'out' (swapped out, still kept with the deck). Loose cards are 'active'.
//
// A location says where copies live:
//   { type: 'deck', deckId, status: 'active' | 'out' }   { type: 'loose' }   { type: 'gone' } (removed)

export const key = (name) => name.toLowerCase()
const printingOf = (e) => e.card?.id ?? null
const sameEntry = (e, name, printing, status) =>
  key(e.name) === key(name) && printingOf(e) === printing && e.status === status

const sum = (entries) => entries.reduce((n, e) => n + e.qty, 0)

// Add copies, merging with an existing entry of the same card, printing and status.
export function addEntry(list, { name, card, qty }, status = 'active') {
  const i = list.findIndex((e) => sameEntry(e, name, card?.id ?? null, status))
  if (i === -1) return [...list, { name, card, qty, status }]
  return list.map((e, j) => (j === i ? { ...e, qty: e.qty + qty } : e))
}

export function removeEntry(list, entry, qty) {
  return list.flatMap((e) =>
    sameEntry(e, entry.name, printingOf(entry), entry.status) ? (e.qty > qty ? [{ ...e, qty: e.qty - qty }] : []) : [e],
  )
}

// Copies of a card in a list, any printing.
export const countOf = (list, name) => sum(list.filter((e) => key(e.name) === key(name) && e.status === 'active'))

const statusAt = (loc) => (loc.type === 'deck' ? loc.status : 'active')

function updateAt(state, loc, fn) {
  if (loc.type === 'loose') return { ...state, loose: fn(state.loose) }
  if (loc.type === 'deck') {
    return { ...state, decks: state.decks.map((d) => (d.id === loc.deckId ? { ...d, cards: fn(d.cards) } : d)) }
  }
  return state // 'gone': the cards simply aren't added anywhere
}

// Move copies of one entry from one location to another (or to 'gone' to delete them).
export function moveCards(state, entry, from, to, qty) {
  const next = updateAt(state, from, (list) => removeEntry(list, entry, qty))
  return updateAt(next, to, (list) => addEntry(list, { ...entry, qty }, statusAt(to)))
}

// Swap the printing of some copies, keeping them where they are.
export function changePrinting(state, entry, loc, card) {
  const next = updateAt(state, loc, (list) => removeEntry(list, entry, entry.qty))
  return updateAt(next, loc, (list) => addEntry(list, { name: card.name, card, qty: entry.qty }, entry.status))
}

// Add cards to a deck. With takeFromLoose, copies you already have loose move into the deck
// (same printing first) instead of being counted as new cards.
export function addToDeck(state, deckId, cards, takeFromLoose) {
  const to = { type: 'deck', deckId, status: 'active' }
  let next = state
  for (const c of cards) {
    let remaining = c.qty
    if (takeFromLoose) {
      const loose = next.loose
        .filter((e) => key(e.name) === key(c.name))
        .sort((a, b) => (printingOf(b) === c.card?.id) - (printingOf(a) === c.card?.id))
      for (const e of loose) {
        if (!remaining) break
        const n = Math.min(remaining, e.qty)
        next = moveCards(next, e, { type: 'loose' }, to, n)
        remaining -= n
      }
    }
    if (remaining) next = updateAt(next, to, (list) => addEntry(list, { ...c, qty: remaining }))
  }
  return next
}

export function addLoose(state, cards) {
  return { ...state, loose: cards.reduce((l, c) => addEntry(l, c), state.loose) }
}

export function deleteDeck(state, deckId, keepCards) {
  const deck = state.decks.find((d) => d.id === deckId)
  const next = { ...state, decks: state.decks.filter((d) => d.id !== deckId) }
  return keepCards ? addLoose(next, deck.cards) : next
}

export function setCover(state, deckId, name) {
  return { ...state, decks: state.decks.map((d) => (d.id === deckId ? { ...d, cover: name } : d)) }
}

// commander: only when we know it (precon, or a "Commander" heading in a pasted list).
// cover: the card shown on top of the deck's stack; you can change it on any card's page.
export function newDeck(name, cards) {
  const commander = cards.find((c) => c.commander)
  const legend = cards.find((c) => /Legendary Creature/.test(c.card?.typeLine ?? ''))
  return {
    id: crypto.randomUUID(),
    name,
    addedAt: Date.now(),
    commander: commander?.name ?? null,
    cover: (commander ?? legend ?? cards[0])?.name ?? null,
    cards: cards.reduce((list, { name: n, qty, card }) => addEntry(list, { name: n, qty, card }), []),
  }
}

// The card shown on top of a deck's stack.
export function coverOf(deck) {
  const active = deck.cards.filter((e) => e.card?.image)
  return (active.find((e) => deck.cover && key(e.name) === key(deck.cover)) ?? active[0])?.card ?? null
}

// All colours in a deck, in WUBRG order.
export function colorsOf(deck) {
  const all = new Set(deck.cards.flatMap((e) => (e.status === 'active' ? e.card?.colors ?? [] : [])))
  return ['W', 'U', 'B', 'R', 'G'].filter((c) => all.has(c))
}

export const deckSize = (deck) => sum(deck.cards.filter((e) => e.status === 'active'))

// Every card you own in one place, grouped by name:
// { name, card, total, places: [{ deckId, deckName, swappedOut, loose, qty }], copies: [{ entry, loc, label }] }
export function buildCollection({ decks, loose }) {
  const map = new Map()
  const add = (entry, loc, label, place) => {
    const item = map.get(key(entry.name)) ?? { name: entry.name, card: entry.card, total: 0, places: [], copies: [] }
    item.card ??= entry.card
    item.total += entry.qty
    item.copies.push({ entry, loc, label })
    const same = item.places.find((p) => p.deckId === place.deckId && p.swappedOut === place.swappedOut && p.loose === place.loose)
    if (same) same.qty += entry.qty
    else item.places.push({ ...place, qty: entry.qty })
    map.set(key(entry.name), item)
  }
  for (const deck of decks) {
    for (const e of deck.cards) {
      const out = e.status === 'out'
      add(e, { type: 'deck', deckId: deck.id, status: e.status }, out ? `${deck.name} (swapped out)` : deck.name, {
        deckId: deck.id,
        deckName: deck.name,
        swappedOut: out,
        loose: false,
      })
    }
  }
  for (const e of loose) add(e, { type: 'loose' }, 'Loose cards', { loose: true, swappedOut: false })
  return map
}

// Best places to grab a card from first: loose, then swapped-out copies, then other decks.
export const placeRank = (p) => (p.loose ? 0 : p.swappedOut ? 1 : 2)

// Fresh card info, keeping each copy's printing. byId: { [printingId]: card }
export function refreshCards(state, byId) {
  const update = (e) => ({ ...e, card: (e.card?.id && byId[e.card.id]) || e.card })
  return {
    ...state,
    decks: state.decks.map((d) => ({ ...d, cards: d.cards.map(update) })),
    loose: state.loose.map(update),
  }
}

// A decklist other apps understand. withPrintings adds "(SET) 123" for Moxfield/Archidekt;
// without it you get plain Oracle names, which Tabletop Simulator importers need.
export function exportDeck(deck, withPrintings) {
  const line = (e) =>
    `${e.qty} ${e.name}${withPrintings && e.card?.set ? ` (${e.card.set.toUpperCase()}) ${e.card.number}` : ''}`
  const active = deck.cards.filter((e) => e.status === 'active')
  const isCommander = (e) => deck.commander && key(e.name) === key(deck.commander)
  const commander = active.filter(isCommander)
  const rest = active.filter((e) => !isCommander(e))
  return commander.length
    ? ['Commander', ...commander.map(line), '', 'Deck', ...rest.map(line)].join('\n')
    : rest.map(line).join('\n')
}
