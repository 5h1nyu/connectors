// "Are you sure?" before removing cards, showing exactly which ones you picked.
// copies: [{ entry, label }]  (label = where the copy is, e.g. "Loose cards" or a deck name)
export default function ConfirmRemoveDialog({ copies, onConfirm, onCancel }) {
  const total = copies.reduce((n, c) => n + c.entry.qty, 0)
  const value = copies.reduce((n, c) => n + c.entry.qty * Number(c.entry.card?.priceUsd ?? 0), 0)
  const wantedOnly = copies.every((c) => c.entry.status === 'wanted')

  return (
    <div className="dialog-backdrop top" onClick={onCancel}>
      <div className="dialog wide confirm-remove" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Remove {total} card{total === 1 ? '' : 's'}?</h2>
        <p className="muted">
          {wantedOnly
            ? "They'll come off this deck's list. You don't own them, so your collection doesn't change."
            : `They'll be taken out of your collection${value ? ` (about $${value.toFixed(2)} of cards)` : ''}. You can undo straight after.`}
        </p>
        <ul className="confirm-list">
          {copies.map((c, i) => (
            <li key={i}>
              {c.entry.card?.imageSmall ? <img src={c.entry.card.imageSmall} alt="" /> : <span className="no-image mini" />}
              <span className="confirm-name">
                <strong>{c.entry.qty}× {c.entry.name}</strong>
                <small className="muted">
                  {c.label}
                  {c.entry.card?.set && ` · ${c.entry.card.set.toUpperCase()} #${c.entry.card.number}`}
                  {c.entry.status === 'wanted' && ' · to buy'}
                </small>
              </span>
            </li>
          ))}
        </ul>
        <div className="row end">
          <button className="secondary" onClick={onCancel} autoFocus>Keep them</button>
          <button className="danger-fill" onClick={onConfirm}>Yes, remove {total}</button>
        </div>
      </div>
    </div>
  )
}
