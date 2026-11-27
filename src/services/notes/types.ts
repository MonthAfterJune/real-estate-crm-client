export type NoteCreateRequest = {
  authorId: number
  entityType: string
  entityId: number
  body: string
}

export type NoteUpdateRequest = NoteCreateRequest

export type NoteAuthorResponse = {
  id: number
  fullName: string
}

export type NoteResponse = {
  id: number
  authorId: number
  author: NoteAuthorResponse | null
  entityType: string
  entityId: number
  body: string
}
