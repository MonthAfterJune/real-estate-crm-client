import { createCrudService } from '../http/createCrudService'
import { apiRequest } from '../http/apiClient'
import type { RequestOptions } from '../http/apiClient'
import type { OpportunityCommissionRateRequest, OpportunityCreateRequest, OpportunityLostRequest, OpportunityReopenRequest, OpportunityResponse, OpportunityUpdateRequest, OpportunityWonRequest } from './types'

const crud = createCrudService<
  OpportunityResponse,
  OpportunityCreateRequest,
  OpportunityUpdateRequest
>('/api/Opportunities')

export const opportunitiesService = {
  ...crud,
  won: (id: number, request: OpportunityWonRequest, options?: RequestOptions) =>
    apiRequest<OpportunityResponse>(`/api/Opportunities/${id}/won`, { ...options, method: 'POST', body: request }),
  lost: (id: number, request: OpportunityLostRequest, options?: RequestOptions) =>
    apiRequest<OpportunityResponse>(`/api/Opportunities/${id}/lost`, { ...options, method: 'POST', body: request }),
  setCommissionRate: (id: number, request: OpportunityCommissionRateRequest, options?: RequestOptions) =>
    apiRequest<OpportunityResponse>(`/api/Opportunities/${id}/commission-rate`, { ...options, method: 'PUT', body: request }),
  reopen: (id: number, request: OpportunityReopenRequest, options?: RequestOptions) =>
    apiRequest<OpportunityResponse>(`/api/Opportunities/${id}/reopen`, { ...options, method: 'POST', body: request }),
}
