import { useEffect, useState } from 'react'
import { searchPhotonAddresses } from '@/lib/address/photonAddress.js'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 3

export function useAddressAutocomplete(query) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      setLoading(true)
      setError(null)

      searchPhotonAddresses(trimmed, { signal: controller.signal })
        .then((items) => {
          setSuggestions(items)
          setLoading(false)
        })
        .catch((err) => {
          if (err.name === 'AbortError') return
          setSuggestions([])
          setLoading(false)
          setError(null)
        })
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  const showSuggestions = query.trim().length >= MIN_QUERY_LENGTH && (loading || suggestions.length > 0)

  return {
    suggestions,
    loading,
    error,
    showSuggestions,
    minQueryLength: MIN_QUERY_LENGTH,
  }
}
