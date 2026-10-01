// Talks to the Scryfall API (https://scryfall.com/docs/api).
// Free, no API key. Their rules: max ~10 requests/second, so we pause between requests.

const API = 'https://api.scryfall.com'
const BATCH_SIZE = 75 // /cards/collection accepts at most 75 cards per request

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Keep only the fields we use, so saved data stays small.
// `name` is always the official Oracle name (what other apps and Tabletop Simulator expect),
// even for special printings sold under another name; that one goes in `flavorName`.
export function simplify(card) {
  const faces = card.card_faces ?? []
  const face = faces[0] ?? {}
  const images = card.image_uris ?? face.image_uris ?? {}
  return {
    id: card.id,
    name: card.name,
    flavorName: card.flavor_name ?? face.flavor_name ?? null,
    manaCost: card.mana_cost ?? face.mana_cost ?? '',
    typeLine: card.type_line ?? face.type_line ?? '',
    oracleText: card.oracle_text ?? faces.map((f) => `${f.name}\n${f.oracle_text}`).join('\n\n') ?? '',
    image: images.normal ?? null,
    imageSmall: images.small ?? images.normal ?? null,
    artCrop: images.art_crop ?? null, // just the artwork, for deck tiles
    backImage: faces[1]?.image_uris?.normal ?? null, // double-faced cards
    colors: card.color_identity ?? [],
    set: card.set,
    setName: card.set_name,
    number: card.collector_number,
    rarity: card.rarity,
    released: card.released_at,
    priceUsd: card.prices?.usd ?? card.prices?.usd_foil ?? null,
    priceEur: card.prices?.eur ?? card.prices?.eur_foil ?? null,
    commanderLegal: card.legalities?.commander ?? null,
    scryfallUrl: card.scryfall_uri,
    buyUrl: card.purchase_uris?.tcgplayer ?? null,
    cardmarketUrl: card.purchase_uris?.cardmarket ?? null,
  }
}

// How we ask Scryfall for a card: exact printing id, set + collector number, or just the name.
function identifierFor(entry) {
  if (entry.id) return { id: entry.id }
  if (entry.set && entry.number) return { set: entry.set.toLowerCase(), collector_number: String(entry.number) }
  return { name: entry.name }
}

function identKey(ident) {
  if (ident.id) return `id:${ident.id}`
  if (ident.set) return `sn:${ident.set}|${ident.collector_number}`.toLowerCase()
  return `n:${ident.name.toLowerCase()}`
}

// Every way a card might have been asked for, so we can match answers back to questions.
function cardKeys(card) {
  return [
    `id:${card.id}`,
    `sn:${card.set}|${card.number}`.toLowerCase(),
    `n:${card.name.toLowerCase()}`,
    `n:${card.name.split(' // ')[0].toLowerCase()}`, // "Delver of Secrets" for a double-faced card
    ...(card.flavorName ? [`n:${card.flavorName.toLowerCase()}`] : []),
  ]
}

// identifiers -> { found: { key: card }, notFound: [identifier] }
async function fetchIdentifiers(identifiers) {
  const found = {}
  const notFound = []
  for (let i = 0; i < identifiers.length; i += BATCH_SIZE) {
    const res = await fetch(`${API}/cards/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ identifiers: identifiers.slice(i, i + BATCH_SIZE) }),
    })
    if (!res.ok) throw new Error(`Scryfall returned ${res.status}`)
    const json = await res.json()
    for (const raw of json.data) {
      const card = simplify(raw)
      for (const k of cardKeys(card)) found[k] ??= card
    }
    notFound.push(...json.not_found)
    if (i + BATCH_SIZE < identifiers.length) await sleep(100)
  }
  return { found, notFound }
}

// [{ name, qty, set?, number?, id?, commander? }] -> { cards: [{ name, qty, card, commander }], notFound: [name] }
// If an exact printing can't be found, we fall back to the card's default printing.
export async function lookupEntries(entries) {
  const idents = entries.map(identifierFor)
  const { found } = await fetchIdentifiers(idents)

  const retry = entries.filter((e, i) => !found[identKey(idents[i])] && idents[i].name === undefined)
  if (retry.length) {
    await sleep(100)
    const second = await fetchIdentifiers(retry.map((e) => ({ name: e.name })))
    Object.assign(found, second.found)
  }

  const notFound = []
  const cards = entries.map((e, i) => {
    const card = found[identKey(idents[i])] ?? found[`n:${e.name.toLowerCase()}`] ?? null
    if (!card) notFound.push(e.name)
    return { name: card?.name ?? e.name, qty: e.qty, card, commander: !!e.commander }
  })
  return { cards, notFound }
}

// Fresh data for printings you already own: { [id]: card }
export async function fetchByIds(ids) {
  const { found } = await fetchIdentifiers(ids.map((id) => ({ id })))
  return Object.fromEntries(ids.filter((id) => found[`id:${id}`]).map((id) => [id, found[`id:${id}`]]))
}

// Every printing of a card, newest first.
export async function fetchPrintings(name) {
  const exact = `!"${name.split(' // ')[0]}"`
  let url = `${API}/cards/search?q=${encodeURIComponent(exact)}&unique=prints&order=released&dir=desc&include_extras=true`
  const printings = []
  while (url && printings.length < 400) {
    const res = await fetch(url)
    if (!res.ok) break
    const json = await res.json()
    printings.push(...json.data.map(simplify))
    url = json.has_more ? json.next_page : null
    if (url) await sleep(100)
  }
  return printings
}

// Card name suggestions while typing, e.g. "sol r" -> ["Sol Ring", "Sol Rider", ...]
export async function autocomplete(query) {
  if (query.length < 2) return []
  const res = await fetch(`${API}/cards/autocomplete?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return (await res.json()).data
}
