import type { ActivityResponse, PipelineStageResponse } from '../../services'
import { activityTime } from './workflowHelpers'

export default function OpportunityHistory({ activities, stages }: { activities: ActivityResponse[]; stages: PipelineStageResponse[] }) {
  return <ul className="mb-4 space-y-3 text-[13px]">{[...activities].sort((a, b) => activityTime(b).localeCompare(activityTime(a))).map(activity => {
    let description = activity.details
    if (activity.isSystemGenerated && activity.details) {
      try {
        const details: unknown = JSON.parse(activity.details)
        if (details && typeof details === 'object' && 'reason' in details && typeof details.reason === 'string') description = details.reason
      } catch { /* Retain readable legacy event text. */ }
    }
    const from = stages.find(stage => stage.id === activity.fromStageId)?.name
    const to = stages.find(stage => stage.id === activity.toStageId)?.name
    return <li key={activity.id} className="min-w-0 wrap-anywhere rounded-sm border border-line p-3">
      <span className="font-semibold">{activity.type === 'Stage Change' && from && to ? `${from} → ${to}` : `${activity.type} · ${activity.subject}`}</span>
      {description && <p className="mt-1 whitespace-pre-wrap">{description}</p>}
      <span className="mt-1 block text-[12px] text-ink-soft">{activity.completedAt ? 'Completed' : 'Scheduled'} · {new Date(activityTime(activity)).toLocaleString()}</span>
      {activity.isSystemGenerated && <span className="block text-[12px] text-ink-soft">Generated history · Responsible Agent #{activity.userId} · Initiated by User #{activity.createdById}</span>}
    </li>
  })}{!activities.length && <li className="text-ink-soft">No activity history yet.</li>}</ul>
}
