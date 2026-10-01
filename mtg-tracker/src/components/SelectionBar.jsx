// The ribbon that appears when you tick cards: shows how many, plus what you can do with them.
export default function SelectionBar({ count, onClear, children }) {
  if (!count) return null
  return (
    <div className="selection-bar" role="toolbar" aria-label="Selected cards">
      <strong>{count} selected</strong>
      <div className="row selection-actions">{children}</div>
      <button className="link" onClick={onClear}>Clear</button>
    </div>
  )
}

// A "Move to…" dropdown: pick a place and the move happens straight away.
export function MoveToSelect({ decks, includeLoose = true, onMove }) {
  return (
    <select
      className="move-select"
      value=""
      onChange={(e) => {
        const [type, deckId] = e.target.value.split(':')
        onMove(type === 'loose' ? { type: 'loose' } : { type: 'deck', deckId, status: 'active' })
      }}
    >
      <option value="" disabled>Move to…</option>
      {includeLoose && <option value="loose">Loose cards</option>}
      {decks.filter((d) => !d.brew).map((d) => <option key={d.id} value={`deck:${d.id}`}>{d.name}</option>)}
    </select>
  )
}
