import { ApiError } from '../../services'
import type { ActivityResponse } from '../../services'

export const workflowError = (error: unknown, fallback: string) => error instanceof ApiError
  ? Object.values(error.validationErrors).flat().join(' ') || error.message : fallback
export function existingContactId(error: unknown): number | null {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return null
  const id = (error.body as Record<string, unknown>).existingContactId
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
}
export const activityTime = (activity: ActivityResponse) => activity.completedAt ?? activity.scheduledAt ?? activity.createdAt
export const localDateTime = (date = new Date()) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
