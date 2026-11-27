export type ActivityCreateRequest = {
  type: string
  subject: string
  details?: string | null
  contactId: number
  userId: number
  opportunityId?: number | null
  propertyId?: number | null
  scheduledAt?: string | null
  completedAt?: string | null
}
export type ActivityUpdateRequest = ActivityCreateRequest
export type ActivityResponse = ActivityCreateRequest & {
  id: number
  createdById: number
  isSystemGenerated: boolean
  fromStageId?: number | null
  toStageId?: number | null
  createdAt: string
  updatedAt: string | null
}
