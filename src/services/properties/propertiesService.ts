import { createCrudService } from '../http/createCrudService'
import type { PropertyCreateRequest, PropertyResponse, PropertyUpdateRequest } from './types'

export const propertiesService = createCrudService<
  PropertyResponse,
  PropertyCreateRequest,
  PropertyUpdateRequest
>('/api/Properties')
