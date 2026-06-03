import { Link } from 'react-router-dom'
import NimbliSidebarLogo from '@/components/NimbliSidebarLogo.jsx'
import KineSidebarNav from '@/components/kine/KineSidebarNav.jsx'

export default function KineSidebar() {
  return (
    <aside
      className="sticky top-0 hidden h-svh w-[220px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white px-6 pb-6 pt-8 lg:flex"
      aria-label="Hoofdnavigatie kinesist"
    >
      <Link
        to="/dashboard/kine"
        className="block shrink-0 rounded-md no-underline transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nimbli/40"
      >
        <NimbliSidebarLogo />
      </Link>

      <KineSidebarNav className="mt-14 min-h-0" />
    </aside>
  )
}
