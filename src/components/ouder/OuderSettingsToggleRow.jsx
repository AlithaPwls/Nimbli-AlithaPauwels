import OuderSwitch from '@/components/ouder/OuderSwitch.jsx'

export default function OuderSettingsToggleRow({ title, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="font-nimbli-body text-base text-[#1a1a1a]">{title}</p>
        <p className="mt-0.5 text-xs text-[#6b7280]">{description}</p>
      </div>
      <OuderSwitch checked={value} onCheckedChange={onChange} ariaLabel={title} />
    </div>
  )
}

