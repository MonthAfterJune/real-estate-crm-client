export type PipelineStageCreateRequest = {
  name: string
  sortOrder: number
}

export type PipelineStageUpdateRequest = PipelineStageCreateRequest

export type PipelineStageResponse = {
  code: string
  id: number
  name: string
  sortOrder: number
}
