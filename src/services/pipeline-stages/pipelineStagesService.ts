import { createCrudService } from '../http/createCrudService'
import type { PipelineStageCreateRequest, PipelineStageResponse, PipelineStageUpdateRequest } from './types'

export const pipelineStagesService = createCrudService<
  PipelineStageResponse,
  PipelineStageCreateRequest,
  PipelineStageUpdateRequest
>('/api/PipelineStages')
