import { createContext } from 'react'
import type { AuthUser, LoginRequest, RegisterRequest } from '../services/auth/authService'
export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  sessionError: string
  refresh: () => Promise<void>
  login: (request: LoginRequest) => Promise<AuthUser>
  register: (request: RegisterRequest) => Promise<AuthUser>
  logout: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)
