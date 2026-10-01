import { THEMES } from '../lib/theme'

// Pick a colour theme. Saved on this device.
export default function ThemePicker({ theme, onChange }) {
  return (
    <section className="panel">
      <h2>Look</h2>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button key={t.id} className={`theme-option ${theme === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
            <span className="theme-swatch" style={{ background: t.swatch[0] }}>
              <span style={{ background: t.swatch[1] }} />
              <span style={{ background: t.swatch[2] }} />
            </span>
            <strong>{t.name}</strong>
            <small>{t.note}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
