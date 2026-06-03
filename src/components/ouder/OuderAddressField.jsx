import { useEffect, useId, useRef, useState } from 'react'
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete.js'
import { cn } from '@/lib/utils'

const inputClassName =
  'h-12 w-full rounded-lg border border-[#7c7c7c] bg-white px-3 font-nimbli-body text-base font-medium text-[#1a1a1a] outline-none transition-colors duration-200 placeholder:text-[#7c7c7c] focus-visible:border-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/35 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none'

export default function OuderAddressField({
  label,
  placeholder = 'Adres',
  value,
  onChange,
  disabled = false,
}) {
  const listboxId = useId()
  const containerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const { suggestions, loading, showSuggestions } = useAddressAutocomplete(value)

  useEffect(() => {
    if (!showSuggestions) {
      setOpen(false)
      setActiveIndex(-1)
    }
  }, [showSuggestions])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  function handleInputChange(event) {
    onChange(event)
    setOpen(true)
    setActiveIndex(-1)
  }

  function selectSuggestion(suggestion) {
    onChange({ target: { value: suggestion.value } })
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event) {
    if (!open || suggestions.length === 0) {
      if (event.key === 'ArrowDown' && showSuggestions) {
        setOpen(true)
        setActiveIndex(0)
        event.preventDefault()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      selectSuggestion(suggestions[activeIndex])
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const listOpen = open && showSuggestions

  return (
    <label ref={containerRef} className="relative flex w-full flex-col gap-1.5">
      <span className="font-nimbli-body text-[18px] leading-[25.2px] text-black">{label}</span>
      <input
        className={inputClassName}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (showSuggestions) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={listOpen}
        aria-controls={listOpen ? listboxId : undefined}
        aria-activedescendant={
          listOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        disabled={disabled}
        role="combobox"
      />
      {listOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#e1dbd3] bg-white py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          {loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#7c7c7c]">Adressen zoeken…</li>
          ) : null}
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
            >
              <button
                type="button"
                className={cn(
                  'flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-nimbli-canvas',
                  activeIndex === index && 'bg-nimbli-canvas'
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="font-nimbli-body text-sm font-medium text-[#1a1a1a]">
                  {suggestion.line1}
                </span>
                {suggestion.line2 ? (
                  <span className="font-nimbli-body text-xs text-[#7c7c7c]">{suggestion.line2}</span>
                ) : null}
              </button>
            </li>
          ))}
          {!loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#7c7c7c]">Geen adressen gevonden</li>
          ) : null}
        </ul>
      ) : null}
    </label>
  )
}
