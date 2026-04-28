export default function OuderSettingsCard({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-[14px] border-2 border-[#e1dbd3] bg-white px-[21px] pt-[21px] pb-[22px]',
        'shadow-[0_2px_0_0_#e1dbd3]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

