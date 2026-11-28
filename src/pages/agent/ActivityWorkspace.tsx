import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import { activitiesService, opportunitiesService, pipelineStagesService } from '../../services'
import type { ActivityCreateRequest, ActivityFollowUpResponse, ActivityResponse, OpportunityResponse, PipelineStageResponse } from '../../services'
import { assignedAgentsService } from '../../services/users/assignedAgentsService'
import type { AssignedAgent } from '../../services/users/assignedAgentsService'
import { isStaffManager } from '../../routes/roles'
import { activityTime, localDateTime, workflowError } from './workflowHelpers'
import OpportunityHistory from './OpportunityHistory'

export type ActivityTarget = { contactId: number; opportunityId?: number | null; propertyId?: number | null }
const field = 'w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-secondary'
const label = 'flex min-w-0 flex-col gap-1.5 text-[13px] text-ink-soft'
const button = 'cursor-pointer rounded-sm border px-4 py-2 text-[13px] font-semibold disabled:opacity-50'
const payload = (row: ActivityResponse): ActivityCreateRequest => ({ type: row.type, subject: row.subject, details: row.details ?? null, contactId: row.contactId,
  opportunityId: row.opportunityId ?? null, propertyId: row.propertyId ?? null, userId: row.userId, scheduledAt: row.scheduledAt ?? null, completedAt: row.completedAt ?? null })

export default function ActivityWorkspace({ target, submitLabel = 'Save activity', onChanged, selectedActivityId }: {
  target: ActivityTarget; submitLabel?: string; onChanged?: () => void | Promise<void>; selectedActivityId?: number
}) {
  const { user } = useAuth(), manager = isStaffManager(user?.role)
  const [rows, setRows] = useState<ActivityResponse[]>([]), [agents, setAgents] = useState<AssignedAgent[]>([])
  const [stages, setStages] = useState<PipelineStageResponse[]>([]), [followUp, setFollowUp] = useState<ActivityFollowUpResponse | null>(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [refreshError, setRefreshError] = useState('')
  const [saving, setSaving] = useState(false), [retry, setRetry] = useState(0), [editing, setEditing] = useState<ActivityResponse | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null), [timing, setTiming] = useState(manager ? 'scheduled' : 'completed')
  const [assignee, setAssignee] = useState(String(user?.id ?? '')), [formVersion, setFormVersion] = useState(0)
  const [progression, setProgression] = useState<{ opportunity: OpportunityResponse; stageId: number } | null>(null)
  const [progressionRetry, setProgressionRetry] = useState<number | null>(null), [progressionNotice, setProgressionNotice] = useState('')
  const savingRef = useRef(false), mounted = useRef(true)
  const { contactId, propertyId = null, opportunityId = null } = target
  const matches = (row: ActivityResponse) => opportunityId != null ? row.opportunityId === opportunityId
    : propertyId != null ? row.propertyId === propertyId && row.opportunityId == null
      : row.contactId === contactId

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController(), options = { signal: controller.signal }
    Promise.all([activitiesService.getAll(options), assignedAgentsService.getAll(options), pipelineStagesService.getAll(options), activitiesService.followUp(options)])
      .then(([items, agentRows, stageRows, snapshot]) => { if (!controller.signal.aborted) { setRows(items); setAgents(agentRows); setStages(stageRows); setFollowUp(snapshot); setAssignee(current => agentRows.some(agent => String(agent.id) === current) ? current : String(agentRows[0]?.id ?? '')) } })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setError(workflowError(failure, 'Unable to load activities.')) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { mounted.current = false; controller.abort() }
  }, [contactId, propertyId, opportunityId, retry])

  async function refresh() {
    try {
      const [items, snapshot] = await Promise.all([activitiesService.getAll(), activitiesService.followUp()])
      if (!mounted.current) return
      setRows(items); setFollowUp(snapshot); await onChanged?.(); setRefreshError('')
    } catch { if (mounted.current) setRefreshError('Your change was saved, but the latest follow-up details could not be refreshed.') }
  }
  async function mutate(work: () => Promise<void>) {
    if (savingRef.current) return
    savingRef.current = true; setSaving(true); setError('')
    try { await work() } catch (failure) { if (mounted.current) setError(workflowError(failure, 'Unable to save activity.')) }
    finally { savingRef.current = false; if (mounted.current) setSaving(false) }
  }
  function resetForm() { setEditing(null); setTiming(manager ? 'scheduled' : 'completed'); setAssignee(String(user?.id ?? agents[0]?.id ?? '')); setFormVersion(n => n + 1) }
  function edit(row: ActivityResponse) { setEditing(row); setTiming(row.completedAt ? 'completed' : 'scheduled'); setAssignee(String(row.userId)); setFormVersion(n => n + 1); setError('') }
  async function checkViewing(row: ActivityResponse) {
    if (row.type !== 'Viewing' || !row.completedAt || !row.opportunityId) return
    setProgression(null); setProgressionRetry(row.opportunityId); setProgressionNotice('')
    try {
      const opportunity = await opportunitiesService.getById(row.opportunityId), viewing = stages.find(stage => stage.code === 'VIEWING')
      const current = stages.find(stage => stage.id === opportunity.stageId)
      if (opportunity.status === 'Open' && viewing && current && current.sortOrder < viewing.sortOrder) setProgression({ opportunity, stageId: viewing.id })
      setProgressionRetry(null)
    } catch { setProgressionNotice('Viewing completed, but progression details could not be loaded. The completed activity is saved.') }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return
    const data = new FormData(event.currentTarget)
    const date = (name: string) => String(data.get(name) ?? '').trim() ? new Date(String(data.get(name))).toISOString() : null
    const retainedDate = (name: string, stored?: string | null) => stored && String(data.get(name)) === localDateTime(new Date(stored)) ? stored : date(name)
    const request: ActivityCreateRequest = {
      type: String(data.get('type')), subject: String(data.get('subject')).trim(), details: String(data.get('details')).trim() || null,
      contactId: editing?.contactId ?? contactId, propertyId: editing?.propertyId ?? propertyId, opportunityId: editing?.opportunityId ?? opportunityId,
      userId: editing?.completedAt ? editing.userId : timing === 'completed' ? user.id : Number(assignee),
      scheduledAt: editing ? retainedDate('scheduledAt', editing.scheduledAt) : timing === 'scheduled' ? date('time') : null,
      completedAt: editing ? editing.completedAt ? retainedDate('completedAt', editing.completedAt) : null : timing === 'completed' ? date('time') : null,
    }
    void mutate(async () => {
      const row = editing ? await activitiesService.update(editing.id, request) : await activitiesService.create(request)
      setRows(items => [...items.filter(item => item.id !== row.id), row]); resetForm()
      if (!editing && row.completedAt) await checkViewing(row)
      await refresh()
    })
  }
  function complete(row: ActivityResponse) {
    void mutate(async () => {
      const updated = await activitiesService.update(row.id, { ...payload(row), completedAt: new Date().toISOString() })
      setRows(items => items.map(item => item.id === updated.id ? updated : item))
      await checkViewing(updated); await refresh()
    })
  }
  const visibleRows = rows.filter(matches).sort((a, b) => activityTime(b).localeCompare(activityTime(a)))
  const ordinary = visibleRows.filter(row => !row.isSystemGenerated)
  return <section aria-label="Activities" className="min-w-0 space-y-4">
    <h2 className="text-[14px] font-semibold">Activities</h2>
    {loading && <p role="status" className="text-[13px]">Loading activities…</p>}
    {error && <p role="alert" className="text-[13px] text-brick">{error} <button type="button" disabled={saving} onClick={() => { setError(''); setLoading(true); setRetry(n => n + 1) }} className="text-secondary underline">Reload activities</button></p>}
    {refreshError && <p role="status" className="text-[13px]">{refreshError} <button type="button" disabled={saving} onClick={() => { void mutate(refresh) }} className="text-secondary underline">Refresh</button></p>}
    {progressionNotice && <p role="status" className="text-[13px]">{progressionNotice} {progressionRetry && <button type="button" disabled={saving} onClick={() => { const row = rows.find(item => item.opportunityId === progressionRetry && item.type === 'Viewing' && item.completedAt); if (row) void checkViewing(row) }} className="text-secondary underline">Check progression</button>}</p>}
    {progression && <div role="region" aria-label="Viewing progression" className="rounded-sm border border-line p-3 text-[13px]"><p>Viewing completed. Move this opportunity to Viewing?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => { void mutate(async () => { const { opportunity, stageId } = progression; await opportunitiesService.update(opportunity.id, { buyerContactId: opportunity.buyerContactId, propertyId: opportunity.propertyId, agentId: opportunity.agentId, stageId, offerAmount: opportunity.offerAmount }); setProgression(null); await refresh() }) }} className={`${button} border-secondary text-secondary`}>Move to Viewing</button><button type="button" disabled={saving} onClick={() => setProgression(null)} className={`${button} border-line`}>Keep current stage</button></div></div>}
    <form key={formVersion} onSubmit={save} className="space-y-3"><fieldset disabled={saving || loading} className="grid min-w-0 grid-cols-2 gap-3 border-0 p-0 compact:grid-cols-1">
      <label className={label}>Activity type<select name="type" defaultValue={editing?.type ?? 'Call'} className={field}>{['Call', 'Email', 'Meeting', ...(opportunityId || editing?.opportunityId ? ['Viewing'] : []), 'Task'].map(type => <option key={type}>{type}</option>)}</select></label>
      <label className={label}>Subject<input name="subject" required maxLength={200} pattern=".*\S.*" defaultValue={editing?.subject ?? ''} className={field} /></label>
      <label className={label}>Details<textarea name="details" defaultValue={editing?.details ?? ''} className={field} /></label>
      {!editing && <label className={label}>Timing<select value={timing} onChange={event => setTiming(event.target.value)} className={field}><option value="completed" disabled={manager}>Completed interaction</option><option value="scheduled">Scheduled task</option></select></label>}
      {editing ? <><label className={label}>Scheduled at<input name="scheduledAt" type="datetime-local" defaultValue={editing.scheduledAt ? localDateTime(new Date(editing.scheduledAt)) : ''} required={!editing.completedAt} className={field} /></label>{editing.completedAt && <label className={label}>Completed at<input name="completedAt" required type="datetime-local" defaultValue={localDateTime(new Date(editing.completedAt))} className={field} /></label>}</>
        : <label className={label}>{timing === 'completed' ? 'Completed at' : 'Scheduled at'}<input name="time" required type="datetime-local" defaultValue={localDateTime()} className={field} /></label>}
      <label className={label}>Assigned agent{editing?.completedAt || !editing && timing === 'completed' ? <input readOnly value={editing ? agents.find(agent => agent.id === editing.userId)?.fullName ?? `Agent #${editing.userId}` : user?.fullName ?? ''} className={field} /> : <select required value={assignee} onChange={event => setAssignee(event.target.value)} className={field}><option value="">Select an active agent</option>{editing && !agents.some(agent => agent.id === editing.userId) && <option value={editing.userId}>Agent #{editing.userId}</option>}{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}</select>}{editing && !editing.completedAt && <span className="text-[11px]">Save reassignment first. Only the saved assignee can complete this work.</span>}</label>
    </fieldset><div className="flex flex-wrap gap-2"><button disabled={saving || loading} className={`${button} border-secondary bg-secondary text-on-secondary`}>{editing ? 'Save changes' : submitLabel}</button>{editing && <button type="button" disabled={saving} onClick={resetForm} className={`${button} border-line`}>Cancel edit</button>}</div></form>
    <h3 className="text-[14px] font-semibold">Activity history</h3>
    <ul className="space-y-3">{ordinary.map(row => { const maintain = manager || row.createdById === user?.id; const overdue = !row.completedAt && row.scheduledAt && followUp && new Date(row.scheduledAt).getTime() < new Date(followUp.asOfUtc).getTime(); return <li key={row.id} data-activity-id={row.id} className={`min-w-0 rounded-sm border p-3 text-[13px] wrap-anywhere ${selectedActivityId === row.id ? 'border-secondary' : 'border-line'}`}><p className="font-semibold">{row.type} · {row.subject}</p>{row.details && <p className="mt-1 whitespace-pre-wrap">{row.details}</p>}<p className="mt-1 text-ink-soft">{row.completedAt ? 'Completed' : overdue ? 'Overdue' : 'Scheduled'} · {new Date(activityTime(row)).toLocaleString()}</p><p className="text-[12px] text-ink-soft">Assigned Agent #{row.userId} · Author User #{row.createdById}</p><div className="mt-2 flex flex-wrap gap-3">{!row.completedAt && row.userId === user?.id && <button type="button" disabled={saving} onClick={() => complete(row)} className="text-secondary underline">Complete task</button>}{maintain && <><button type="button" disabled={saving} onClick={() => edit(row)} className="text-secondary underline">Edit activity</button><button type="button" disabled={saving} onClick={() => setDeleting(row.id)} className="text-secondary underline">Delete activity</button></>}</div>{deleting === row.id && <div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={saving} onClick={() => { void mutate(async () => { await activitiesService.delete(row.id); setRows(items => items.filter(item => item.id !== row.id)); setDeleting(null); if (editing?.id === row.id) resetForm(); await refresh() }) }} className="text-brick underline">Confirm delete</button><button type="button" disabled={saving} onClick={() => setDeleting(null)} className="text-secondary underline">Cancel delete</button></div>}</li> })}</ul>
    {visibleRows.some(row => row.isSystemGenerated) && <OpportunityHistory activities={visibleRows.filter(row => row.isSystemGenerated)} stages={stages} />}
    {!loading && !visibleRows.length && <p className="text-[13px] text-ink-soft">No activities yet.</p>}
  </section>
}
