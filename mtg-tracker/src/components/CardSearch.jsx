import { useEffect, useId, useState } from 'react'
import { autocomplete } from '../lib/scryfall'

// A text box that suggests real card names as you type.
export default function CardSearch({ value, onChange, placeholder = 'Card name', autoFocus }) {
  const [suggestions, setSuggestions] = useState([])
  const listId = useId()

  useEffect(() => {
    // Wait until you stop typing for a moment so we don't spam Scryfall.
    const timer = setTimeout(() => autocomplete(value).then(setSuggestions).catch(() => {}), 250)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <>
      <input
        list={listId}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {suggestions.map((name) => <option key={name} value={name} />)}
      </datalist>
    </>
  )
}
