import { Award, ChevronDown, LogOut, Star, Trophy } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks/useLogout.js'
import { useAuth } from '@/hooks/useAuth.js'
import supabase from '@/lib/supabaseClient.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function SidebarItem({ active, Icon, iconClassName, children, onClick }) {
  const IconComponent = Icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[44px] w-full items-center gap-3 rounded-[6px] border px-3 py-2.5 text-left',
        'transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary/40',
        active
          ? 'border-[#2bb39b] border-[1.5px] bg-kind-white shadow-[0_1.5px_0_0_#1e7a6a]'
          : 'border border-[#f9fafb] bg-kind-white shadow-[0_2px_0_0_#e1dbd3]'
      )}
    >
      <IconComponent className={cn('size-[22px] shrink-0', iconClassName)} aria-hidden />
      <span className="font-nimbli-heading text-[15px] font-bold leading-none text-kind-black">{children}</span>
    </button>
  )
}

export default function KindSidebar({ displayName = 'Kind', active = 'oefeningen', onNavigate }) {
  const { logout, loading: logoutLoading } = useLogout()
  const navigate = useNavigate()
  const { role, profile } = useAuth()

  const [switchOpen, setSwitchOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [switchLoading, setSwitchLoading] = useState(false)
  const [switchError, setSwitchError] = useState(null)

  const canSwitchToParent = useMemo(() => Boolean(profile?.invite_code), [profile?.invite_code])

  const doSwitchToParent = useCallback(async () => {
    if (!canSwitchToParent) return
    setSwitchLoading(true)
    setSwitchError(null)
    try {
      const inviteCode = profile?.invite_code
      const { data: parentRow, error: pErr } = await supabase
        .from('profiles')
        .select('email')
        .eq('invite_code', inviteCode)
        .eq('role', 'parent')
        .limit(1)
        .maybeSingle()
      if (pErr) throw pErr
      const parentEmail = parentRow?.email?.trim()
      if (!parentEmail) throw new Error('Parent email niet gevonden.')
      if (!password.trim()) throw new Error('Vul je wachtwoord in.')

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: parentEmail,
        password,
      })
      if (signInErr) throw signInErr

      setPassword('')
      setSwitchOpen(false)
      navigate('/dashboard/ouder')
    } catch (e) {
      setSwitchError(e)
    } finally {
      setSwitchLoading(false)
    }
  }, [canSwitchToParent, navigate, password, profile?.invite_code])

  return (
    <aside className="flex h-svh w-[216px] shrink-0 flex-col border-r-2 border-[#e5e7eb] bg-kind-white px-6 py-3 font-nimbli-body text-nimbli-ink">
      <button
        type="button"
        onClick={() => {
          // Kind → Ouder: always require password verification before switching.
          // (Even when the logged-in auth role is 'parent', the user is currently in the kind view.)
          setSwitchError(null)
          setPassword('')
          setSwitchOpen(true)
        }}
        className="flex h-[30px] w-full max-w-[173px] items-center justify-center gap-2 overflow-hidden rounded-[6px] border border-[#f9fafb] bg-kind-white px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary/40"
        aria-label="Wissel naar ouderdashboard"
      >
        <p className="truncate font-nimbli-heading text-sm font-normal text-kind-black">{displayName}</p>
        <ChevronDown className="size-3 shrink-0 text-kind-black" aria-hidden />
      </button>

      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent className="gap-5 bg-kind-white sm:max-w-sm">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="font-nimbli-heading text-xl font-black tracking-tight text-kind-black">
              Naar ouderdashboard
            </DialogTitle>
            <DialogDescription className="font-nimbli-body text-sm leading-relaxed text-kind-gray">
              Voor je veiligheid vragen we je wachtwoord om terug te schakelen naar het ouderaccount.
            </DialogDescription>
          </DialogHeader>

          {!canSwitchToParent ? (
            <p className="rounded-xl border border-kind-border bg-kind-white px-3 py-2 font-nimbli-body text-sm text-kind-red shadow-[0px_2px_0px_#e1dbd3]">
              Geen gekoppeld ouderaccount gevonden.
            </p>
          ) : (
            <div className="grid gap-2">
              <label className="font-nimbli-body text-xs font-semibold tracking-wide text-kind-gray">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  'h-11 w-full rounded-xl border bg-kind-white px-3 font-nimbli-body text-sm text-kind-black outline-none',
                  'shadow-[0px_2px_0px_#e1dbd3] transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-kind-green-primary/40',
                  switchError ? 'border-kind-red' : 'border-kind-border'
                )}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {switchError ? (
                <p className="rounded-lg bg-kind-red/10 px-2 py-1 font-nimbli-body text-xs text-kind-red">
                  {switchError?.message ? String(switchError.message) : 'Wachtwoordcontrole mislukt.'}
                </p>
              ) : null}
            </div>
          )}

          <DialogFooter className="mt-1 gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setSwitchOpen(false)}
              disabled={switchLoading}
              className={cn(
                'h-11 rounded-xl border border-kind-border bg-kind-white px-4 font-nimbli-heading text-sm font-bold text-kind-black',
                'shadow-[0px_2px_0px_#e1dbd3] transition-colors',
                'hover:bg-kind-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary/40',
                'disabled:opacity-60'
              )}
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={() => void doSwitchToParent()}
              disabled={switchLoading || !canSwitchToParent}
              className={cn(
                'h-11 rounded-xl border-0 bg-kind-green-primary px-5 font-nimbli-heading text-sm font-black text-kind-canvas',
                'shadow-[0_4px_0_0_#1e7a6a] transition-colors hover:bg-kind-green-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kind-green-primary focus-visible:ring-offset-2 focus-visible:ring-offset-kind-white',
                'disabled:opacity-60 disabled:shadow-none'
              )}
            >
              {switchLoading ? 'Bezig…' : 'Doorgaan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-10 font-nimbli-heading text-2xl font-black tracking-tight text-kind-green-primary">nimbli</p>

      <nav className="mt-8 flex w-full max-w-[173px] flex-col gap-4" aria-label="Navigatie kind">
        <SidebarItem
          active={active === 'oefeningen'}
          Icon={Star}
          iconClassName="fill-kind-red text-kind-red"
          onClick={() => onNavigate?.('oefeningen')}
        >
          Oefeningen
        </SidebarItem>
        <SidebarItem
          active={active === 'overzicht'}
          Icon={Trophy}
          iconClassName="text-kind-yellow"
          onClick={() => onNavigate?.('overzicht')}
        >
          Overzicht
        </SidebarItem>
        <SidebarItem
          active={active === 'profiel'}
          Icon={Award}
          iconClassName="text-kind-blue"
          onClick={() => onNavigate?.('profiel')}
        >
          Mijn profiel
        </SidebarItem>
      </nav>

      <div className="mt-auto pt-8">
        <button
          type="button"
          className="inline-flex size-[30px] items-center justify-center rounded-md text-kind-green-primary transition-colors hover:bg-kind-canvas disabled:opacity-60"
          onClick={() => void logout()}
          disabled={logoutLoading}
          aria-label={logoutLoading ? 'Bezig met uitloggen' : 'Uitloggen'}
        >
          <LogOut className="size-[30px] rotate-180" strokeWidth={2} />
        </button>
      </div>
    </aside>
  )
}
