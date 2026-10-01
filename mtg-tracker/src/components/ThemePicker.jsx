import { BRAND_FONTS, MANA_THEMES } from '../lib/theme'

// Settings → Look: your own two colours, a Magic colour pair, and the font for the title.
export default function ThemePicker({ themeState, font, onFont }) {
  const { theme, setTheme, custom, setCustom } = themeState
  const setColour = (key) => (e) => {
    setCustom({ ...custom, [key]: e.target.value })
    setTheme('custom')
  }

  return (
    <section className="panel look">
      <h2>Look</h2>

      <h3>Your colours</h3>
      <div className={`custom-colours ${theme === 'custom' ? 'active' : ''}`}>
        <label className="colour-pick">
          <input type="color" value={custom.primary} onChange={setColour('primary')} />
          <span><strong>Primary</strong><small className="muted">Buttons, logo, highlights</small></span>
        </label>
        <button className="secondary small-btn swap" title="Swap the two colours" onClick={() => { setCustom({ primary: custom.accent, accent: custom.primary }); setTheme('custom') }}>⇄</button>
        <label className="colour-pick">
          <input type="color" value={custom.accent} onChange={setColour('accent')} />
          <span><strong>Accent</strong><small className="muted">The moving sigils, selections</small></span>
        </label>
        {theme !== 'custom' && <button className="small-btn" onClick={() => setTheme('custom')}>Use my colours</button>}
      </div>

      <h3>Magic colours</h3>
      <div className="theme-grid mana">
        {MANA_THEMES.map((t) => (
          <button key={t.id} className={`theme-option ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
            <span className="mana-swatch">
              {t.colors.map((c) => <span key={c} className={`pip big pip-${c}`} />)}
            </span>
            <strong>{t.name}</strong>
          </button>
        ))}
      </div>

      <h3>Title font</h3>
      <div className="font-grid">
        {Object.entries(BRAND_FONTS).map(([id, f]) => (
          <button key={id} className={`theme-option font-option ${font === id ? 'active' : ''}`} onClick={() => onFont(id)}>
            <span className="font-sample" style={{ fontFamily: f.family }}>SHINYU'S VAULT</span>
            <small className="muted">{f.name}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
