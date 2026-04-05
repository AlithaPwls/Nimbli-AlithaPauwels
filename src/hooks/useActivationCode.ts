import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'

const LENGTH = 6

export function useActivationCode() {
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const setRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    refs.current[index] = el
  }, [])

  const focusAt = useCallback((index: number) => {
    const el = refs.current[index]
    if (el) {
      el.focus()
      el.select()
    }
  }, [])

  const handleChange = useCallback(
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '')
      const char = raw.slice(-1)
      setDigits((prev) => {
        const next = [...prev]
        next[index] = char
        return next
      })
      if (char && index < LENGTH - 1) {
        requestAnimationFrame(() => focusAt(index + 1))
      }
    },
    [focusAt]
  )

  const handleKeyDown = useCallback(
    (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Backspace') return
      if (digits[index]) return
      e.preventDefault()
      if (index > 0) focusAt(index - 1)
    },
    [digits, focusAt]
  )

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return
    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
      return next
    })
    requestAnimationFrame(() => focusAt(Math.min(pasted.length, LENGTH - 1)))
  }, [focusAt])

  const code = digits.join('')
  const isComplete = code.length === LENGTH

  return {
    digits,
    setRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    isComplete,
    code,
  }
}
