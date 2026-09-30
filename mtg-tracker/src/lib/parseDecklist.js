// Turns a pasted decklist into [{ name, qty }].
// Handles the common export formats from Moxfield, Archidekt, EDHREC and MTGA:
//   1 Sol Ring
//   1x Sol Ring
//   1 Sol Ring (C21) 263
//   Sol Ring            (no number = 1 copy)
// Section headers like "Commander" or "Sideboard" and // comments are skipped.

const HEADERS = /^(commander|deck|mainboard|main|sideboard|maybeboard|companion|about|name .*)$/i

export function parseDecklist(text) {
  const counts = new Map()

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//') || line.startsWith('#') || HEADERS.test(line)) continue

    const match = line.match(/^(\d+)\s*x?\s+(.+)$/i)
    const qty = match ? Number(match[1]) : 1
    const name = (match ? match[2] : line)
      .replace(/\s*\*[A-Z]+\*\s*$/i, '')   // Moxfield foil markers like *F*
      .replace(/\s*\([A-Z0-9]+\)\s*[\w-]*$/i, '') // set code + collector number
      .trim()

    if (name) counts.set(name, (counts.get(name) ?? 0) + qty)
  }

  return [...counts].map(([name, qty]) => ({ name, qty }))
}
