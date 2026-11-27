import { createCrudService } from '../http/createCrudService'
import type { RoleCreateRequest, RoleResponse, RoleUpdateRequest } from './types'

export const rolesService = createCrudService<
  RoleResponse,
  RoleCreateRequest,
  RoleUpdateRequest
>('/api/Roles')
