import { MANA_THEMES, THEMES } from '../lib/theme'

// Pick a colour theme: one of the three vibes, or your favourite Magic colours. Saved on this device.
export default function ThemePicker({ theme, onChange }) {
  return (
    <section className="panel">
      <h2>Look</h2>
      <h3>Vibes</h3>
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
      <h3>Mana colours</h3>
      <div className="theme-grid mana">
        {MANA_THEMES.map((t) => (
          <button key={t.id} className={`theme-option ${theme === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
            <span className="mana-swatch">
              {t.colors.map((c) => <span key={c} className={`pip big pip-${c}`} />)}
            </span>
            <strong>{t.name}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}
