import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { dashboardAccentClasses } from './dashboardTheme'
import type { DashboardAccent } from './dashboardTheme'

type AppShellProps = {
  children: ReactNode
  navigation: ReactNode
  workspaceNavigation?: ReactNode
  brandSub?: string
  accent?: DashboardAccent
  user: {
    name: string
    description: string
  }
}

export default function AppShell({ children, navigation, workspaceNavigation, user, brandSub = 'CRM', accent = 'forest' }: AppShellProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    setLogoutError('')
    try { await logout(); navigate('/login', { replace: true }) }
    catch { setLogoutError('We could not log you out. Please try again.') }
    finally { setSigningOut(false) }
  }
  return (
    <div className="grid min-h-screen w-full grid-cols-[236px_minmax(0,1fr)] compact:grid-cols-[1fr]">
      <aside className="flex flex-col gap-0.5 border-r border-line bg-surface px-4 py-5.5 compact:hidden">
        <div className="mb-2 flex items-baseline gap-2 border-b border-line-soft px-2 pt-0 pb-5.5">
          <Link to="/" className="font-display text-[20px] font-semibold tracking-[-0.01em] text-ink no-underline">Meridian</Link>
          <span className="text-[11px] text-ink-faint">{brandSub}</span>
        </div>

        <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
          {navigation}
        </nav>

        {workspaceNavigation && (
          <>
            <div className="px-2.5 pt-4 pb-1.5 text-[11px] text-ink-faint">Workspace</div>
            <nav className="flex flex-col gap-0.5" aria-label="Workspace navigation">
              {workspaceNavigation}
            </nav>
          </>
        )}

        <div className="mt-auto flex items-center gap-2.5 border-t border-line-soft pt-3.5 pl-2.5">
          <div className={`size-7.5 flex-none rounded-full ${dashboardAccentClasses[accent].avatar}`} aria-hidden="true"></div>
          <div className="leading-[1.25]">
            <b className="block text-[12.5px]">{user.name}</b>
            <span className="text-[11px] text-ink-faint">{user.description}</span>
          </div>
        </div>
        <button type="button" onClick={() => { void signOut() }} disabled={signingOut} className="mt-3 cursor-pointer rounded-sm border border-line bg-surface py-2 font-sans text-[12.5px] text-secondary hover:bg-sky-dim disabled:opacity-60">{signingOut ? 'Logging out…' : 'Log out'}</button>
        {logoutError && <p role="alert" className="mt-2 text-[12px] text-brick">{logoutError}</p>}
      </aside>

      <main className="min-w-0 w-full px-8.5 pt-6.5 pb-10">
        <div className="mb-5 hidden items-center justify-between gap-3 compact:flex"><Link to="/" className="font-display text-ink no-underline">Meridian</Link><button type="button" onClick={() => { void signOut() }} disabled={signingOut} className="cursor-pointer rounded-sm border border-line bg-surface px-3 py-2 text-[12px] text-secondary">{signingOut ? 'Logging out…' : 'Log out'}</button></div>
        {logoutError && <p role="alert" className="mb-3 hidden text-[12px] text-brick compact:block">{logoutError}</p>}
        <nav aria-label="Mobile navigation" className="mb-5 hidden min-w-0 gap-1 overflow-x-auto rounded-sm border border-line bg-surface p-1 compact:flex [&_a]:shrink-0 [&_a]:whitespace-nowrap [&_span]:hidden">
          {navigation}
        </nav>
        {children}
      </main>
    </div>
  )
}

