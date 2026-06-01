import { Zap } from 'lucide-react'
import {
  profileAgeLabel,
  profileFullName,
  profileInitials,
} from '@/lib/profileDisplay.js'
import { useKindChildProfile } from '@/hooks/kind/useKindChildProfile.js'
import { useKindProfileStats } from '@/hooks/kind/useKindProfileStats.js'

export default function KindOverviewProfileCard() {
  const { profile, loading: profileLoading } = useKindChildProfile()
  const { totalXp, loading: xpLoading } = useKindProfileStats()

  const loading = profileLoading || xpLoading
  const name = profile ? profileFullName(profile.firstname, profile.lastname) : 'Kind'
  const age = profile ? profileAgeLabel(profile.date_of_birth) : null
  const avatarUrl = profile?.avatar_url?.trim() || null
  const xpDisplay = xpLoading ? '…' : totalXp

  return (
    <section className="rounded-lg border-2 border-kind-border bg-kind-white px-[25px] py-6 shadow-[0_2px_0_0_#e1dbd3]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <div className="size-20 shrink-0 overflow-hidden rounded-full bg-kind-canvas ring-2 ring-kind-border sm:size-24">
            {loading ? (
              <div className="h-full w-full animate-pulse bg-kind-light-gray" />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Profielfoto van ${name}`}
                className="h-full w-full object-cover"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-nimbli-heading text-2xl font-black text-kind-green-primary">
                {profileInitials(profile?.firstname, profile?.lastname)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="font-nimbli-heading text-2xl font-extrabold leading-tight text-kind-black sm:text-[28px]">
              {loading ? '…' : name}
            </h2>
            {age ? (
              <p className="mt-1 font-nimbli-body text-sm text-kind-gray">{age}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-kind-border bg-kind-white px-4 py-3 shadow-[0_2px_0_0_#e1dbd3] sm:shrink-0">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-kind-purple">
            <Zap className="size-[25px] text-kind-white" strokeWidth={2.25} aria-hidden />
          </div>
          <div>
            <p className="font-nimbli-body text-xs text-[#6b7280]">Behaalde XP</p>
            <p className="font-nimbli-heading text-xl font-bold leading-7 text-kind-black">{xpDisplay}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
