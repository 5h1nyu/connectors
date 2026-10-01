import { VISIBILITY } from '../lib/social'

// Private / Friends / Public, as a row of three buttons.
export default function VisibilityPicker({ value = 'private', onChange, disabled, compact }) {
  return (
    <span className={`visibility ${compact ? 'compact' : ''}`} role="radiogroup" aria-label="Who can see this">
      {Object.entries(VISIBILITY).map(([id, v]) => (
        <button
          key={id}
          role="radio"
          aria-checked={value === id}
          className={value === id ? 'active' : ''}
          disabled={disabled}
          title={`${v.label}: ${v.hint}`}
          onClick={() => onChange(id)}
        >
          <span aria-hidden="true">{v.icon}</span> {(!compact || value === id) && v.label}
        </button>
      ))}
    </span>
  )
}
