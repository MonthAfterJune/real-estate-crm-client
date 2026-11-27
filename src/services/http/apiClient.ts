export type RequestOptions = { signal?: AbortSignal }
type ApiRequestOptions = RequestOptions & { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown }
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  readonly validationErrors: Record<string, string[]>
  constructor(status: number, statusText: string, body: unknown) {
    const problem = isRecord(body) ? body : undefined
    super(typeof problem?.detail === 'string' ? problem.detail : typeof problem?.title === 'string'
      ? problem.title : `Request failed (${status}${statusText ? ` ${statusText}` : ''})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.validationErrors = isRecord(problem?.errors) ? Object.fromEntries(Object.entries(problem.errors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every(m => typeof m === 'string'),
    )) : {}
  }
}
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
let csrfPromise: Promise<string> | undefined
export function resetCsrfToken() { csrfPromise = undefined }
async function readError(response: Response) {
  const text = await response.text()
  let body: unknown = text
  try { body = JSON.parse(text) } catch { /* Preserve proxy/plain-text errors. */ }
  return new ApiError(response.status, response.statusText, body)
}
function csrfToken(): Promise<string> {
  if (!csrfPromise) {
    csrfPromise = fetch(`${apiBaseUrl}/api/auth/csrf`, { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) throw await readError(response)
        const data: { token: string } = await response.json()
        return data.token
      }).catch(error => { resetCsrfToken(); throw error })
  }
  return csrfPromise
}
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const route = path.replace(/^\/+/, '')
  const method = options.method ?? 'GET'
  const unsafe = method !== 'GET'
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = unsafe ? await csrfToken() : undefined
    const response = await fetch(`${apiBaseUrl}/${route}`, {
      method, credentials: 'include', signal: options.signal,
      headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'X-CSRF-TOKEN': token } : {}) },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
    if (!response.ok) {
      const error = await readError(response)
      // CSRF rejection occurs before the controller runs, so this one retry cannot duplicate a write.
      if (attempt === 0 && unsafe && error.status === 400 && isRecord(error.body) && error.body.code === 'csrf_token_invalid') {
        resetCsrfToken()
        continue
      }
      if (error.status === 401 && !route.startsWith('api/auth/')) window.dispatchEvent(new Event('meridian:session-expired'))
      throw error
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
  throw new Error('Unable to complete the request.')
}
