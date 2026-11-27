import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from '../auth/useAuth'
import Home from '../pages/public/Home'
import Login from '../pages/public/Login'
import Signup from '../pages/public/Signup'
import PagePlaceholder from '../components/PagePlaceholder'
import AgentDashboard from '../pages/agent/Dashboard'
import AgentListings from '../pages/agent/Listings'
import AgentPipeline from '../pages/agent/Pipeline'
import AgentContacts from '../pages/agent/Contacts'
import BuyerDashboard from '../pages/buyer/Dashboard'
import BuyerSavedSearches from '../pages/buyer/SavedSearches'
import SellerDashboard from '../pages/seller/Dashboard'
import SellerOfferTracker from '../pages/seller/OfferTracker'
import RoleGuard from './RoleGuard'
import RoleLayout from './RoleLayout'
import { getDashboardPath } from './roles'
import type { ReactNode } from 'react'
function GuestPage({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to={getDashboardPath(user.role)} replace /> : children
}
function DashboardRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <p role="status" className="p-8 text-[14px] text-ink-soft">Loading your workspace…</p>
  return <Navigate to={user ? getDashboardPath(user.role) : '/login'} replace />
}
export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<GuestPage><Login /></GuestPage>} />
    <Route path="/signup" element={<GuestPage><Signup /></GuestPage>} />
    <Route path="/dashboard" element={<DashboardRedirect />} />
    <Route element={<RoleGuard allowedRole="agent" />}>
      <Route path="/agent" element={<RoleLayout role="agent" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="listings" element={<AgentListings />} />
        <Route path="pipeline" element={<AgentPipeline />} />
        <Route path="contacts" element={<AgentContacts />} />
      </Route>
    </Route>
    <Route element={<RoleGuard allowedRole="buyer" />}>
      <Route path="/buyer" element={<RoleLayout role="buyer" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BuyerDashboard />} />
        <Route path="saved-searches" element={<BuyerSavedSearches />} />
      </Route>
    </Route>
    <Route element={<RoleGuard allowedRole="seller" />}>
      <Route path="/seller" element={<RoleLayout role="seller" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="offer-tracker" element={<SellerOfferTracker />} />
      </Route>
    </Route>
    <Route path="*" element={<div className="mx-auto w-full max-w-[800px] p-8"><PagePlaceholder title="Page not found" description="Check the address or return to Meridian home." /><a href="/" className="mt-4 inline-block text-[14px] text-secondary">Return home</a></div>} />
  </Routes>
}

