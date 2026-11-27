import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './authContext'
import { authService } from '../services/auth/authService'
import type { AuthUser, LoginRequest, RegisterRequest } from '../services/auth/authService'
import { ApiError, resetCsrfToken } from '../services/http/apiClient'
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const generation = useRef(0)
  const loadSession = useCallback((signal?: AbortSignal) => {
    const current = ++generation.current
    return authService.me({ signal }).then(account => {
      if (current === generation.current) setUser(account)
    }).catch((error: unknown) => {
      if (signal?.aborted || current !== generation.current) return
      setUser(null)
      if (!(error instanceof ApiError && error.status === 401)) setSessionError('We could not load your session. Please try again.')
    }).finally(() => {
      if (!signal?.aborted && current === generation.current) setLoading(false)
    })
  }, [])
  const refresh = useCallback(() => {
    setLoading(true)
    setSessionError('')
    return loadSession()
  }, [loadSession])
  useEffect(() => {
    const controller = new AbortController()
    void loadSession(controller.signal)
    const expire = () => { ++generation.current; setUser(null); setLoading(false); resetCsrfToken() }
    window.addEventListener('meridian:session-expired', expire)
    return () => { controller.abort(); window.removeEventListener('meridian:session-expired', expire) }
  }, [loadSession])
  function accept(account: AuthUser) {
    ++generation.current
    setUser(account)
    setSessionError('')
    setLoading(false)
    return account
  }
  async function login(request: LoginRequest) { return accept(await authService.login(request)) }
  async function register(request: RegisterRequest) { return accept(await authService.register(request)) }
  async function logout() {
    try { await authService.logout() }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error }
    ++generation.current
    resetCsrfToken()
    setUser(null)
    setSessionError('')
    setLoading(false)
  }
  return <AuthContext value={{ user, isLoading, sessionError, refresh, login, register, logout }}>{children}</AuthContext>
}


