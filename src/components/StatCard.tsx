export type DashboardStat = {
  label: string
  value: string
  delta?: string
  deltaDirection?: 'up' | 'down'
}

export default function StatCard({ label, value, delta, deltaDirection = 'up' }: DashboardStat) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface shadow-panel px-4.5 py-4">
      <p className="mb-2.5 text-[12.5px] text-ink-soft">{label}</p>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-display text-[27px] font-medium">{value}</span>
        {delta && (
          <span className={`text-[12px] font-semibold ${deltaDirection === 'down' ? 'text-brick' : 'text-forest'}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}
