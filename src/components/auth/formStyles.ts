import { ApiError } from '../../services/http/apiClient'
export const inputClasses = 'box-border w-full rounded-[8px] border border-line bg-surface px-3 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'
export const labelClasses = 'flex flex-col gap-1.5 text-[13px] text-ink-soft'
export const submitClasses = 'w-full cursor-pointer rounded-[8px] border border-secondary bg-secondary px-4 py-3 font-sans text-[14px] font-semibold text-on-secondary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-60'
export function authError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.'
    const validation = [...new Set(Object.values(error.validationErrors).flat())]
    return validation.length ? validation.join(' ') : error.message
  }
  return 'We could not connect. Please try again.'
}
