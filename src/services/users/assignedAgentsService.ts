import { usersService } from './usersService'
import type { RequestOptions } from '../http/apiClient'
import type { UserResponse } from './types'

export type AssignedAgent = Pick<UserResponse, 'id' | 'fullName'>

export const assignedAgentsService = {
  async getAll(options?: RequestOptions): Promise<AssignedAgent[]> {
    return (await usersService.getAll(options)).filter(user => user.isActive && user.role?.name.toLowerCase() === 'agent')
  },
}

