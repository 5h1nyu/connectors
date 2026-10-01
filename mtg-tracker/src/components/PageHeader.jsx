// The same header on every page: big title, a short line under it, and the main buttons on the right.
export default function PageHeader({ title, subtitle, actions, back, children }) {
  return (
    <header className="page-header">
      {back && <button className="link back" onClick={back.onClick}>← {back.label}</button>}
      <div className="page-header-row">
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
