// Deleting a deck: was it a mistake (cards never existed) or did you take it apart (keep the cards)?
export default function DeleteDeckDialog({ deck, onConfirm, onCancel }) {
  const count = deck.cards.reduce((n, e) => n + e.qty, 0)
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Delete {deck.name}?</h2>
        <button className="choice danger-choice" onClick={() => onConfirm(false)}>
          <strong>Delete the deck and its {count} cards</strong>
          <small>Added it by mistake, or I don't own these cards anymore.</small>
        </button>
        <button className="choice" onClick={() => onConfirm(true)}>
          <strong>I took it apart, keep the cards</strong>
          <small>All {count} cards move to your loose cards.</small>
        </button>
        <div className="row end">
          <button className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
