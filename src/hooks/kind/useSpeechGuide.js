import { useCallback, useEffect, useRef, useState } from 'react'

const DUTCH_LANGS = ['nl-BE', 'nl-NL', 'nl']

function getSpeechApi() {
  if (typeof window === 'undefined') return null
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return null
  return {
    synth: window.speechSynthesis,
    Utterance: window.SpeechSynthesisUtterance,
  }
}

function cleanSpeechText(text) {
  if (typeof text !== 'string') return ''
  return text.replace(/\s+/g, ' ').trim()
}

function pickDutchVoice(voices) {
  const list = Array.isArray(voices) ? voices : []
  for (const lang of DUTCH_LANGS) {
    const exact = list.find((voice) => voice.lang?.toLowerCase() === lang.toLowerCase())
    if (exact) return exact
  }
  return list.find((voice) => voice.lang?.toLowerCase().startsWith('nl')) ?? null
}

export function useSpeechGuide({ rate = 0.95, pitch = 1, volume = 1 } = {}) {
  const apiRef = useRef(null)
  const voicesRef = useRef([])
  const utteranceRef = useRef(null)
  const [supported] = useState(() => Boolean(getSpeechApi()))
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMutedState] = useState(false)

  const cancel = useCallback(() => {
    const api = apiRef.current ?? getSpeechApi()
    if (!api) return

    api.synth.cancel()
    utteranceRef.current = null
    setSpeaking(false)
  }, [])

  const setMuted = useCallback(
    (next) => {
      const value = typeof next === 'function' ? next(muted) : next
      const mutedNext = Boolean(value)
      setMutedState(mutedNext)
      if (mutedNext) cancel()
    },
    [cancel, muted]
  )

  const speak = useCallback(
    (text, options = {}) => {
      const api = apiRef.current ?? getSpeechApi()
      if (!api || muted) return false

      const speechText = cleanSpeechText(text)
      if (!speechText) return false

      api.synth.cancel()

      const utterance = new api.Utterance(speechText)
      const voice = pickDutchVoice(voicesRef.current.length ? voicesRef.current : api.synth.getVoices())
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang ?? 'nl-BE'
      utterance.rate = Number.isFinite(Number(options.rate)) ? Number(options.rate) : rate
      utterance.pitch = Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : pitch
      utterance.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : volume

      utterance.onstart = () => {
        if (utteranceRef.current === utterance) setSpeaking(true)
      }
      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null
          setSpeaking(false)
        }
      }
      utterance.onerror = utterance.onend

      utteranceRef.current = utterance
      api.synth.speak(utterance)
      return true
    },
    [muted, pitch, rate, volume]
  )

  useEffect(() => {
    const api = apiRef.current ?? getSpeechApi()
    if (!api) return undefined

    apiRef.current = api
    voicesRef.current = api.synth.getVoices()

    function updateVoices() {
      voicesRef.current = api.synth.getVoices()
    }

    api.synth.addEventListener?.('voiceschanged', updateVoices)

    return () => {
      api.synth.removeEventListener?.('voiceschanged', updateVoices)
      if (utteranceRef.current) api.synth.cancel()
      utteranceRef.current = null
    }
  }, [])

  return {
    supported,
    speaking,
    muted,
    setMuted,
    speak,
    cancel,
  }
}
