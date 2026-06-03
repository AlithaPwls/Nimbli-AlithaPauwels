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
      className="flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto rounded-[10px] border-2 border-[#e1dbd3] bg-white px-2 py-2 shadow-[0_2px_0_0_#e1dbd3] [-ms-overflow-style:auto] [scrollbar-width:thin] lg:justify-between lg:gap-6 lg:overflow-visible lg:px-7 lg:py-2.5"
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
              'h-8 shrink-0 whitespace-nowrap rounded-[8px] px-3 font-nimbli-heading text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40 lg:h-9 lg:min-w-[94px] lg:rounded-[10px] lg:px-4 lg:text-[13px]',
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
