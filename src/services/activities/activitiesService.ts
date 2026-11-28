import { createCrudService } from '../http/createCrudService'
import { apiRequest } from '../http/apiClient'
import type { RequestOptions } from '../http/apiClient'
import type { ActivityCreateRequest, ActivityFollowUpResponse, ActivityResponse, ActivityUpdateRequest } from './types'

const crud = createCrudService<
  ActivityResponse,
  ActivityCreateRequest,
  ActivityUpdateRequest
>('/api/Activities')
export const activitiesService = { ...crud, followUp: (options?: RequestOptions) => apiRequest<ActivityFollowUpResponse>('/api/Activities/follow-up', options) }
