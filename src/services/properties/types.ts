export type PropertyStatus = 'Draft' | 'Available' | 'Reserved' | 'Sold' | 'Withdrawn'
export type PropertyCreateRequest = {
  address: string
  city: string
  propertyType: string
  price: number | null
  status?: 'Draft'
  bedrooms: number | null
  sellerContactId: number
  listingAgentId?: number
}
export type PropertyUpdateRequest = Omit<PropertyCreateRequest, 'status' | 'listingAgentId'> & { status: PropertyStatus; listingAgentId: number }
export type PropertySellerContactResponse = { id: number; firstName: string; lastName: string; type: string }
export type PropertyListingAgentResponse = { id: number; fullName: string; email: string }
export type PropertyResponse = {
  id: number
  address: string
  city: string
  propertyType: string
  price: number | null
  status: string
  bedrooms: number | null
  sellerContactId: number
  sellerContact: PropertySellerContactResponse | null
  listingAgentId: number
  listingAgent: PropertyListingAgentResponse | null
}
