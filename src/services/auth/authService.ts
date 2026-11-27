import { apiRequest, resetCsrfToken } from '../http/apiClient'
import type { RequestOptions } from '../http/apiClient'
import type { AccountRole, UserRole } from '../../routes/roles'
export type AuthUser = { id: number; fullName: string; email: string; role: AccountRole }
export type LoginRequest = { email: string; password: string; rememberMe: boolean }
export type RegisterRequest = { fullName: string; email: string; password: string; role: UserRole; acceptTerms: boolean }
export const authService = {
  me(options?: RequestOptions) { return apiRequest<AuthUser>('api/auth/me', options) },
  async login(body: LoginRequest) {
    const user = await apiRequest<AuthUser>('api/auth/login', { method: 'POST', body })
    resetCsrfToken()
    return user
  },
  async register(body: RegisterRequest) {
    const user = await apiRequest<AuthUser>('api/auth/register', { method: 'POST', body })
    resetCsrfToken()
    return user
  },
  async logout() {
    await apiRequest<void>('api/auth/logout', { method: 'POST', body: {} })
    resetCsrfToken()
  },
}

