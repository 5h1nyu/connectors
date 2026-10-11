import { useState } from 'react'
import { RARITIES, SORTS, TYPES, activeCount } from '../lib/collectionFilters'
import ViewToggle from './ViewToggle'

// Search box, where/sort menus, and a fold-out panel with colour, type, set, rarity and price filters.
export default function CollectionFilters({ filters, setFilters, sort, setSort, view, setView, decks, sets, shownCount, totalCount }) {
  const [open, setOpen] = useState(false)
  const set = (patch) => setFilters({ ...filters, ...patch })
  const extra = activeCount(filters)
  const anything = extra || filters.search || filters.where !== 'all'
  const toggleColour = (c) => set({ colors: filters.colors.includes(c) ? filters.colors.filter((x) => x !== c) : [...filters.colors, c] })

  return (
    <div className="filters-block">
      <div className="search-row">
        <input
          className="big-search"
          type="search"
          placeholder="Search names, types or rules text (e.g. “dragon”, “draw a card”)"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
        />
        <ViewToggle mode={view} onChange={setView} />
      </div>

      <div className="row filter-row">
        <label className="inline-select">
          <span>Where</span>
          <select value={filters.where} onChange={(e) => set({ where: e.target.value })}>
            <option value="all">Everywhere</option>
            <option value="loose">Loose cards</option>
            <option value="out">Swapped out (spares)</option>
            {decks.filter((d) => !d.brew).map((d) => <option key={d.id} value={`deck:${d.id}`}>In {d.name}</option>)}
          </select>
        </label>
        <label className="inline-select">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <button className={`secondary ${open || extra ? 'filters-on' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open}>
          Filters{extra ? ` · ${extra}` : ''} {open ? '▴' : '▾'}
        </button>
        <span className="muted small showing">
          Showing {shownCount} of {totalCount}
          {anything && <> · <button className="link" onClick={() => setFilters({ ...filters, search: '', where: 'all', colors: [], type: '', set: '', rarity: '', minPrice: '', maxPrice: '' })}>Clear all</button></>}
        </span>
      </div>

      {open && (
        <div className="panel filter-panel">
          <div className="filter-group">
            <span className="filter-label">Colour</span>
            <span className="row">
              {['W', 'U', 'B', 'R', 'G', 'C'].map((c) => (
                <button
                  key={c}
                  className={`colour-toggle ${filters.colors.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleColour(c)}
                  title={{ W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colourless' }[c]}
                >
                  {c === 'C' ? <span className="pip pip-C">◇</span> : <span className={`pip big pip-${c}`} />}
                </button>
              ))}
            </span>
          </div>
          <label className="filter-group">
            <span className="filter-label">Type</span>
            <select value={filters.type} onChange={(e) => set({ type: e.target.value })}>
              <option value="">Any type</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="filter-group">
            <span className="filter-label">Set</span>
            <select value={filters.set} onChange={(e) => set({ set: e.target.value })}>
              <option value="">Any set</option>
              {sets.map(([code, name]) => <option key={code} value={code}>{name} ({code.toUpperCase()})</option>)}
            </select>
          </label>
          <label className="filter-group">
            <span className="filter-label">Rarity</span>
            <select value={filters.rarity} onChange={(e) => set({ rarity: e.target.value })}>
              <option value="">Any rarity</option>
              {RARITIES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
            </select>
          </label>
          <div className="filter-group">
            <span className="filter-label">Price (USD)</span>
            <span className="row price-range">
              <input type="number" min="0" step="0.5" placeholder="Min" value={filters.minPrice} onChange={(e) => set({ minPrice: e.target.value })} />
              <span className="muted">to</span>
              <input type="number" min="0" step="0.5" placeholder="Max" value={filters.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
