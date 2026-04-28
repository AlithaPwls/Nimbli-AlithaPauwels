export default function OuderSwitch({ checked, onCheckedChange, ariaLabel }) {
  const isOn = Boolean(checked)
  return (
    <button
      type="button"
      onClick={() => onCheckedChange?.(!isOn)}
      className={[
        'relative h-6 w-12 cursor-pointer rounded-full pt-0.5 transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40',
        isOn ? 'bg-nimbli' : 'bg-[#d1d5db]',
      ].join(' ')}
      aria-pressed={isOn}
      aria-label={ariaLabel}
    >
      <span
        className={[
          'absolute left-0.5 top-0.5 size-5 rounded-full bg-white',
          'shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]',
          'transition-transform duration-200 motion-reduce:transition-none',
          isOn ? 'translate-x-6' : 'translate-x-0',
        ].join(' ')}
        aria-hidden
      />
    </button>
  )
}

