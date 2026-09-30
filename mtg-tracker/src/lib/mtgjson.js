// MTGJSON (https://mtgjson.com) publishes every precon decklist as free JSON files.

const API = 'https://mtgjson.com/api/v5'
let preconList = null

// All Commander precons, newest first: [{ name, code, fileName, releaseDate }]
export async function fetchPreconList() {
  if (!preconList) {
    const res = await fetch(`${API}/DeckList.json`)
    if (!res.ok) throw new Error(`MTGJSON returned ${res.status}`)
    const { data } = await res.json()
    preconList = data
      .filter((d) => d.type === 'Commander Deck')
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  }
  return preconList
}

// One precon's cards as [{ name, qty }] (commander included).
export async function fetchPrecon(fileName) {
  const res = await fetch(`${API}/decks/${fileName}.json`)
  if (!res.ok) throw new Error(`MTGJSON returned ${res.status}`)
  const { data } = await res.json()
  const counts = new Map()
  for (const c of [...(data.commander ?? []), ...(data.mainBoard ?? [])]) {
    counts.set(c.name, (counts.get(c.name) ?? 0) + (c.count ?? 1))
  }
  return [...counts].map(([name, qty]) => ({ name, qty }))
}
