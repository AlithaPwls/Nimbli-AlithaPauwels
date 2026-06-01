import nimbliLogo from '@/assets/nimbli-logo.png'
import { cn } from '@/lib/utils'

/** Shared logo size, alignment and positioning for role sidebars. */
export const NIMBLI_SIDEBAR_LOGO_CLASS =
  'mx-auto block h-auto w-30 max-w-[173px]'

export default function NimbliSidebarLogo({ className }) {
  return (
    <img
      src={nimbliLogo}
      alt="nimbli"
      decoding="async"
      className={cn(NIMBLI_SIDEBAR_LOGO_CLASS, className)}
    />
  )
}
