export type OpportunityCreateRequest = {
  buyerContactId: number
  propertyId: number
  agentId?: number
  stageId?: number
  offerAmount: number | null
}

export type OpportunityUpdateRequest = OpportunityCreateRequest & { agentId: number; stageId: number }
export type OpportunityWonRequest = { finalPrice: number }
export type OpportunityLostRequest = { lostReason: string }
export type OpportunityCommissionRateRequest = { commissionRate: number }

export type OpportunityBuyerContactResponse = {
  id: number
  firstName: string
  lastName: string
  type: string
}

export type OpportunityPropertyResponse = {
  id: number
  address: string
  price: number | null
  status: string
}

export type OpportunityAgentResponse = {
  id: number
  fullName: string
  email: string
}

export type OpportunityStageResponse = {
  code: string
  id: number
  name: string
}

export type OpportunityResponse = {
  id: number
  buyerContactId: number
  buyerContact: OpportunityBuyerContactResponse | null
  propertyId: number
  property: OpportunityPropertyResponse | null
  agentId: number
  agent: OpportunityAgentResponse | null
  stageId: number
  stage: OpportunityStageResponse | null
  offerAmount: number | null
  status: 'Open' | 'Won' | 'Lost'
  commissionRate: number
  commissionAmount: number | null
  finalPrice: number | null
  lostReason: string | null
  closedAt: string | null
}
