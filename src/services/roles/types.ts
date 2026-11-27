export type RoleCreateRequest = {
  name: string
}

export type RoleUpdateRequest = RoleCreateRequest

export type RoleResponse = {
  id: number
  name: string
}
