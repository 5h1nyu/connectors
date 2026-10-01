import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Portal from './Portal'
import { autocomplete, cardsByName } from '../lib/scryfall'

// A search box that suggests real cards as you type ("wa" → "wav" → "wave…"), each with a thumbnail.
// Hover (or arrow-key to) a suggestion to see the full card before you pick it.
export default function CardSearch({ value, onChange, onPick, placeholder = 'Card name', autoFocus }) {
  const [options, setOptions] = useState([]) // [{ name, card }]
  const [forValue, setForValue] = useState('') // which text those options belong to
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Ask Scryfall once you pause typing: first the names, then their pictures (one request each).
  useEffect(() => {
    const term = value.trim()
    if (term.length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const names = await autocomplete(term)
        if (cancelled) return
        setOptions(names.map((name) => ({ name })))
        setForValue(term)
        setActive(-1)
        if (names.length) {
          const cards = await cardsByName(names)
          if (!cancelled) setOptions(names.map((name, i) => ({ name, card: cards[i] })))
        }
      } catch {
        // offline or Scryfall busy: just no suggestions
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value])

  const shown = open && value.trim().length >= 2 && forValue ? options : []

  // Keep the dropdown glued under the box, even inside scrolling popups.
  useLayoutEffect(() => {
    if (!shown.length) return
    const place = () => {
      const box = inputRef.current?.getBoundingClientRect()
      const list = listRef.current
      if (!box || !list) return
      const below = window.innerHeight - box.bottom
      const width = Math.min(Math.max(box.width, 280), 440)
      list.style.left = `${box.left}px`
      list.style.width = `${width}px`
      // the big preview goes on whichever side has room
      list.classList.toggle('preview-left', box.left + width + 260 > window.innerWidth)
      if (below < 260 && box.top > below) {
        list.style.top = ''
        list.style.bottom = `${window.innerHeight - box.top + 4}px`
        list.style.maxHeight = `${Math.min(380, box.top - 12)}px`
      } else {
        list.style.bottom = ''
        list.style.top = `${box.bottom + 4}px`
        list.style.maxHeight = `${Math.min(380, below - 12)}px`
      }
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [shown.length])

  function choose(option) {
    onChange(option.name)
    onPick?.(option.card ?? null)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!shown.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      choose(shown[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const preview = shown[active]?.card

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={shown.length > 0}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {shown.length > 0 && (
        <Portal>
          <div ref={listRef} className="search-dropdown" role="listbox">
            <ul>
              {shown.map((o, i) => (
                <li
                  key={o.name}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'active' : ''}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault() // keep focus in the box
                    choose(o)
                  }}
                >
                  {o.card?.imageSmall ? <img src={o.card.imageSmall} alt="" /> : <span className="thumb-blank" />}
                  <span className="option-text">
                    <strong>{o.name}</strong>
                    {o.card && <small>{o.card.typeLine}</small>}
                  </span>
                </li>
              ))}
            </ul>
            {preview?.image && (
              <div className="search-preview">
                <img src={preview.image} alt={preview.name} />
              </div>
            )}
          </div>
        </Portal>
      )}
    </>
  )
}
