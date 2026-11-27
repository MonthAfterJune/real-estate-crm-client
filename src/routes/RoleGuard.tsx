import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { getDashboardPath, isStaffManager } from './roles'
import type { UserRole } from './roles'
// A browser guard improves navigation; the server independently authorizes every API request.
export default function RoleGuard({ allowedRole }: { allowedRole: UserRole }) {
  const { user, isLoading, sessionError, refresh } = useAuth()
  const location = useLocation()
  if (isLoading) return <p role="status" className="p-8 text-[14px] text-ink-soft">Loading your workspace…</p>
  if (sessionError) return <div className="mx-auto mt-12 rounded-md border border-line bg-surface p-6 text-[14px]">
    <p role="alert">{sessionError}</p>
    <button type="button" onClick={() => { void refresh() }} className="mt-4 cursor-pointer rounded-sm border-0 bg-secondary px-4 py-2 text-on-secondary">Try again</button>
  </div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (user.role !== allowedRole && !(isStaffManager(user.role) && allowedRole === 'agent')) return <Navigate to={getDashboardPath(user.role)} replace />
  return <Outlet />
}

