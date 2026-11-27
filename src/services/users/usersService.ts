import { createCrudService } from '../http/createCrudService'
import type { UserCreateRequest, UserResponse, UserUpdateRequest } from './types'

export const usersService = createCrudService<
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest
>('/api/Users')
