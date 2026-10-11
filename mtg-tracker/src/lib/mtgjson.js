// MTGJSON (https://mtgjson.com) publishes every precon decklist as free JSON files.

const API = 'https://mtgjson.com/api/v5'
let preconList = null

// Every deck MTGJSON knows (Commander precons, Secret Lair decks, starter decks…), Commander first,
// then newest first: [{ name, code, fileName, releaseDate, type }]
export async function fetchPreconList() {
  if (!preconList) {
    const res = await fetch(`${API}/DeckList.json`)
    if (!res.ok) throw new Error(`MTGJSON returned ${res.status}`)
    const { data } = await res.json()
    const commanderish = (d) => /commander|secret lair/i.test(`${d.type} ${d.name}`)
    preconList = data.sort(
      (a, b) => commanderish(b) - commanderish(a) || (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''),
    )
  }
  return preconList
}

// One precon's cards as [{ name, qty, id, commander }], keeping the exact printings from the box.
export async function fetchPrecon(fileName) {
  const res = await fetch(`${API}/decks/${fileName}.json`)
  if (!res.ok) throw new Error(`MTGJSON returned ${res.status}`)
  const { data } = await res.json()
  const toEntry = (commander) => (c) => ({
    name: c.name,
    qty: c.count ?? 1,
    id: c.identifiers?.scryfallId,
    set: c.setCode,
    number: c.number,
    commander,
  })
  return [...(data.commander ?? []).map(toEntry(true)), ...(data.mainBoard ?? []).map(toEntry(false))]
}
