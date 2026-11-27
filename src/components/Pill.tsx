import type { ReactNode } from 'react'

const toneClasses = {
  forest: 'bg-forest-dim text-forest',
  sky: 'bg-sky-dim text-sky',
  brass: 'bg-brass-dim text-brass',
  brick: 'bg-brick-dim text-brick',
}

export type PillTone = keyof typeof toneClasses

type PillProps = {
  tone?: PillTone
  children: ReactNode
}

export default function Pill({ tone = 'sky', children }: PillProps) {
  return (
    <span className={`inline-flex w-fit items-center rounded-[20px] px-2.25 py-0.75 text-[11px] font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
