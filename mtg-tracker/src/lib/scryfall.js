// Talks to the Scryfall API (https://scryfall.com/docs/api).
// Free, no API key. Their rules: max ~10 requests/second, so we pause between batches.

const API = 'https://api.scryfall.com'
const BATCH_SIZE = 75 // /cards/collection accepts at most 75 cards per request

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Keep only the fields we use, so localStorage stays small.
function simplify(card) {
  const face = card.card_faces?.[0] ?? {}
  const images = card.image_uris ?? face.image_uris ?? {}
  return {
    id: card.id,
    name: card.name,
    manaCost: card.mana_cost ?? face.mana_cost ?? '',
    typeLine: card.type_line ?? face.type_line ?? '',
    oracleText:
      card.oracle_text ??
      card.card_faces?.map((f) => `${f.name}\n${f.oracle_text}`).join('\n\n') ??
      '',
    image: images.normal ?? null,
    priceUsd: card.prices?.usd ?? null,
    scryfallUrl: card.scryfall_uri,
    buyUrl: card.purchase_uris?.tcgplayer ?? null,
  }
}

// names: ['Sol Ring', 'Arcane Signet', ...]
// returns { found: { 'sol ring': card, ... }, notFound: ['Typo Nmae'] }
export async function fetchCards(names) {
  const found = {}
  const notFound = []

  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE)
    const res = await fetch(`${API}/cards/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
    })
    if (!res.ok) throw new Error(`Scryfall returned ${res.status}`)

    const json = await res.json()
    for (const card of json.data) {
      const simple = simplify(card)
      found[simple.name.toLowerCase()] = simple
      // Double-faced / split cards: also match on the front face name ("Delver of Secrets")
      const front = simple.name.split(' // ')[0].toLowerCase()
      found[front] ??= simple
    }
    notFound.push(...json.not_found.map((id) => id.name))

    if (i + BATCH_SIZE < names.length) await sleep(100)
  }

  return { found, notFound }
}

// [{ name, qty }] -> { cards: [{ name, qty, card }], notFound }
// Names are corrected to Scryfall's spelling ("sol ring" -> "Sol Ring") so the same card always matches.
export async function lookupEntries(entries) {
  const { found, notFound } = await fetchCards(entries.map((e) => e.name))
  const cards = entries.map((e) => {
    const card = found[e.name.toLowerCase()] ?? null
    return { name: card?.name ?? e.name, qty: e.qty, card }
  })
  return { cards, notFound }
}

// Card name suggestions while typing, e.g. "sol r" -> ["Sol Ring", "Sol Rider", ...]
export async function autocomplete(query) {
  if (query.length < 2) return []
  const res = await fetch(`${API}/cards/autocomplete?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return (await res.json()).data
}
