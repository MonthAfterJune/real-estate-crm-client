export type ContactType = 'Buyer' | 'Seller' | 'Both'
export type ContactSource = 'Walk-in' | 'Referral' | 'Website' | 'Facebook' | 'Phone' | 'Other'
export type ContactCreateRequest = {
  type: ContactType
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  source: ContactSource
  ownerId?: number
  isManuallyInactive?: boolean
}
export type ContactUpdateRequest = ContactCreateRequest & { ownerId: number; isManuallyInactive: boolean }
export type ContactResponse = {
  id: number
  type: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  isManuallyInactive: boolean
  status: string
  source: string
  ownerId: number
  owner: { id: number; fullName: string } | null
}
