// Shinyu's Vault connector for Claude (an MCP server), running as a Supabase Edge Function.
// It lets Claude read and edit YOUR vault: list decks, look up cards you own, add/remove cards,
// create brews, export lists. Each person gets a private link (made on their Profile page);
// the secret part of the link identifies whose vault to use.
//
// Deploy: Supabase → Edge Functions → Deploy a new function → Via Editor → name it "vault-mcp" →
// replace the code with this file → Deploy. Then turn OFF "Verify JWT" for this function.
// See the README ("Connect Claude") for the full steps.

const env = (k: string) => (globalThis as any).Deno?.env.get(k) ?? (globalThis as any).process?.env[k]
const SUPABASE_URL = env('SUPABASE_URL')

// The server-side key Supabase gives every function. Newer projects provide SUPABASE_SECRET_KEYS (a JSON list);
// older ones SUPABASE_SERVICE_ROLE_KEY. Use whichever exists.
function serverKey() {
  try {
    const keys = JSON.parse(env('SUPABASE_SECRET_KEYS') ?? '{}')
    const first = keys.default ?? Object.values(keys)[0]
    if (first) return String(first)
  } catch {
    // not set or not JSON: fall through
  }
  return env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SECRET_KEY') || ''
}
const SERVICE_KEY = serverKey()

// ---------- Database (Supabase REST, using the server-side key) ----------
async function db(path: string, init: any = {}) {
  const headers: any = { apikey: SERVICE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) }
  if (!String(SERVICE_KEY).startsWith('sb_')) headers.Authorization = `Bearer ${SERVICE_KEY}`
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers })
  const text = await res.text()
  if (!res.ok) throw new Error(`Database error ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function userForKey(key: string) {
  if (!key || key.length < 32) return null
  const rows = await db(`claude_keys?key_hash=eq.${await sha256(key)}&select=user_id`)
  return rows[0]?.user_id ?? null
}

async function loadVault(userId: string) {
  const rows = await db(`collections?user_id=eq.${userId}&select=data`)
  return rows[0]?.data ?? { decks: [], loose: [] }
}

async function saveVault(userId: string, data: any) {
  await db('collections', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, data, updated_at: new Date().toISOString() }),
  })
}

// ---------- Cards (Scryfall), same shape the website saves ----------
function simplify(card: any) {
  const faces = card.card_faces ?? []
  const face = faces[0] ?? {}
  const images = card.image_uris ?? face.image_uris ?? {}
  return {
    id: card.id, name: card.name, flavorName: card.flavor_name ?? face.flavor_name ?? null,
    manaCost: card.mana_cost ?? face.mana_cost ?? '', typeLine: card.type_line ?? face.type_line ?? '',
    oracleText: card.oracle_text ?? faces.map((f: any) => `${f.name}\n${f.oracle_text}`).join('\n\n') ?? '',
    image: images.normal ?? null, imageSmall: images.small ?? images.normal ?? null, artCrop: images.art_crop ?? null,
    backImage: faces[1]?.image_uris?.normal ?? null, colors: card.color_identity ?? [],
    set: card.set, setName: card.set_name, number: card.collector_number, rarity: card.rarity, released: card.released_at,
    priceUsd: card.prices?.usd ?? card.prices?.usd_foil ?? null, priceEur: card.prices?.eur ?? card.prices?.eur_foil ?? null,
    commanderLegal: card.legalities?.commander ?? null, scryfallUrl: card.scryfall_uri,
    buyUrl: card.purchase_uris?.tcgplayer ?? null, cardmarketUrl: card.purchase_uris?.cardmarket ?? null,
  }
}

// "1 Sol Ring", "2x Island", "1 Sol Ring (C21) 263", "Sol Ring" → [{ name, qty, set, number }]
function parseList(text: string) {
  const out: any[] = []
  for (const raw of String(text ?? '').split(/\n|;/)) {
    const line = raw.trim()
    if (!line || /^(commanders?|deck|mainboard|sideboard|maybeboard):?$/i.test(line) || line.startsWith('//')) continue
    const m = line.match(/^(\d+)\s*x?\s+(.+)$/i)
    const rest = (m ? m[2] : line).replace(/\s*\*[A-Z]+\*\s*$/i, '')
    const p = rest.match(/^(.*?)\s*\(([A-Za-z0-9]+)\)\s*(\S+)?\s*$/)
    out.push({ name: (p ? p[1] : rest).trim(), qty: m ? Number(m[1]) : 1, set: p?.[2]?.toLowerCase(), number: p?.[3] })
  }
  return out.filter((e) => e.name)
}

async function lookup(entries: any[]) {
  const found: any[] = []
  const missing: string[] = []
  for (let i = 0; i < entries.length; i += 75) {
    const batch = entries.slice(i, i + 75)
    const res = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'ShinyusVault/1.0' },
      body: JSON.stringify({ identifiers: batch.map((e) => (e.set && e.number ? { set: e.set, collector_number: e.number } : { name: e.name })) }),
    })
    if (!res.ok) throw new Error(`Scryfall returned ${res.status}`)
    const json = await res.json()
    const cards = json.data.map(simplify)
    for (const e of batch) {
      const lower = e.name.toLowerCase()
      const card =
        cards.find((c: any) => e.set && c.set === e.set && String(c.number) === String(e.number)) ??
        cards.find((c: any) => c.name.toLowerCase() === lower || c.name.split(' // ')[0].toLowerCase() === lower)
      if (card) found.push({ name: card.name, qty: e.qty, card })
      else missing.push(e.name)
    }
    if (i + 75 < entries.length) await new Promise((r) => setTimeout(r, 120))
  }
  return { found, missing }
}

// ---------- Vault helpers (same rules as the website) ----------
const key = (n: string) => n.toLowerCase()
const same = (e: any, name: string, id: any, status: string) => key(e.name) === key(name) && (e.card?.id ?? null) === id && e.status === status

function addEntry(list: any[], c: any, status = 'active') {
  const i = list.findIndex((e) => same(e, c.name, c.card?.id ?? null, status))
  if (i === -1) return [...list, { name: c.name, card: c.card, qty: c.qty, status }]
  return list.map((e, j) => (j === i ? { ...e, qty: e.qty + c.qty } : e))
}

function takeFrom(list: any[], name: string, qty: number, statuses: string[]) {
  // Remove up to qty copies of a card (any printing) from a list, in status order. Returns [list, taken].
  let left = qty
  const taken: any[] = []
  for (const status of statuses) {
    list = list.flatMap((e) => {
      if (!left || key(e.name) !== key(name) || e.status !== status) return [e]
      const n = Math.min(left, e.qty)
      left -= n
      taken.push({ ...e, qty: n })
      return e.qty > n ? [{ ...e, qty: e.qty - n }] : []
    })
  }
  return [list, taken]
}

function findDeck(vault: any, ref: string) {
  if (!ref) throw new Error('Say which deck (by name).')
  const r = key(String(ref).trim())
  const exact = vault.decks.filter((d: any) => d.id === ref || key(d.name) === r)
  const loose = exact.length ? exact : vault.decks.filter((d: any) => key(d.name).includes(r))
  if (loose.length === 1) return loose[0]
  if (!loose.length) throw new Error(`No deck called "${ref}". Decks: ${vault.decks.map((d: any) => d.name).join(', ') || 'none yet'}.`)
  throw new Error(`"${ref}" matches several decks: ${loose.map((d: any) => d.name).join(', ')}. Be more specific.`)
}

function whereOwned(vault: any, name: string) {
  const places: string[] = []
  for (const d of vault.decks) {
    for (const e of d.cards) {
      if (key(e.name) !== key(name) || e.status === 'wanted') continue
      places.push(`${e.qty}× in ${d.name}${e.status === 'out' ? ' (swapped out, spare)' : ''}`)
    }
  }
  for (const e of vault.loose) if (key(e.name) === key(name)) places.push(`${e.qty}× loose`)
  return places
}

const TYPES = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Battle', 'Land']
const typeOf = (e: any) => TYPES.find((t) => (e.card?.typeLine ?? '').includes(t)) ?? 'Other'
const price = (e: any) => e.qty * Number(e.card?.priceUsd ?? 0)
const isCommanderCard = (c: any) => (/Legendary/.test(c?.typeLine ?? '') && /Creature/.test(c?.typeLine ?? '')) || /can be your commander/i.test(c?.oracleText ?? '')

// ---------- The tools Claude can use ----------
const TOOLS: any = {
  list_decks: {
    description: "List the user's decks with card counts, commander, value, and whether each is a brew (planned) or built.",
    inputSchema: { type: 'object', properties: {} },
    readOnly: true,
    run: (vault: any) => {
      if (!vault.decks.length) return 'No decks yet.'
      const lines = vault.decks.map((d: any) => {
        const cards = d.cards.filter((e: any) => e.status !== 'out')
        const count = cards.reduce((n: number, e: any) => n + e.qty, 0)
        const toBuy = d.cards.filter((e: any) => e.status === 'wanted').reduce((n: number, e: any) => n + e.qty, 0)
        const value = cards.reduce((n: number, e: any) => n + price(e), 0)
        return `- ${d.name}: ${count} cards${d.commander ? `, commander ${d.commander}` : ''}${d.brew ? ', BREW (planned, not built yet)' : ''}${toBuy ? `, ${toBuy} still to buy` : ''}, ~$${value.toFixed(0)}, sharing: ${d.visibility ?? 'private'}`
      })
      const looseCount = vault.loose.reduce((n: number, e: any) => n + e.qty, 0)
      return `${lines.join('\n')}\nLoose cards (not in any deck): ${looseCount}`
    },
  },
  get_deck: {
    description: 'Show every card in one deck, grouped by type, with quantity, status (in deck / swapped out / to buy) and printing.',
    inputSchema: { type: 'object', properties: { deck: { type: 'string', description: 'Deck name' } }, required: ['deck'] },
    readOnly: true,
    run: (vault: any, { deck }: any) => {
      const d = findDeck(vault, deck)
      const groups: any = {}
      for (const e of d.cards) (groups[e.status === 'out' ? 'Swapped out (spares kept with the deck)' : typeOf(e)] ??= []).push(e)
      const head = `${d.name}${d.commander ? ` — commander: ${d.commander}` : ''}${d.brew ? ' (BREW: cards marked "to buy" are not owned yet)' : ''}`
      const body = Object.entries(groups).map(([t, list]: any) =>
        `\n${t}:\n${list.map((e: any) => `  ${e.qty} ${e.name}${e.card?.set ? ` (${e.card.set.toUpperCase()} ${e.card.number})` : ''}${e.status === 'wanted' ? ' [to buy]' : ''}`).join('\n')}`)
      return head + body.join('\n')
    },
  },
  find_cards: {
    description: 'Check whether the user owns cards and where (which decks, loose, spares). Pass card names, or a word to search their whole collection.',
    inputSchema: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' }, description: 'Exact card names to check' },
        search: { type: 'string', description: 'Part of a card name or type to search for, e.g. "dragon" or "ramp"' },
      },
    },
    readOnly: true,
    run: (vault: any, { names = [], search }: any) => {
      const out: string[] = []
      for (const n of names) {
        const places = whereOwned(vault, n)
        out.push(`${n}: ${places.length ? places.join('; ') : 'not owned'}`)
      }
      if (search) {
        const s = key(search)
        const all = new Map()
        for (const e of [...vault.decks.flatMap((d: any) => d.cards), ...vault.loose]) {
          if (e.status === 'wanted') continue
          if (key(e.name).includes(s) || key(e.card?.typeLine ?? '').includes(s) || key(e.card?.oracleText ?? '').includes(s)) all.set(e.name, e)
        }
        out.push(`Owned cards matching "${search}" (${all.size}):`)
        for (const name of [...all.keys()].slice(0, 150)) out.push(`- ${name}: ${whereOwned(vault, name).join('; ')}`)
      }
      return out.join('\n') || 'Give some names or a search word.'
    },
  },
  add_cards: {
    description: 'Add cards to a deck, or to "loose" (cards owned but not in a deck). Cards are a decklist, one per line, e.g. "1 Sol Ring" or "1 Sol Ring (C21) 263" for an exact printing. In brew decks cards are added as "to buy". Owned cards are taken from the loose pile first when available.',
    inputSchema: {
      type: 'object',
      properties: {
        deck: { type: 'string', description: 'Deck name, or "loose"' },
        cards: { type: 'string', description: 'Decklist lines' },
        to_buy: { type: 'boolean', description: 'True if the user does not own these yet (adds them as "to buy")' },
      },
      required: ['deck', 'cards'],
    },
    run: async (vault: any, { deck, cards, to_buy }: any) => {
      const { found, missing } = await lookup(parseList(cards))
      if (key(String(deck)) === 'loose') {
        for (const c of found) vault.loose = addEntry(vault.loose, c)
      } else {
        const d = findDeck(vault, deck)
        const wanted = d.brew || to_buy
        for (const c of found) {
          if (wanted) { d.cards = addEntry(d.cards, c, 'wanted'); continue }
          const [loose, taken] = takeFrom(vault.loose, c.name, c.qty, ['active'])
          vault.loose = loose
          for (const t of taken) d.cards = addEntry(d.cards, t)
          const rest = c.qty - taken.reduce((n: number, t: any) => n + t.qty, 0)
          if (rest) d.cards = addEntry(d.cards, { ...c, qty: rest })
        }
      }
      return { changed: true, text: `Added ${found.reduce((n, c) => n + c.qty, 0)} card(s) to ${deck}.${missing.length ? ` Not found on Scryfall: ${missing.join(', ')}.` : ''}` }
    },
  },
  remove_cards: {
    description: 'Take cards out of a deck (or out of "loose"). Choose where they go: "gone" (sold/traded/added by mistake), "loose", or "swapped_out" (kept with the deck as a spare).',
    inputSchema: {
      type: 'object',
      properties: {
        deck: { type: 'string', description: 'Deck name, or "loose"' },
        cards: { type: 'string', description: 'Decklist lines, e.g. "1 Sol Ring"' },
        to: { type: 'string', enum: ['gone', 'loose', 'swapped_out'], description: 'Where the cards go. Default "loose".' },
      },
      required: ['deck', 'cards'],
    },
    run: (vault: any, { deck, cards, to = 'loose' }: any) => {
      const report: string[] = []
      for (const { name, qty } of parseList(cards)) {
        let taken: any[]
        if (key(String(deck)) === 'loose') {
          ;[vault.loose, taken] = takeFrom(vault.loose, name, qty, ['active'])
        } else {
          const d = findDeck(vault, deck)
          ;[d.cards, taken] = takeFrom(d.cards, name, qty, ['wanted', 'active', 'out'])
          for (const t of taken) {
            if (t.status === 'wanted') continue // never owned: just off the list
            if (to === 'swapped_out') d.cards = addEntry(d.cards, t, 'out')
            if (to === 'loose') vault.loose = addEntry(vault.loose, t)
          }
        }
        const n = taken.reduce((s, t) => s + t.qty, 0)
        report.push(n ? `${n}× ${name}` : `${name} (not found there)`)
      }
      return { changed: true, text: `Removed from ${deck} → ${to}: ${report.join(', ')}` }
    },
  },
  create_deck: {
    description: 'Create a new deck. By default it is a BREW: nothing is owned yet and cards are "to buy"; the user builds it in the app later, which pulls owned copies from loose cards and other decks. Set owned=true only for a deck the user already physically has.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        cards: { type: 'string', description: 'Optional decklist lines (commander included)' },
        commander: { type: 'string', description: 'Optional commander card name (must be a legendary creature or say it can be your commander)' },
        owned: { type: 'boolean', description: 'True if the user already owns this exact deck' },
      },
      required: ['name'],
    },
    run: async (vault: any, { name, cards = '', commander, owned }: any) => {
      const list = parseList(cards)
      if (commander && !list.some((e) => key(e.name) === key(commander))) list.unshift({ name: commander, qty: 1 })
      const { found, missing } = await lookup(list)
      const status = owned ? 'active' : 'wanted'
      const commanderCard = commander ? found.find((c) => key(c.name).startsWith(key(commander).split(' // ')[0])) : null
      if (commander && commanderCard && !isCommanderCard(commanderCard.card)) throw new Error(`${commanderCard.name} can't be a commander (it isn't a legendary creature).`)
      const deck = {
        id: crypto.randomUUID(), name, addedAt: Date.now(), brew: !owned, visibility: 'private',
        commander: commanderCard?.name ?? null,
        cover: commanderCard?.name ?? found[0]?.name ?? null,
        cards: found.reduce((l: any[], c: any) => addEntry(l, c, status), []),
      }
      vault.decks.push(deck)
      return { changed: true, text: `Created ${owned ? 'deck' : 'brew'} "${name}" with ${found.reduce((n, c) => n + c.qty, 0)} card(s).${missing.length ? ` Not found: ${missing.join(', ')}.` : ''}` }
    },
  },
  set_commander: {
    description: "Set a deck's commander (it must be in the deck and be a legendary creature or say it can be your commander).",
    inputSchema: { type: 'object', properties: { deck: { type: 'string' }, card: { type: 'string' } }, required: ['deck', 'card'] },
    run: (vault: any, { deck, card }: any) => {
      const d = findDeck(vault, deck)
      const e = d.cards.find((x: any) => key(x.name) === key(card) || key(x.name).startsWith(key(card)))
      if (!e) throw new Error(`${card} isn't in ${d.name}. Add it first.`)
      if (!isCommanderCard(e.card)) throw new Error(`${e.name} can't be a commander.`)
      d.commander = e.name
      d.cover = e.name
      return { changed: true, text: `${e.name} is now the commander of ${d.name}.` }
    },
  },
  export_deck: {
    description: 'Get a deck as a plain decklist (for Moxfield, Archidekt, Tabletop Simulator).',
    inputSchema: { type: 'object', properties: { deck: { type: 'string' }, with_printings: { type: 'boolean' } }, required: ['deck'] },
    readOnly: true,
    run: (vault: any, { deck, with_printings }: any) => {
      const d = findDeck(vault, deck)
      const line = (e: any) => `${e.qty} ${e.name}${with_printings && e.card?.set ? ` (${e.card.set.toUpperCase()}) ${e.card.number}` : ''}`
      const cards = d.cards.filter((e: any) => e.status !== 'out')
      const cmd = cards.filter((e: any) => d.commander && key(e.name) === key(d.commander))
      const rest = cards.filter((e: any) => !cmd.includes(e))
      return cmd.length ? ['Commander', ...cmd.map(line), '', 'Deck', ...rest.map(line)].join('\n') : rest.map(line).join('\n')
    },
  },
  check_list: {
    description: 'For any decklist (e.g. a brew idea), show which cards the user already owns and where, and what they would need to buy with estimated prices.',
    inputSchema: { type: 'object', properties: { cards: { type: 'string', description: 'Decklist lines' } }, required: ['cards'] },
    readOnly: true,
    run: async (vault: any, { cards }: any) => {
      const { found, missing } = await lookup(parseList(cards))
      const have: string[] = []
      const buy: string[] = []
      let cost = 0
      for (const c of found) {
        const places = whereOwned(vault, c.name)
        if (places.length) have.push(`- ${c.name}: ${places.join('; ')}`)
        else {
          buy.push(`- ${c.qty} ${c.name}${c.card.priceUsd ? ` ($${c.card.priceUsd})` : ''}`)
          cost += c.qty * Number(c.card.priceUsd ?? 0)
        }
      }
      return `Already owned (${have.length}):\n${have.join('\n') || '- none'}\n\nTo buy (${buy.length}, about $${cost.toFixed(2)}):\n${buy.join('\n') || '- nothing'}${missing.length ? `\n\nNot found: ${missing.join(', ')}` : ''}`
    },
  },
}

// ---------- MCP over HTTP (JSON-RPC) ----------
const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const INSTRUCTIONS =
  "This is the user's Magic: The Gathering collection tracker (Shinyu's Vault). Decks contain cards that are owned " +
  '("in deck"), spares kept with the deck ("swapped out"), or not owned yet ("to buy"). Loose cards are owned cards not ' +
  'in any deck. Before suggesting purchases, use find_cards or check_list to see what the user already owns. ' +
  'New decks from create_deck are brews unless the user says they already own the deck. Changes show up in the app within about 20 seconds.'

async function rpc(msg: any, userId: string) {
  const { method, params } = msg
  if (method === 'initialize') {
    const v = VERSIONS.includes(params?.protocolVersion) ? params.protocolVersion : VERSIONS[1]
    return { protocolVersion: v, capabilities: { tools: {} }, serverInfo: { name: 'shinyus-vault', version: '1.0.0' }, instructions: INSTRUCTIONS }
  }
  if (method === 'ping') return {}
  if (method === 'tools/list') {
    return {
      tools: Object.entries(TOOLS).map(([name, t]: any) => ({
        name, description: t.description, inputSchema: t.inputSchema,
        annotations: { readOnlyHint: !!t.readOnly, destructiveHint: name === 'remove_cards' },
      })),
    }
  }
  if (method === 'tools/call') {
    const tool = TOOLS[params?.name]
    if (!tool) throw { code: -32602, message: `Unknown tool ${params?.name}` }
    try {
      const vault = await loadVault(userId)
      vault.decks ??= []
      vault.loose ??= []
      const result = await tool.run(vault, params.arguments ?? {})
      if (result?.changed) await saveVault(userId, vault)
      return { content: [{ type: 'text', text: typeof result === 'string' ? result : result.text }] }
    } catch (err: any) {
      return { content: [{ type: 'text', text: err?.message ?? String(err) }], isError: true }
    }
  }
  throw { code: -32601, message: `Method not found: ${method}` }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, mcp-session-id, mcp-protocol-version, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}
const json = (body: any, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

export async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  // The secret key is the last part of the link: …/functions/v1/vault-mcp/<key>  (or ?key=<key>)
  const url = new URL(req.url)
  const secret = url.searchParams.get('key') || url.pathname.split('/').filter(Boolean).pop() || ''
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'Setup problem: this function has no Supabase server key. Redeploy it from the Supabase dashboard.' }, 500)
  let userId
  try {
    userId = await userForKey(secret)
  } catch (err: any) {
    // Say exactly what went wrong (e.g. claude-connector.sql not run yet) instead of blaming the link.
    return json({ error: `Setup problem: ${err?.message ?? err}. Did you run supabase/claude-connector.sql?` }, 500)
  }
  if (!userId) return json({ error: 'This connector link is not valid. Make a new one on your Profile page in Shinyu\'s Vault.' }, 401)
  if (req.method !== 'POST') return json({ error: 'Use POST (this is an MCP server for Claude).' }, 405)

  const body = await req.json().catch(() => null)
  if (!body) return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400)
  const handle = async (msg: any) => {
    if (msg.id === undefined || msg.id === null) return null // notifications need no answer
    try {
      return { jsonrpc: '2.0', id: msg.id, result: await rpc(msg, userId) }
    } catch (err: any) {
      return { jsonrpc: '2.0', id: msg.id, error: { code: err?.code ?? -32603, message: err?.message ?? String(err) } }
    }
  }
  const replies = Array.isArray(body) ? (await Promise.all(body.map(handle))).filter(Boolean) : await handle(body)
  if (!replies || (Array.isArray(replies) && !replies.length)) return new Response(null, { status: 202, headers: CORS })
  return json(replies)
}

;(globalThis as any).Deno?.serve(handler)
