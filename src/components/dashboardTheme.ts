export type DashboardAccent = 'forest' | 'sky' | 'brass'

export const dashboardAccentClasses = {
  forest: {
    text: 'text-secondary',
    navigation: 'bg-secondary text-on-secondary',
    avatar: 'bg-primary',
  },
  sky: {
    text: 'text-sky',
    navigation: 'bg-secondary text-on-secondary',
    avatar: 'bg-primary',
  },
  brass: {
    text: 'text-secondary',
    navigation: 'bg-secondary text-on-secondary',
    avatar: 'bg-primary',
  },
} satisfies Record<DashboardAccent, { text: string; navigation: string; avatar: string }>
