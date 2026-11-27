import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import AuthLayout from '../../components/auth/AuthLayout'
import { authError, inputClasses, labelClasses, submitClasses } from '../../components/auth/formStyles'
import { getDashboardPath } from '../../routes/roles'
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [help, setHelp] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    try {
      const account = await login({ email: email.trim(), password, rememberMe })
      const from: unknown = location.state?.from
      const destination = typeof from === 'string' && from.startsWith(`/${account.role}/`) ? from : getDashboardPath(account.role)
      navigate(destination, { replace: true })
    } catch (failure) { setError(authError(failure)) }
    finally { setPending(false) }
  }
  return <AuthLayout title="Welcome back" subtitle="Log in to your Meridian account.">
    <form onSubmit={submit} aria-busy={pending} className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-sm border border-brick/20 bg-brick-dim p-3 text-[13px] text-brick">{error}</p>}
      <label className={labelClasses}>Email<input required type="email" name="email" autoComplete="username" maxLength={150} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} disabled={pending} /></label>
      <label className={labelClasses}><span className="flex justify-between gap-2">Password<button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[12px] text-secondary hover:underline" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span>
        <input required type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} disabled={pending} /></label>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-ink-soft">
        <label className="flex items-center gap-2"><input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} disabled={pending} />Remember me</label>
        <button type="button" onClick={() => setHelp(!help)} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[12.5px] text-secondary hover:underline">Forgot password?</button>
      </div>
      {help && <p role="status" className="text-[12.5px] leading-relaxed text-ink-soft">Password recovery is not available yet. Contact the person who manages your Meridian account.</p>}
      <button type="submit" className={submitClasses} disabled={pending}>{pending ? 'Logging in…' : 'Log in'}</button>
    </form>
    <p className="mt-5 text-center text-[13px] text-ink-soft">Don’t have an account? <Link to="/signup" className="font-semibold text-secondary no-underline hover:underline">Sign up</Link></p>
  </AuthLayout>
}
