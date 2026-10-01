import Portal from './Portal'
// Deleting a deck: was it a mistake (cards never existed) or did you take it apart (keep the cards)?
export default function DeleteDeckDialog({ deck, onConfirm, onCancel }) {
  const owned = deck.cards.filter((e) => e.status !== 'wanted').reduce((n, e) => n + e.qty, 0)
  return (
    <Portal>
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Delete {deck.name}?</h2>
        {owned === 0 ? (
          <button className="choice danger-choice" onClick={() => onConfirm(false)}>
            <strong>Delete this {deck.brew ? 'brew' : 'deck'}</strong>
            <small>None of its cards are in your collection, so nothing else changes.</small>
          </button>
        ) : (
          <>
            <button className="choice danger-choice" onClick={() => onConfirm(false)}>
              <strong>Delete the deck and its {owned} cards</strong>
              <small>Added it by mistake, or I don't own these cards anymore.</small>
            </button>
            <button className="choice" onClick={() => onConfirm(true)}>
              <strong>I took it apart, keep the cards</strong>
              <small>All {owned} cards move to your loose cards.</small>
            </button>
          </>
        )}
        <div className="row end">
          <button className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
