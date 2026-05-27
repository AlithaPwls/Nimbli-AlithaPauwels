import { Activity, Sparkles } from 'lucide-react'

export default function LoadingScreen({
  title = 'Even geduld',
  message = 'Nimbli maakt alles klaar.',
}) {
  return (
    <div
      className="flex min-h-svh items-center justify-center bg-kind-canvas px-4 py-10 font-nimbli-body text-nimbli-ink"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border-2 border-kind-border bg-kind-white px-7 py-8 text-center shadow-[0_4px_0_0_#e1dbd3]">
        <div className="absolute -left-10 -top-10 size-24 rounded-full bg-kind-yellow/35 blur-2xl" aria-hidden />
        <div className="absolute -bottom-12 -right-10 size-28 rounded-full bg-kind-green-primary/20 blur-2xl" aria-hidden />

        <div className="relative mx-auto grid size-20 place-items-center rounded-3xl bg-kind-green-primary text-kind-canvas shadow-[0_4px_0_0_#1e7a6a]">
          <Activity className="size-10 animate-pulse" aria-hidden strokeWidth={2.5} />
          <Sparkles className="absolute -right-2 -top-2 size-6 rounded-full bg-kind-yellow p-1 text-nimbli-ink shadow-sm" aria-hidden />
        </div>

        <h1 className="relative mt-6 font-nimbli-heading text-2xl font-black text-nimbli-ink">
          {title}
        </h1>
        <p className="relative mt-2 text-sm font-semibold leading-relaxed text-nimbli-muted">
          {message}
        </p>

        <div className="relative mt-6 flex justify-center gap-2" aria-hidden>
          <span className="size-3 animate-bounce rounded-full bg-kind-green-primary" />
          <span className="size-3 animate-bounce rounded-full bg-kind-yellow [animation-delay:120ms]" />
          <span className="size-3 animate-bounce rounded-full bg-kind-red [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  )
}
