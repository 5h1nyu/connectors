// Turns a pasted decklist into [{ name, qty, set, number, commander }].
// Handles the common export formats from Moxfield, Archidekt, EDHREC and MTGA:
//   1 Sol Ring
//   1x Sol Ring
//   1 Sol Ring (C21) 263        <- keeps that exact printing
//   Sol Ring                    (no number = 1 copy)
// Cards under a "Commander" heading are marked as the commander. // comments are skipped.

const HEADER = /^(commanders?|deck|mainboard|main|sideboard|maybeboard|companion|about|name .*):?$/i

export function parseDecklist(text) {
  const entries = new Map()
  let section = ''

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//') || line.startsWith('#')) continue
    if (HEADER.test(line)) {
      section = line.toLowerCase()
      continue
    }

    const match = line.match(/^(\d+)\s*x?\s+(.+)$/i)
    const qty = match ? Number(match[1]) : 1
    const rest = (match ? match[2] : line).replace(/\s*\*[A-Z]+\*\s*$/i, '') // Moxfield foil markers like *F*
    const printing = rest.match(/^(.*?)\s*\(([A-Za-z0-9]+)\)\s*(\S+)?\s*$/) // "Name (SET) 123"
    const name = (printing ? printing[1] : rest).trim()
    if (!name) continue

    const set = printing?.[2]?.toLowerCase()
    const number = printing?.[3]
    const id = `${name.toLowerCase()}|${set ?? ''}|${number ?? ''}`
    const existing = entries.get(id)
    if (existing) existing.qty += qty
    else entries.set(id, { name, qty, set, number, commander: section.startsWith('commander') })
  }

  return [...entries.values()]
}
