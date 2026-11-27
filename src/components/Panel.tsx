import { useId } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { dashboardAccentClasses } from './dashboardTheme'
import type { DashboardAccent } from './dashboardTheme'

type PanelProps = {
  title: string
  action?: { label: string; to?: string }
  accent?: DashboardAccent
  children: ReactNode
}

export default function Panel({ title, action, accent = 'forest', children }: PanelProps) {
  const titleId = useId()
  const actionClasses = `shrink-0 border-0 bg-transparent p-0 font-sans text-[12.5px] font-semibold no-underline ${dashboardAccentClasses[accent].text}`

  return (
    <section aria-labelledby={titleId} className="min-w-0 overflow-hidden rounded-md border border-line bg-surface shadow-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-surface-muted px-4.5 pt-4 pb-3.5">
        <h2 id={titleId} className="m-0 text-[14.5px] font-semibold text-ink">{title}</h2>
        {action && (action.to ? (
          <Link className={actionClasses} to={action.to}>{action.label}</Link>
        ) : (
          <button type="button" className={`${actionClasses} cursor-default`} disabled title="Coming soon">
            {action.label}
          </button>
        ))}
      </div>
      {children}
    </section>
  )
}
