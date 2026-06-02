import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildInviteRegisterUrl } from '@/lib/inviteRegisterLink.js'

/**
 * Generates a data-URL PNG QR for the parent registration deep link.
 */
export function useInviteQrDataUrl(inviteCode, enabled = true) {
  const [dataUrl, setDataUrl] = useState(null)
  const [registerUrl, setRegisterUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setDataUrl(null)
      setRegisterUrl(null)
      setError(null)
      return
    }

    const url = buildInviteRegisterUrl(inviteCode)
    setRegisterUrl(url)

    if (!url) {
      setDataUrl(null)
      setError(null)
      return
    }

    let cancelled = false
    setError(null)

    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#302d2d', light: '#ffffff' },
    })
      .then((result) => {
        if (!cancelled) setDataUrl(result)
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null)
          setError('QR-code kon niet worden gemaakt.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [inviteCode, enabled])

  return { dataUrl, registerUrl, error }
}
