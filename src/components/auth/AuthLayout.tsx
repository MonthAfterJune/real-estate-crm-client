import type { ReactNode } from 'react'
import { Link } from 'react-router'
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-10 text-left">
    <Link to="/" className="mb-7 font-display text-[24px] font-semibold text-ink no-underline">
      Meridian <span className="font-sans text-[11px] font-normal text-ink-faint">CRM</span>
    </Link>
    <section className="box-border w-full max-w-[440px] rounded-[14px] border border-line bg-surface p-8 shadow-panel max-[480px]:p-6">
      <h1 className="m-0 font-display text-[25px] font-medium text-ink">{title}</h1>
      <p className="mt-1.5 mb-6 text-[13.5px] leading-relaxed text-ink-soft">{subtitle}</p>
      {children}
    </section>
    <Link to="/" className="mt-6 text-[13px] text-secondary no-underline hover:underline">← Back to home</Link>
  </main>
}
