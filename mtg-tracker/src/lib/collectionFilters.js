// Filtering and sorting for the Collection page.

export const EMPTY_FILTERS = { search: '', where: 'all', colors: [], type: '', set: '', rarity: '', minPrice: '', maxPrice: '' }

export const TYPES = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']
export const RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']

export const SORTS = {
  name: 'Name A–Z',
  'name-desc': 'Name Z–A',
  'price-desc': 'Price: high to low',
  'price-asc': 'Price: low to high',
  qty: 'Most copies',
  set: 'Set',
  colour: 'Colour (WUBRG)',
  type: 'Card type',
  cmc: 'Mana value',
}

const price = (card) => Number(card?.priceUsd ?? 0)

// Mana value from a cost like "{2}{G}{G}" (X counts as 0).
export function manaValue(card) {
  const cost = (card?.manaCost ?? '').split(' // ')[0]
  return [...cost.matchAll(/\{([^}]+)\}/g)].reduce((n, [, s]) => n + (/^\d+$/.test(s) ? Number(s) : s === 'X' ? 0 : 1), 0)
}

// Does this copy (one printing in one place) pass the place/set/rarity/price filters?
export function copyMatches(copy, f) {
  const { loc, entry } = copy
  if (f.where === 'loose' && loc.type !== 'loose') return false
  if (f.where === 'out' && loc.status !== 'out') return false
  if (f.where.startsWith('deck:') && loc.deckId !== f.where.slice(5)) return false
  if (f.set && entry.card?.set !== f.set) return false
  if (f.rarity && entry.card?.rarity !== f.rarity) return false
  if (f.minPrice !== '' && price(entry.card) < Number(f.minPrice)) return false
  if (f.maxPrice !== '' && price(entry.card) > Number(f.maxPrice)) return false
  return true
}

// Does the card itself pass the search/colour/type filters?
export function itemMatches(item, f) {
  const card = item.card ?? {}
  const q = f.search.trim().toLowerCase()
  if (q && !`${item.name}\n${card.typeLine ?? ''}\n${card.oracleText ?? ''}`.toLowerCase().includes(q)) return false
  if (f.type && !(card.typeLine ?? '').includes(f.type)) return false
  if (f.colors.length) {
    const identity = card.colors ?? []
    const wantsColourless = f.colors.includes('C')
    const picked = f.colors.filter((c) => c !== 'C')
    const ok = (wantsColourless && identity.length === 0) || picked.some((c) => identity.includes(c))
    if (!ok) return false
  }
  return true
}

const colourKey = (card) => {
  const c = card?.colors ?? []
  return c.length ? `${c.length}${c.map((x) => 'WUBRG'.indexOf(x)).join('')}` : '9'
}
const typeKey = (card) => {
  const i = TYPES.findIndex((t) => (card?.typeLine ?? '').includes(t))
  return i === -1 ? 99 : i
}

// Sort the visible cards. `shownCopies(item)` gives the copies left after filtering.
export function sortItems(items, sort, shownCopies) {
  const maxPrice = (item) => Math.max(0, ...shownCopies(item).map((c) => price(c.entry.card)))
  const count = (item) => shownCopies(item).reduce((n, c) => n + c.entry.qty, 0)
  const byName = (a, b) => a.name.localeCompare(b.name)
  const compare = {
    name: byName,
    'name-desc': (a, b) => b.name.localeCompare(a.name),
    'price-desc': (a, b) => maxPrice(b) - maxPrice(a) || byName(a, b),
    'price-asc': (a, b) => maxPrice(a) - maxPrice(b) || byName(a, b),
    qty: (a, b) => count(b) - count(a) || byName(a, b),
    set: (a, b) => (a.card?.setName ?? '').localeCompare(b.card?.setName ?? '') || byName(a, b),
    colour: (a, b) => colourKey(a.card).localeCompare(colourKey(b.card)) || byName(a, b),
    type: (a, b) => typeKey(a.card) - typeKey(b.card) || byName(a, b),
    cmc: (a, b) => manaValue(a.card) - manaValue(b.card) || byName(a, b),
  }[sort] ?? byName
  return [...items].sort(compare)
}

// How many of the "more filters" are switched on (for the button badge).
export const activeCount = (f) =>
  (f.colors.length ? 1 : 0) + (f.type ? 1 : 0) + (f.set ? 1 : 0) + (f.rarity ? 1 : 0) + (f.minPrice !== '' || f.maxPrice !== '' ? 1 : 0)
