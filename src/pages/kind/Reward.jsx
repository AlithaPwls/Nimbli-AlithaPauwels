import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resolveKindRouteChildId, withChildSearch } from '@/lib/activeChild.js'
import { useAuth } from '@/hooks/useAuth.js'

import mascotImg from '@/assets/aapje-confetti-nobg.png'
import confetti from 'canvas-confetti'

const CONFETTI_COLORS = ['#2bbf9d', '#FBB92A', '#82b3e1', '#E9B5FF', '#BDE786']

function StatCard({ label, value, valueClassName }) {
  return (
    <div className="flex h-[126px] w-[250px] flex-col gap-2 rounded-2xl border border-[#f3f4f6] bg-kind-white px-[33px] pt-[33px] pb-px shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)]">
      <p className="w-full text-center font-nimbli-body text-[18px] font-normal leading-[25.2px] text-[#6a7282]">
        {label}
      </p>
      <p className={`w-full text-center font-sans text-2xl font-bold leading-8 ${valueClassName}`}>{value}</p>
    </div>
  )
}

export default function Reward() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role, profile } = useAuth()
  const canvasRef = useRef(null)
  const mascotRef = useRef(null)

  const rewardXp = useMemo(() => {
    const raw = searchParams.get('xp')
    const n = raw == null ? null : Number(raw)
    if (n == null || !Number.isFinite(n)) return 50
    return Math.max(0, Math.round(n))
  }, [searchParams])

  const accuracy = useMemo(() => {
    const raw = searchParams.get('accuracy')
    const n = raw == null ? null : Number(raw)
    if (n == null || !Number.isFinite(n)) return 89
    return Math.max(0, Math.min(100, Math.round(n)))
  }, [searchParams])

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const fire = confetti.create(canvas, { resize: true, useWorker: true })

    // 1) Burst "from the monkey"
    const rect = mascotRef.current?.getBoundingClientRect?.()
    const origin = rect
      ? {
          x: (rect.left + rect.width * 0.67) / window.innerWidth,
          y: (rect.top + rect.height * 0.09) / window.innerHeight,
        }
      : { x: 0.5, y: 0.45 }

    fire({
      particleCount: 350,
      spread: 600,
      startVelocity: 32,
      gravity: 0.9,
      scalar: 0.85,
      origin,
      colors: CONFETTI_COLORS,
    })

    fire({
      particleCount: 150,
      spread: 850,
      startVelocity: 24,
      gravity: 0.85,
      scalar: 0.75,
      origin,
      colors: CONFETTI_COLORS,
    })

    // 2) Short confetti rain — small bursts spread across the width
    const durationMs = 1600
    const endAt = Date.now() + durationMs
    const rain = window.setInterval(() => {
      if (Date.now() > endAt) {
        window.clearInterval(rain)
        return
      }
      for (let i = 0; i < 6; i += 1) {
        fire({
          particleCount: 10,
          startVelocity: 10,
          ticks: 200,
          gravity: 1.5,
          scalar: 0.7,
          spread: 100,
          origin: { x: Math.random(), y: Math.random() * -0.001 - 0.0001 },
          colors: CONFETTI_COLORS,
        })
      }
    }, 150)

    return () => window.clearInterval(rain)
  }, [])

  return (
    <div className="min-h-svh bg-kind-canvas px-4 py-10" data-page="kind-reward">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 block h-full w-full"
        aria-hidden
      />
      <div className="mx-auto flex w-full max-w-[548px] flex-col items-center gap-[83px] pt-10 sm:pt-14">
        <h1 className="text-center font-nimbli-heading text-[36px] font-extrabold leading-10 text-kind-black">
          Fantastisch werk!
        </h1>

        <img
          ref={mascotRef}
          src={mascotImg}
          alt=""
          className="h-[217px] w-[165px] select-none"
          draggable={false}
        />

        <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <StatCard label="Beloning" value={`+${rewardXp} XP`} valueClassName="text-kind-yellow" />
          <StatCard label="Juistheid" value={`${accuracy}%`} valueClassName="text-[#82b3e1]" />
        </div>

        <button
          type="button"
          onClick={() => {
            const routeChildId = resolveKindRouteChildId({ role, profile, searchParams })
            navigate(routeChildId ? withChildSearch('/dashboard/kind', routeChildId) : '/dashboard/kind')
          }}
          className="h-16 w-[270px] rounded-xl border-0 bg-kind-green-primary font-nimbli-heading text-[18px] font-black leading-none text-kind-canvas shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas"
        >
          Doorgaan
        </button>
      </div>
    </div>
  )
}

