import { createCrudService } from '../http/createCrudService'
import type { ActivityCreateRequest, ActivityResponse, ActivityUpdateRequest } from './types'

export const activitiesService = createCrudService<
  ActivityResponse,
  ActivityCreateRequest,
  ActivityUpdateRequest
>('/api/Activities')
