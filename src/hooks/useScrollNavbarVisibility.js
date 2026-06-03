import { useEffect, useRef, useState } from 'react'

const TOP_THRESHOLD = 16
const BOTTOM_THRESHOLD = 48
const SCROLL_DELTA_MIN = 8

function isNearTop(scrollTop) {
  return scrollTop <= TOP_THRESHOLD
}

function isNearBottom(scrollEl) {
  const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
  if (maxScroll <= TOP_THRESHOLD) return true
  return scrollEl.scrollTop >= maxScroll - BOTTOM_THRESHOLD
}

export function useScrollNavbarVisibility(scrollEl, { enabled = true } = {}) {
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setVisible(true)
      return undefined
    }

    if (!scrollEl) return undefined

    lastScrollY.current = scrollEl.scrollTop
    let ticking = false

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const current = scrollEl.scrollTop
        const delta = current - lastScrollY.current
        const atBottom = isNearBottom(scrollEl)

        if (isNearTop(current)) {
          setVisible(true)
        } else if (Math.abs(delta) < SCROLL_DELTA_MIN) {
          // Ignore rubber-band / sub-pixel noise (common at scroll end).
        } else if (atBottom) {
          if (delta > 0) {
            setVisible(false)
          }
        } else if (delta > 0) {
          setVisible(false)
        } else {
          setVisible(true)
        }

        lastScrollY.current = current
        ticking = false
      })
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [scrollEl, enabled])

  return visible
}
