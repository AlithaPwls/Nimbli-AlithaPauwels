const THUMB_EXERCISE =
  'https://www.figma.com/api/mcp/asset/c2bf7190-5fb7-4da6-ba2a-221b01284a59'

export default function OuderUpcomingExercise({ title, goal, meta }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-3 py-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-nimbli-canvas ring-1 ring-nimbli-slot-border/15">
        <img
          src={THUMB_EXERCISE}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#1a1a1a]">{title}</p>
        <p className="mt-1 text-[10px] text-[#6b7280]">
          <span className="mr-2 inline-flex items-center rounded bg-[#BDE786] px-1.5 py-0.5 text-[9px] font-bold text-[#302d2d]">
            {goal}
          </span>
          {meta}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-7 items-center justify-center rounded bg-nimbli px-3 font-nimbli-heading text-[10px] font-black text-[#faf5ee] shadow-[0_2px_0_0_#1e7a6a] transition-colors hover:opacity-95"
      >
        Start
      </button>
    </div>
  )
}

