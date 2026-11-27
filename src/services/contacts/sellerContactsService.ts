import { contactsService } from './contactsService'
import type { RequestOptions } from '../http/apiClient'
import type { ContactResponse } from './types'

export const contactName = (contact: Pick<ContactResponse, 'firstName' | 'lastName'>) =>
  `${contact.firstName} ${contact.lastName}`.trim()
export const sellerContactsService = {
  async getAll(options?: RequestOptions): Promise<ContactResponse[]> {
    return (await contactsService.getAll(options))
      .filter(contact => contact.type === 'Seller' || contact.type === 'Both')
      .sort((a, b) => contactName(a).localeCompare(contactName(b)))
  },
}
