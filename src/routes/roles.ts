export type UserRole = 'agent' | 'buyer' | 'seller'
export type AccountRole = UserRole | 'manager' | 'admin'
export const isStaffManager = (role: AccountRole | undefined) => role === 'manager' || role === 'admin'

export function getDashboardPath(role: AccountRole) {
  return `/${isStaffManager(role) ? 'agent' : role}/dashboard`
}

