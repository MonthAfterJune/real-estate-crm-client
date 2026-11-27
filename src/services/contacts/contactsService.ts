import { createCrudService } from '../http/createCrudService'
import type { ContactCreateRequest, ContactResponse, ContactUpdateRequest } from './types'

export const contactsService = createCrudService<
  ContactResponse,
  ContactCreateRequest,
  ContactUpdateRequest
>('/api/Contacts')
