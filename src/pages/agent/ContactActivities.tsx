import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import Panel from '../../components/Panel'
import { activitiesService, contactName, opportunitiesService, pipelineStagesService } from '../../services'
import type { ActivityResponse, ContactResponse, OpportunityResponse } from '../../services'
import type { AssignedAgent } from '../../services/users/assignedAgentsService'
import { isStaffManager } from '../../routes/roles'
import { activityTime, localDateTime, workflowError } from './workflowHelpers'

const field = 'w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-secondary'
const label = 'flex min-w-0 flex-col gap-1.5 text-[13px] text-ink-soft'
const button = 'cursor-pointer rounded-sm border px-4 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50'

export default function ContactActivities({ contact, agents, onClose }: { contact: ContactResponse; agents: AssignedAgent[]; onClose: () => void }) {
  const { user } = useAuth()
  const [rows, setRows] = useState<ActivityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [progression, setProgression] = useState<{ opportunity: OpportunityResponse; viewingStageId: number } | null>(null)
  const [progressionCheck, setProgressionCheck] = useState<number | null>(null)
  const [progressionWarning, setProgressionWarning] = useState('')
  const [timing, setTiming] = useState(isStaffManager(user?.role) ? 'scheduled' : 'completed')
  const [assignee, setAssignee] = useState(String(isStaffManager(user?.role) ? contact.ownerId : user?.id ?? ''))
  const savingRef = useRef(false)
  const manager = isStaffManager(user?.role)

  useEffect(() => {
    const controller = new AbortController()
    activitiesService.getAll({ signal: controller.signal }).then(items => { if (!controller.signal.aborted) setRows(items.filter(item => item.contactId === contact.id)) })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(workflowError(failure, 'Unable to load activities.')) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [contact.id, retry])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || !user) return
    const form = event.currentTarget
    const data = new FormData(form)
    savingRef.current = true; setSaving(true); setError('')
    try {
      const date = new Date(String(data.get('time'))).toISOString()
      const created = await activitiesService.create({ type: String(data.get('type')), subject: String(data.get('subject')).trim(), details: String(data.get('details')).trim() || null,
        contactId: contact.id, userId: timing === 'completed' ? user.id : Number(assignee), opportunityId: null, propertyId: null,
        completedAt: timing === 'completed' ? date : null, scheduledAt: timing === 'scheduled' ? date : null })
      setRows(items => [...items, created]); form.reset(); setTiming(manager ? 'scheduled' : 'completed')
    } catch (failure) { setError(workflowError(failure, 'Unable to save activity.')) }
    finally { savingRef.current = false; setSaving(false) }
  }

  async function complete(activity: ActivityResponse) {
    if (savingRef.current || activity.userId !== user?.id) return
    savingRef.current = true; setSaving(true); setError('')
    try {
      const updated = await activitiesService.update(activity.id, { type: activity.type, subject: activity.subject, details: activity.details ?? null, contactId: activity.contactId,
        userId: activity.userId, opportunityId: activity.opportunityId ?? null, propertyId: activity.propertyId ?? null,
        scheduledAt: activity.scheduledAt ?? null, completedAt: new Date().toISOString() })
      setRows(items => items.map(item => item.id === updated.id ? updated : item))
      if (updated.type === 'Viewing' && updated.completedAt && updated.opportunityId) await checkProgression(updated.opportunityId)
    } catch (failure) { setError(workflowError(failure, 'Unable to complete task.')) }
    finally { savingRef.current = false; setSaving(false) }
  }

  async function checkProgression(opportunityId: number) {
    setProgression(null); setProgressionWarning(''); setProgressionCheck(opportunityId)
    try {
      const [opportunity, stages] = await Promise.all([opportunitiesService.getById(opportunityId), pipelineStagesService.getAll()])
      const current = stages.find(stage => stage.id === opportunity.stageId)
      const viewing = stages.find(stage => stage.code === 'VIEWING')
      if (opportunity.status === 'Open' && current && viewing && current.sortOrder < viewing.sortOrder) setProgression({ opportunity, viewingStageId: viewing.id })
      setProgressionCheck(null)
    } catch {
      setProgressionWarning('Viewing completed, but progression details could not be loaded. The completed activity is saved.')
    }
  }

  async function moveToViewing() {
    if (!progression || savingRef.current) return
    savingRef.current = true; setSaving(true); setError('')
    try {
      const { opportunity, viewingStageId } = progression
      await opportunitiesService.update(opportunity.id, { buyerContactId: opportunity.buyerContactId, propertyId: opportunity.propertyId,
        agentId: opportunity.agentId, stageId: viewingStageId, offerAmount: opportunity.offerAmount })
      setProgression(null)
      setProgressionWarning('Opportunity moved to Viewing. The completed activity remains saved.')
    } catch (failure) { setError(workflowError(failure, 'The Viewing is completed, but the opportunity could not move.')) }
    finally { savingRef.current = false; setSaving(false) }
  }

  return <Panel title={`Activities · ${contactName(contact)}`}><div className="space-y-5 p-5">
    <div className="flex flex-wrap justify-between gap-3"><p className="text-[13px] text-ink-soft">Record qualification before opening an opportunity. These entries attach to this Contact only.</p><button type="button" disabled={saving} onClick={onClose} className="cursor-pointer border-0 bg-transparent text-secondary underline">Close activities</button></div>
    {loading && <p role="status" className="text-[13px] text-ink-soft">Loading activities…</p>}
    {error && <p role="alert" className="text-[13px] text-brick">{error} <button type="button" disabled={saving} onClick={() => { setError(''); setLoading(true); setRetry(n => n + 1) }} className="text-secondary underline">Reload activities</button></p>}
    {progressionWarning && <p role="status" className="text-[13px] text-ink-soft">{progressionWarning} {progressionCheck && <button type="button" disabled={saving} onClick={() => { void checkProgression(progressionCheck) }} className="text-secondary underline">Check progression</button>}</p>}
    {progression && <div role="region" aria-label="Viewing progression" className="rounded-sm border border-line p-3"><p className="text-[13px]">Viewing completed. Move this opportunity to Viewing?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => { void moveToViewing() }} className={`${button} border-secondary bg-secondary text-on-secondary`}>Move to Viewing</button><button type="button" disabled={saving} onClick={() => setProgression(null)} className={`${button} border-line`}>Keep current stage</button></div></div>}
    <form onSubmit={save} aria-busy={saving} className="space-y-4">
      <fieldset disabled={saving || loading} className="grid min-w-0 grid-cols-2 gap-4 border-0 p-0 compact:grid-cols-1">
        <label className={label}>Activity type<select name="type" defaultValue="Call" className={field}>{['Call', 'Email', 'Meeting', 'Task'].map(type => <option key={type}>{type}</option>)}</select></label>
        <label className={label}>Subject<input name="subject" required maxLength={200} pattern=".*\S.*" className={field} /></label>
        <label className={label}>Details<textarea name="details" className={`${field} min-h-20`} /></label>
        <label className={label}>Timing<select value={timing} onChange={event => setTiming(event.target.value)} className={field}><option value="completed" disabled={manager}>Completed interaction</option><option value="scheduled">Scheduled task</option></select>{manager && <span className="text-[11px]">Schedule for an Agent; only the assigned Agent records completion.</span>}</label>
        <label className={label}>{timing === 'completed' ? 'Completed at' : 'Scheduled at'}<input key={timing} name="time" type="datetime-local" required defaultValue={localDateTime()} className={field} /></label>
        {timing === 'scheduled' && manager ? <label className={label}>Assigned agent<select required value={assignee} onChange={event => setAssignee(event.target.value)} className={field}><option value="">Select an active agent</option>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}</select></label>
          : <label className={label}>Assigned agent<input readOnly value={user?.fullName ?? ''} className={field} /><span className="text-[11px]">{timing === 'completed' ? 'You performed this interaction.' : 'You are responsible for this task.'}</span></label>}
      </fieldset>
      <button type="submit" disabled={saving || loading} className={`${button} border-secondary bg-secondary text-on-secondary`}>{saving ? 'Saving…' : 'Save activity'}</button>
    </form>
    <div><h3 className="mb-3 text-[14px] font-semibold">Activity history</h3><ul className="space-y-3">{rows.slice().sort((a, b) => activityTime(b).localeCompare(activityTime(a))).map(activity => <li key={activity.id} className="rounded-sm border border-line p-3 text-[13px]">
      <p className="font-semibold">{activity.type} · {activity.subject}</p><p className="mt-1 text-ink-soft">{activity.completedAt ? 'Completed' : 'Scheduled'} · {new Date(activityTime(activity)).toLocaleString()}</p>
      {activity.details && <p className="mt-2 whitespace-pre-wrap wrap-anywhere">{activity.details}</p>}
      {!activity.completedAt && !activity.isSystemGenerated && activity.userId === user?.id && <button type="button" disabled={saving} onClick={() => { void complete(activity) }} className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-secondary underline">Complete task</button>}
    </li>)}</ul>{!loading && rows.length === 0 && <p className="text-[13px] text-ink-soft">No activities yet.</p>}</div>
  </div></Panel>
}
