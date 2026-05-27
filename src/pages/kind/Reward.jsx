import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const mascotImg = 'https://www.figma.com/api/mcp/asset/7f6c98e2-9753-4607-8b7f-4b28fc076a86'

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

  return (
    <div className="min-h-svh bg-kind-canvas px-4 py-10" data-page="kind-reward">
      <div className="mx-auto flex w-full max-w-[548px] flex-col items-center gap-[83px] pt-10 sm:pt-14">
        <h1 className="text-center font-nimbli-heading text-[36px] font-extrabold leading-10 text-kind-black">
          Fantastisch werk!
        </h1>

        <img src={mascotImg} alt="" className="h-[217px] w-[165px] select-none" draggable={false} />

        <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <StatCard label="Beloning" value={`+${rewardXp} XP`} valueClassName="text-kind-yellow" />
          <StatCard label="Juistheid" value={`${accuracy}%`} valueClassName="text-[#82b3e1]" />
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/kind')}
          className="h-16 w-[270px] rounded-xl border-0 bg-kind-green-primary font-nimbli-heading text-[18px] font-black leading-none text-kind-canvas shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-canvas"
        >
          Doorgaan
        </button>
      </div>
    </div>
  )
}

