export type UserCreateRequest = {
  fullName: string
  email: string
  roleId: number
}

export type UserUpdateRequest = UserCreateRequest

export type UserRoleResponse = {
  id: number
  name: string
}

export type UserResponse = {
  isActive: boolean
  phone: string | null
  id: number
  fullName: string
  email: string
  roleId: number
  role: UserRoleResponse | null
}
