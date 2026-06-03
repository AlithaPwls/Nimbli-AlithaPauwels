import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EMPTY_ILLUSTRATION =
  'https://www.figma.com/api/mcp/asset/3983d968-3f26-4d78-beb1-e9303a0abbb4'

export default function KinePatientsEmptyState({ onAddPatient }) {
  return (
    <div className="flex flex-col items-center gap-5 px-2 py-2 max-lg:gap-4 max-lg:px-4 max-lg:py-4">
      <img
        src={EMPTY_ILLUSTRATION}
        alt=""
        className="mx-auto h-[188px] w-[133px] max-w-full object-contain max-lg:h-[150px] max-lg:w-[106px]"
        loading="lazy"
        decoding="async"
      />
      <p className="max-w-[224px] text-center font-nimbli-body text-lg font-normal leading-snug text-[#1e2939] max-lg:max-w-none max-lg:text-base">
        Je hebt nog geen patiënten
      </p>
      <Button
        type="button"
        className="h-10 rounded bg-nimbli px-8 font-nimbli-heading text-sm font-black text-white shadow-[0_2px_0_0_#1e7a6a] hover:bg-nimbli/90 max-lg:w-full max-lg:max-w-sm"
        onClick={onAddPatient}
      >
        <UserPlus className="mr-2 size-[18px]" aria-hidden />
        Patiënt toevoegen
      </Button>
    </div>
  )
}
