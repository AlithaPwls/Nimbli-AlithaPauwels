import KinePatientProgressChart from '@/components/kine/KinePatientProgressChart.jsx'

export default function KinePatientProgressSection({ weeklyChart }) {
  const points = weeklyChart?.points
  const days = weeklyChart?.days

  return (
    <section className="rounded-[14px] border-2 border-[#e1dbd3] bg-white px-8 pb-8 pt-8 shadow-[0_2px_0_0_#e1dbd3] max-lg:px-5 max-lg:pb-6 max-lg:pt-6 max-sm:px-4 max-sm:pb-5 max-sm:pt-5">
      <header>
        <h2 className="font-nimbli-heading text-[22px] font-bold text-[#1a1a1a] max-sm:text-lg">
          Voortgang
        </h2>
        <p className="mt-1 text-[15px] text-[#6b7280] max-sm:text-sm">Laatste 7 dagen</p>
      </header>
      <div className="mt-8 max-sm:mt-5">
        <KinePatientProgressChart
          points={points}
          days={days}
          dayStatuses={weeklyChart?.dayStatuses}
          dayDetails={weeklyChart?.dayDetails}
        />
      </div>
    </section>
  )
}
