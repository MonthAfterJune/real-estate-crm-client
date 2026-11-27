import { createCrudService } from '../http/createCrudService'
import type { NoteCreateRequest, NoteResponse, NoteUpdateRequest } from './types'

export const notesService = createCrudService<
  NoteResponse,
  NoteCreateRequest,
  NoteUpdateRequest
>('/api/Notes')
