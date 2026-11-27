import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import type { IconName } from '../components/Icon'
import { dashboardAccentClasses } from '../components/dashboardTheme'
import type { DashboardAccent } from '../components/dashboardTheme'
import type { UserRole } from './roles'

type NavigationItem = {
  label: string
  icon: IconName
  to?: string
}

type RoleLayoutConfig = {
  brandSub: string
  accent: DashboardAccent
  navigation: NavigationItem[]
  workspaceNavigation?: NavigationItem[]
}

const layouts: Record<UserRole, RoleLayoutConfig> = {
  agent: {
    brandSub: 'CRM',
    accent: 'forest',
    navigation: [
      { label: 'Dashboard', icon: 'dashboard', to: '/agent/dashboard' },
      { label: 'Contacts', icon: 'contacts', to: '/agent/contacts' },
      { label: 'Listings', icon: 'listings', to: '/agent/listings' },
      { label: 'Pipeline', icon: 'pipeline', to: '/agent/pipeline' },
      { label: 'Tasks', icon: 'tasks' },
      { label: 'Reports', icon: 'reports' },
    ],
    workspaceNavigation: [
      { label: 'Reminders', icon: 'reminders' },
      { label: 'Settings', icon: 'settings' },
    ],
  },
  buyer: {
    brandSub: 'Home Search',
    accent: 'sky',
    navigation: [
      { label: 'Browse homes', icon: 'search', to: '/buyer/dashboard' },
      { label: 'Saved searches', icon: 'saved', to: '/buyer/saved-searches' },
      { label: 'My inquiries', icon: 'inbox' },
      { label: 'Tour schedule', icon: 'tasks' },
      { label: 'Messages', icon: 'message' },
    ],
  },
  seller: {
    brandSub: 'Seller Portal',
    accent: 'brass',
    navigation: [
      { label: 'My listing', icon: 'listings', to: '/seller/dashboard' },
      { label: 'Offers', icon: 'offer', to: '/seller/offer-tracker' },
      { label: 'Showings', icon: 'tasks' },
      { label: 'Documents', icon: 'document' },
      { label: 'Messages', icon: 'message' },
    ],
  },
}

const navigationItemClasses = 'flex items-center gap-2.75 rounded-sm px-2.5 py-2.25 text-[13.5px] no-underline [&_svg]:flex-none'

function NavigationItems({ items, accent }: { items: NavigationItem[]; accent: DashboardAccent }) {
  return items.map(({ label, icon, to }) => (
    to ? (
      <NavLink
        key={label}
        to={to}
        end
        className={({ isActive }) => `${navigationItemClasses} cursor-pointer ${isActive
          ? `${dashboardAccentClasses[accent].navigation} font-semibold [&_svg]:opacity-100`
          : 'text-ink-soft hover:bg-line-soft [&_svg]:opacity-80'}`}
      >
        <Icon name={icon} />
        {label}
      </NavLink>
    ) : (
      <span key={label} className={`${navigationItemClasses} cursor-default text-ink-soft hover:bg-line-soft [&_svg]:opacity-80`} aria-disabled="true">
        <Icon name={icon} />
        {label}
      </span>
    )
  ))
}

export default function RoleLayout({ role }: { role: UserRole }) {
  const { user: account } = useAuth()
  const { navigation, workspaceNavigation, brandSub, accent } = layouts[role]

  return (
    <AppShell
      navigation={<NavigationItems items={navigation} accent={accent} />}
      workspaceNavigation={workspaceNavigation && <NavigationItems items={workspaceNavigation} accent={accent} />}
      user={{ name: account?.fullName ?? 'Meridian user', description: account?.role === 'admin' ? 'Administrator' : account?.role === 'manager' ? 'Manager' : role.charAt(0).toUpperCase() + role.slice(1) }}
      brandSub={brandSub}
      accent={accent}
    >
      <Outlet />
    </AppShell>
  )
}


