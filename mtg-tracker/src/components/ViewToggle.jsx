// Switch between the picture view and the list view.
export default function ViewToggle({ mode, onChange }) {
  return (
    <span className="view-toggle" role="group" aria-label="View">
      <button className={mode === 'visual' ? 'active' : ''} onClick={() => onChange('visual')} title="Pictures">▦</button>
      <button className={mode === 'list' ? 'active' : ''} onClick={() => onChange('list')} title="List">☰</button>
    </span>
  )
}
