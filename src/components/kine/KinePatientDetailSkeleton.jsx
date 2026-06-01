function Bone({ className = '' }) {
  return <div className={['animate-pulse rounded-md bg-[#e5e7eb]', className].join(' ')} aria-hidden />
}

export default function KinePatientDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Patiënt laden">
      <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 gap-5">
            <Bone className="size-24 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-3">
              <Bone className="h-8 w-48 max-w-full" />
              <Bone className="h-4 w-40 max-w-full" />
              <Bone className="mt-2 h-20 w-full max-w-lg" />
            </div>
          </div>
          <Bone className="size-12 shrink-0 rounded-[14px]" />
        </div>
        <div className="mt-6 border-t border-[#e5e7eb] pt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Bone className="h-10 w-40" />
            <Bone className="h-5 w-64 max-w-full" />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Bone className="h-11 w-52 rounded" />
      </div>

      <Bone className="h-14 w-full rounded-[10px]" />

      <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3]">
        <Bone className="h-7 w-32" />
        <Bone className="mt-2 h-5 w-28" />
        <Bone className="mt-8 h-[200px] w-full rounded-lg" />
      </section>
    </div>
  )
}
