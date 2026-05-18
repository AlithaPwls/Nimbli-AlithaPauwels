import { captureVideoFrame, seekToTime } from '@/lib/kind/poseImageDetection.js'

const DEFAULT_SEEK_SEC = 0.25
const JPEG_QUALITY = 0.82

/**
 * Extract one JPEG frame from a local video file (browser only).
 * @param {File} file
 * @param {{ seekSec?: number, quality?: number }} [options]
 * @returns {Promise<Blob>}
 */
export async function fileToJpegThumbnailBlob(file, options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('Thumbnail extraction requires a browser environment.')
  }
  const seekSec = Number.isFinite(options.seekSec) ? options.seekSec : DEFAULT_SEEK_SEC
  const quality = Number.isFinite(options.quality) ? options.quality : JPEG_QUALITY

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')

  try {
    await new Promise((resolve, reject) => {
      const done = () => {
        video.removeEventListener('loadeddata', done)
        video.removeEventListener('error', onErr)
        resolve()
      }
      const onErr = () => {
        video.removeEventListener('loadeddata', done)
        video.removeEventListener('error', onErr)
        reject(new Error('Video kon niet geladen worden voor thumbnail.'))
      }
      video.addEventListener('loadeddata', done, { once: true })
      video.addEventListener('error', onErr, { once: true })
      video.src = url
      video.load()
    })

    const duration =
      Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null
    const t =
      duration != null ? Math.min(Math.max(0, seekSec), Math.max(0, duration - 0.05)) : 0

    try {
      await seekToTime(video, t)
    } catch {
      try {
        await seekToTime(video, 0)
      } catch {
        // draw current frame anyway
      }
    }

    const canvas = document.createElement('canvas')
    captureVideoFrame(video, canvas)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b && b.size > 0) resolve(b)
          else reject(new Error('Geen thumbnail-afbeelding gegenereerd.'))
        },
        'image/jpeg',
        quality,
      )
    })
    return blob
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}
