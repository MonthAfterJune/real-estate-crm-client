import { apiRequest } from './apiClient'
import type { RequestOptions } from './apiClient'

export function createCrudService<TResponse, TCreateRequest, TUpdateRequest>(path: string) {
  return {
    getAll: (options?: RequestOptions) =>
      apiRequest<TResponse[]>(path, options),

    getById: (id: number, options?: RequestOptions) =>
      apiRequest<TResponse>(`${path}/${id}`, options),

    create: (request: TCreateRequest, options?: RequestOptions) =>
      apiRequest<TResponse>(path, { ...options, method: 'POST', body: request }),

    // The backend expects the full update DTO, not a partial PATCH payload.
    update: (id: number, request: TUpdateRequest, options?: RequestOptions) =>
      apiRequest<TResponse>(`${path}/${id}`, { ...options, method: 'PUT', body: request }),

    delete: (id: number, options?: RequestOptions) =>
      apiRequest<void>(`${path}/${id}`, { ...options, method: 'DELETE' }),
  }
}
