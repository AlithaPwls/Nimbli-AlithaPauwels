export default function OuderTextField({ label, placeholder }) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="font-nimbli-body text-[18px] leading-[25.2px] text-black">{label}</span>
      <input
        className="h-12 w-full rounded-lg border border-[#7c7c7c] bg-white px-3 font-nimbli-body text-base font-medium text-[#1a1a1a] outline-none transition-colors duration-200 placeholder:text-[#7c7c7c] focus-visible:border-nimbli focus-visible:ring-[3px] focus-visible:ring-nimbli/35 motion-reduce:transition-none"
        placeholder={placeholder}
      />
    </label>
  )
}

