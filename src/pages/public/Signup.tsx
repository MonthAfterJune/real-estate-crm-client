import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import AuthLayout from '../../components/auth/AuthLayout'
import { authError, inputClasses, labelClasses, submitClasses } from '../../components/auth/formStyles'
import { getDashboardPath } from '../../routes/roles'
import type { UserRole } from '../../routes/roles'
const roles: { value: UserRole; label: string; detail: string }[] = [
  { value: 'agent', label: 'Agent', detail: 'Sell & manage' },
  { value: 'seller', label: 'Seller', detail: 'List a property' },
  { value: 'buyer', label: 'Buyer', detail: 'Browse & buy' },
]
export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requested = params.get('role')
  const [role, setRole] = useState<UserRole>(roles.find(r => r.value === requested)?.value ?? 'agent')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (password !== confirm) { setError('The passwords do not match.'); return }
    setPending(true)
    setError('')
    try {
      const account = await register({ fullName: fullName.trim(), email: email.trim(), password, role, acceptTerms })
      navigate(getDashboardPath(account.role), { replace: true })
    } catch (failure) { setError(authError(failure)) }
    finally { setPending(false) }
  }
  return <AuthLayout title="Create your account" subtitle="Choose how you’ll use Meridian.">
    <form onSubmit={submit} aria-busy={pending} className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-sm border border-brick/20 bg-brick-dim p-3 text-[13px] text-brick">{error}</p>}
      <fieldset className="m-0 min-w-0 border-0 p-0" disabled={pending}>
        <legend className="sr-only">Choose your workspace</legend>
        <div className="grid grid-cols-3 gap-2">{roles.map(option => <label key={option.value} className="cursor-pointer">
          <input type="radio" name="role" value={option.value} checked={role === option.value} onChange={() => setRole(option.value)} className="peer sr-only" />
          <span className="box-border block rounded-[9px] border border-line bg-surface px-1 py-3 text-center text-[10px] leading-[1.4] text-ink-soft peer-checked:border-secondary peer-checked:bg-sky-dim peer-checked:text-secondary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary">
            <strong className="mb-1 block text-[12px]">{option.label}</strong>{option.detail}
          </span>
        </label>)}</div>
      </fieldset>
      <label className={labelClasses}>Full name<input required name="fullName" autoComplete="name" maxLength={100} pattern=".*\S.*" placeholder="Juan Dela Cruz" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses} disabled={pending} /></label>
      <label className={labelClasses}>Email<input required type="email" name="email" autoComplete="username" maxLength={150} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} disabled={pending} /></label>
      <label className={labelClasses}>Password<input required type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} placeholder="At least 12 characters" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} aria-describedby="password-help" disabled={pending} /></label>
      <p id="password-help" className="-mt-2 text-[11.5px] leading-relaxed text-ink-faint">Use 12–128 characters and at least 3 different characters. A memorable passphrase works well.</p>
      <label className={labelClasses}>Confirm password<input required type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClasses} disabled={pending} /></label>
      <label className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft"><input required type="checkbox" className="mt-1 shrink-0" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} disabled={pending} /><span>I understand this is a demo workspace and agree to use it responsibly.</span></label>
      <button type="submit" className={submitClasses} disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="mt-5 text-center text-[13px] text-ink-soft">Already have an account? <Link to="/login" className="font-semibold text-secondary no-underline hover:underline">Log in</Link></p>
  </AuthLayout>
}
