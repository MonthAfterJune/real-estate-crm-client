import type { ReactNode } from 'react'
import Icon from './Icon'
import type { IconName } from './Icon'

export type ActivityItem = {
  id: string
  icon: IconName
  text: ReactNode
  time: string
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="m-0 list-none px-1.5 pt-1.5 pb-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex gap-2.75 rounded-sm px-3 py-2.75 hover:bg-line-soft">
          <div className="flex size-7.5 flex-none items-center justify-center rounded-full bg-line-soft text-ink-soft">
            <Icon name={item.icon} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] leading-[1.45] [&_b]:font-semibold">{item.text}</div>
            <div className="mt-0.5 text-[11.5px] text-ink-faint">{item.time}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
