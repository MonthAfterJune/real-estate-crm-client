import Pill from './Pill'
import type { PillTone } from './Pill'

const statusLabels = {
  active: 'Active',
  available: 'Available',
  draft: 'Draft',
  withdrawn: 'Withdrawn',
  reserved: 'Reserved',
  sold: 'Sold',
}

const statusTones = {
  active: 'forest',
  available: 'forest',
  draft: 'sky',
  withdrawn: 'brick',
  reserved: 'brass',
  sold: 'brick',
} satisfies Record<keyof typeof statusLabels, PillTone>

type StatusPillProps = {
  status: keyof typeof statusLabels
}

export default function StatusPill({ status }: StatusPillProps) {
  return <Pill tone={statusTones[status]}>{statusLabels[status]}</Pill>
}

