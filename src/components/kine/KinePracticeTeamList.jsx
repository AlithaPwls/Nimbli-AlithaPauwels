import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

function initialsFromName(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export default function KinePracticeTeamList({
  members,
  loading,
  error,
  addButtonClassName,
  onAddMember,
  onSelectMember,
}) {
  return (
    <section
      className="rounded-[14px] border-2 border-[#e1dbd3] bg-white p-4 shadow-[0_2px_0_0_#e1dbd3]"
      aria-labelledby="kine-team-heading"
    >
      <h3
        id="kine-team-heading"
        className="font-nimbli-heading text-sm font-bold text-nimbli-ink"
      >
        Kinesisten in je praktijk
      </h3>
      <p className="mt-1 text-xs text-nimbli-muted">
        {loading
          ? 'Team laden…'
          : members.length === 1
            ? '1 kinesist'
            : `${members.length} kinesisten`}
      </p>

      <Button
        type="button"
        className={addButtonClassName}
        onClick={onAddMember}
      >
        <UserPlus className="mr-2 size-[18px]" aria-hidden />
        Nieuwe gebruiker toevoegen
      </Button>

      {error ? (
        <p className="mt-3 text-xs font-medium text-red-600" role="alert">
          Team laden mislukt. Vernieuw de pagina.
        </p>
      ) : null}

      {loading ? (
        <ul className="mt-4 space-y-2" aria-busy="true">
          {[0, 1].map((key) => (
            <li
              key={key}
              className="h-14 animate-pulse rounded-lg bg-nimbli-canvas/80"
              aria-hidden
            />
          ))}
        </ul>
      ) : members.length === 0 ? (
        <p className="mt-4 text-xs text-nimbli-muted">
          Nog geen kinesisten gevonden. Voeg een collega toe met de knop hierboven.
        </p>
      ) : (
        <ul className="mt-4 max-h-[min(360px,50vh)] space-y-2 overflow-y-auto">
          {members.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => onSelectMember?.(member)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#e1dbd3]/80 bg-nimbli-canvas/25 px-3 py-2.5 text-left transition-colors hover:border-nimbli/40 hover:bg-nimbli/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover ring-1 ring-nimbli-slot-border/20"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nimbli/15 font-nimbli-heading text-xs font-bold text-nimbli"
                    aria-hidden
                  >
                    {initialsFromName(member.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-nimbli-heading text-sm font-bold text-nimbli-ink">
                      {member.name}
                    </p>
                    {member.isCurrentUser ? (
                      <span className="inline-flex shrink-0 rounded-full bg-nimbli/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-nimbli">
                        Jij
                      </span>
                    ) : null}
                  </div>
                  {member.email ? (
                    <p className="truncate text-xs text-nimbli-muted">{member.email}</p>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
