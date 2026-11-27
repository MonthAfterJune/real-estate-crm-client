import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { getDashboardPath } from '../../routes/roles'
const features = [
  { role: 'agent', letter: 'A', title: 'For agents', description: 'Manage your pipeline, listings, and client contacts, and never lose track of a follow-up.' },
  { role: 'seller', letter: 'S', title: 'For sellers', description: 'Keep your property details together and follow your listing from first interest to closing.' },
  { role: 'buyer', letter: 'B', title: 'For buyers', description: 'Find a place to call home and keep your home search organized in one workspace.' },
]
const primary = 'inline-flex items-center justify-center rounded-[8px] border border-secondary bg-secondary px-5 py-2.5 text-[14px] font-semibold text-on-secondary no-underline hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'
const secondary = 'inline-flex items-center justify-center rounded-[8px] border border-line bg-surface px-5 py-2.5 text-[14px] font-semibold text-secondary no-underline hover:bg-sky-dim'
export default function Home() {
  const { user } = useAuth()
  const destination = user ? getDashboardPath(user.role) : '/signup'
  return <div className="flex min-h-screen flex-col bg-paper text-left">
    <header className="border-b border-line bg-surface">
      <nav aria-label="Home navigation" className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-12 py-5 max-[800px]:px-5">
        <Link to="/" className="font-display text-[23px] font-semibold text-ink no-underline">Meridian <span className="font-sans text-[11px] font-normal text-ink-faint">CRM</span></Link>
        <div className="flex items-center gap-7 text-[14px] text-ink-soft max-[650px]:hidden">
          <a href="#features" className="text-inherit no-underline hover:text-secondary">Features</a>
          <a href="#agents" className="text-inherit no-underline hover:text-secondary">For agents</a>
        </div>
        <div className="flex items-center gap-2.5">
          {user ? <Link className={primary} to={destination}>Open workspace</Link> : <>
            <Link to="/login" className="px-3 py-2 text-[14px] text-secondary no-underline hover:underline">Log in</Link>
            <Link to="/signup" className={primary}>Sign up</Link>
          </>}
        </div>
      </nav>
    </header>
    <main className="flex-1">
      <section className="mx-auto mt-20 mb-16 max-w-[780px] px-6 text-center max-[800px]:mt-12">
        <p className="mb-3.5 text-[12px] font-semibold tracking-[0.08em] text-secondary uppercase">Real estate, organized</p>
        <h1 className="m-0 mb-4 font-display text-[46px] leading-[1.15] font-medium tracking-[-0.025em] text-ink max-[800px]:text-[34px]">Manage listings, leads, and deals in one place.</h1>
        <p className="mx-auto mb-8 max-w-[630px] text-[16px] leading-[1.7] text-ink-soft">Meridian brings agents, sellers, and buyers into a single workspace — track every listing from first contact to closing.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className={primary} to={destination}>{user ? 'Go to dashboard' : 'Create your account'}</Link>
          {!user && <Link className={secondary} to="/login">Log in</Link>}
        </div>
      </section>
      <section id="features" aria-label="Workspaces for every role" className="mx-auto mb-20 grid max-w-[1088px] grid-cols-3 gap-5 px-6 max-[800px]:grid-cols-1">
        {features.map(feature => <article key={feature.role} id={feature.role === 'agent' ? 'agents' : undefined} className="rounded-[12px] border border-line bg-surface p-7 shadow-panel">
          <div aria-hidden="true" className="mb-4 flex size-10 items-center justify-center rounded-[10px] bg-sky-dim text-[17px] font-bold text-secondary">{feature.letter}</div>
          <h2 className="m-0 mb-2 text-[17px] font-semibold text-ink">{feature.title}</h2>
          <p className="mb-4 text-[13.5px] leading-[1.65] text-ink-soft">{feature.description}</p>
          <Link className="text-[13.5px] font-semibold text-secondary no-underline hover:underline" to={user ? destination : `/signup?role=${feature.role}`}>{user ? 'Open workspace' : `Sign up as ${feature.role}`} →</Link>
        </article>)}
      </section>
    </main>
    <footer className="flex flex-wrap justify-between gap-3 border-t border-line px-12 py-6 text-[12px] text-ink-faint max-[800px]:px-5">
      <span>© 2026 Meridian CRM</span><span>A workspace for agents, buyers, and sellers</span>
    </footer>
  </div>
}
