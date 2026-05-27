const TABS = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'sessies', label: 'Sessies' },
  { id: 'oefeningen', label: 'Oefeningen' },
  { id: 'logboek', label: 'Logboek' },
]

export default function KinePatientDetailTabs({ activeTab, onTabChange }) {
  return (
    <div
      role="tablist"
      aria-label="Patiëntdetail"
      className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[10px] border-2 border-[#e1dbd3] bg-white p-2.5 shadow-[0_2px_0_0_#e1dbd3] sm:gap-6 sm:px-7"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={[
              'h-9 min-w-[94px] rounded-[10px] px-4 font-nimbli-heading text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
              isActive ? 'bg-nimbli text-white' : 'text-[#302d2d] hover:bg-nimbli-canvas/80',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export { TABS }
