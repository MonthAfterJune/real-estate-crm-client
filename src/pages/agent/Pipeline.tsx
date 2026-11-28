import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import Panel from '../../components/Panel'
import { useAuth } from '../../auth/useAuth'
import { activitiesService, contactName, contactsService, notesService, opportunitiesService, pipelineStagesService, propertiesService } from '../../services'
import type { ActivityResponse, ContactResponse, NoteResponse, OpportunityResponse, PipelineStageResponse, PropertyResponse } from '../../services'
import { assignedAgentsService } from '../../services/users/assignedAgentsService'
import type { AssignedAgent } from '../../services/users/assignedAgentsService'
import { isStaffManager } from '../../routes/roles'
import { workflowError } from './workflowHelpers'
import ActivityWorkspace from './ActivityWorkspace'

const field = 'w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-secondary'
const label = 'flex min-w-0 flex-col gap-1.5 text-[13px] text-ink-soft'
const button = 'cursor-pointer rounded-sm border px-4 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50'
const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const lostReasons = ['Price', 'Bought elsewhere', 'Financing', 'Changed mind', 'Property sold', 'No response', 'Other']

// Compare mathematical decimal values before sending JSON's number representation.
// This keeps a large entered price from silently losing cents in Number conversion.
function decimalKey(value: string): string | null {
  const match = value.trim().match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i)
  if (!match || !(match[2] || match[3])) return null
  const digits = `${match[2]}${match[3] ?? ''}`.replace(/^0+/, '')
  if (!digits) return '0'
  const coefficient = digits.replace(/0+$/, '')
  const exponent = Number(match[4] ?? 0) - (match[3]?.length ?? 0) + digits.length - coefficient.length
  return Number.isSafeInteger(exponent) ? `${match[1] === '-' ? '-' : ''}${coefficient}e${exponent}` : null
}

export default function AgentPipeline() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const manager = isStaffManager(user?.role)
  const [deals, setDeals] = useState<OpportunityResponse[]>([])
  const [stages, setStages] = useState<PipelineStageResponse[]>([])
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [agents, setAgents] = useState<AssignedAgent[]>([])
  const [, setActivities] = useState<ActivityResponse[]>([])
  const [notes, setNotes] = useState<NoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [creating, setCreating] = useState(false)
  const [buyerId, setBuyerId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(searchParams.get('opportunity')) || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshError, setRefreshError] = useState('')
  const [editingOffer, setEditingOffer] = useState<number | null>(null)
  const [, setViewingPrompt] = useState<number | null>(null)
  const [outcomeForm, setOutcomeForm] = useState<{ id: number; kind: 'won' | 'lost' } | null>(null)
  const [editingRate, setEditingRate] = useState<number | null>(null)
  const [finalPriceError, setFinalPriceError] = useState('')
  const [reopening, setReopening] = useState<number | null>(null)
  const savingRef = useRef(false)
  const selected = deals.find(deal => deal.id === selectedId)
  const buyers = contacts.filter(contact => contact.type === 'Buyer' || contact.type === 'Both')
  const buyer = buyers.find(contact => String(contact.id) === buyerId)
  const inquiry = stages.find(stage => stage.code === 'INQUIRY')

  useEffect(() => {
    const controller = new AbortController(), options = { signal: controller.signal }
    Promise.all([opportunitiesService.getAll(options), pipelineStagesService.getAll(options), contactsService.getAll(options), propertiesService.getAll(options),
      assignedAgentsService.getAll(options), activitiesService.getAll(options), notesService.getAll(options)])
      .then(([dealRows, stageRows, contactRows, propertyRows, agentRows, activityRows, noteRows]) => {
        if (controller.signal.aborted) return
        setDeals(dealRows); setStages(stageRows.sort((a, b) => a.sortOrder - b.sortOrder)); setContacts(contactRows)
        setProperties(propertyRows); setAgents(agentRows); setActivities(activityRows); setNotes(noteRows)
      }).catch((failure: unknown) => { if (!controller.signal.aborted) setLoadError(workflowError(failure, 'Unable to load pipeline.')) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])

  const eligibleProperties = properties.filter(property => {
    if (!buyer || !['Available', 'Reserved'].includes(property.status)) return false
    const attempts = deals.filter(deal => deal.buyerContactId === buyer.id && deal.propertyId === property.id)
    return !attempts.some(deal => deal.status === 'Open') && (!attempts.length || property.status === 'Available')
  })

  async function mutate(work: () => Promise<void>) {
    if (savingRef.current) return
    savingRef.current = true; setSaving(true); setError('')
    try { await work() } catch (failure) { setError(workflowError(failure, 'Unable to save. Please try again.')) }
    finally { savingRef.current = false; setSaving(false) }
  }

  function chooseBuyer(id: string) {
    setBuyerId(id); setPropertyId('')
    const owner = buyers.find(row => String(row.id) === id)?.ownerId
    setAgentId(agents.some(agent => agent.id === owner) ? String(owner) : '')
  }

  async function refreshWorkflow() {
    try {
      const [rows, listingRows, activityRows, contactRows] = await Promise.all([opportunitiesService.getAll(), propertiesService.getAll(), activitiesService.getAll(), contactsService.getAll()])
      setDeals(rows); setProperties(listingRows); setActivities(activityRows); setContacts(contactRows); setRefreshError('')
      const open = (id: number | null) => rows.some(row => row.id === id && row.status === 'Open')
      setViewingPrompt(current => open(current) ? current : null)
      setEditingOffer(current => open(current) ? current : null)
      setEditingRate(current => open(current) ? current : null)
      setOutcomeForm(current => current && open(current.id) ? current : null)
      setReopening(current => open(current) ? null : current)
    } catch {
      setRefreshError('Your change was saved, but the latest workflow details could not be refreshed.')
    }
  }

  async function saveOpportunity(deal: OpportunityResponse, stageId: number, offerAmount = deal.offerAmount) {
    const row = await opportunitiesService.update(deal.id, { buyerContactId: deal.buyerContactId, propertyId: deal.propertyId, agentId: deal.agentId, stageId, offerAmount })
    setDeals(current => current.map(existing => existing.id === row.id ? row : existing))
    await refreshWorkflow()
    return row
  }

  function addDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!buyer || !eligibleProperties.some(property => String(property.id) === propertyId)) return
    const data = new FormData(event.currentTarget), amount = String(data.get('offerAmount')).trim()
    void mutate(async () => {
      const row = await opportunitiesService.create({ buyerContactId: buyer.id, propertyId: Number(propertyId), offerAmount: amount === '' ? null : Number(amount), ...(manager ? { agentId: Number(agentId) } : {}) })
      setDeals(current => [row, ...current]); setCreating(false); setSelectedId(row.id)
    })
  }

  function changeStage(deal: OpportunityResponse, stageId: number) {
    void mutate(async () => {
      await saveOpportunity(deal, stageId)
      setViewingPrompt(null)
    })
  }

  function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const amount = String(new FormData(event.currentTarget).get('offerAmount')).trim()
    void mutate(async () => {
      await saveOpportunity(selected, selected.stageId, amount === '' ? null : Number(amount))
      setEditingOffer(null)
    })
  }

  function closeOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || outcomeForm?.id !== selected.id) return
    const data = new FormData(event.currentTarget), kind = outcomeForm.kind
    const enteredPrice = String(data.get('finalPrice') ?? '').trim()
    const finalPrice = Number(enteredPrice)
    if (kind === 'won' && (!Number.isFinite(finalPrice) || decimalKey(enteredPrice) !== decimalKey(JSON.stringify(finalPrice)))) {
      setFinalPriceError('This final price cannot be sent exactly by this form. No change was saved. Use a price that preserves every entered cent.')
      return
    }
    setFinalPriceError('')
    void mutate(async () => {
      const row = kind === 'won'
        ? await opportunitiesService.won(selected.id, { finalPrice })
        : await opportunitiesService.lost(selected.id, { lostReason: String(data.get('lostReason')) })
      setDeals(current => current.map(existing => existing.id === row.id ? row : existing))
      setOutcomeForm(null); setViewingPrompt(null); setEditingOffer(null); setEditingRate(null)
      await refreshWorkflow()
    })
  }

  function saveCommissionRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !manager) return
    const commissionRate = Number(new FormData(event.currentTarget).get('commissionRate'))
    void mutate(async () => {
      const row = await opportunitiesService.setCommissionRate(selected.id, { commissionRate })
      setDeals(current => current.map(existing => existing.id === row.id ? row : existing))
      setEditingRate(null)
      await refreshWorkflow()
    })
  }

  function reopenOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !manager) return
    const reason = String(new FormData(event.currentTarget).get('reason')).trim()
    if (!reason) { setError('Enter a reopening reason.'); return }
    void mutate(async () => {
      const row = await opportunitiesService.reopen(selected.id, { reason })
      setDeals(current => current.map(existing => existing.id === row.id ? row : existing))
      setReopening(null); setOutcomeForm(null); setViewingPrompt(null); setEditingOffer(null); setEditingRate(null); setFinalPriceError('')
      await refreshWorkflow()
    })
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !user) return
    const form = event.currentTarget, body = String(new FormData(form).get('body')).trim()
    void mutate(async () => {
      const row = await notesService.create({ authorId: user.id, entityType: 'Opportunity', entityId: selected.id, body })
      setNotes(current => [row, ...current]); form.reset()
    })
  }

  return <div className="text-left">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-[26px]">Pipeline</h1><p className="mt-1 text-[13px] text-ink-soft">Open an Inquiry after capturing and qualifying a buyer.</p></div>
      <button type="button" disabled={loading || !!loadError || saving || !buyers.length || !properties.some(property => ['Available', 'Reserved'].includes(property.status)) || !inquiry || !agents.length} onClick={() => { setCreating(value => !value); setError('') }} className={`${button} border-secondary bg-secondary text-on-secondary`}>New opportunity</button></div>
    {loading && <p role="status" className="mb-4 text-[13px] text-ink-soft">Loading pipeline…</p>}
    {loadError && <p role="alert" className="mb-4 text-[13px] text-brick">{loadError} <button type="button" onClick={() => { setLoading(true); setLoadError(''); setRetry(value => value + 1) }} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-secondary underline">Retry</button></p>}
    {error && <p role="alert" className="mb-4 text-[13px] text-brick">{error}</p>}
    {refreshError && <div role="status" className="mb-4 text-[13px] text-ink-soft">{refreshError} <button type="button" disabled={saving} onClick={() => { void mutate(refreshWorkflow) }} className="cursor-pointer text-secondary underline">Refresh</button></div>}
    {!loading && !loadError && <>
      {(!buyers.length || !properties.some(property => ['Available', 'Reserved'].includes(property.status))) && <p className="mb-5 text-[13px] text-ink-soft">Create a <Link to="/agent/contacts?new=Buyer" className="text-secondary underline">buyer contact</Link> and publish a <Link to="/agent/listings" className="text-secondary underline">property listing</Link> before adding an opportunity.</p>}
      {creating && <div className="mb-5"><Panel title="New opportunity"><form onSubmit={addDeal} className="p-5"><fieldset disabled={saving} className="grid min-w-0 grid-cols-2 gap-4 border-0 compact:grid-cols-1">
        <label className={label}>Buyer<select name="buyerContactId" required className={field} value={buyerId} onChange={event => chooseBuyer(event.target.value)}><option value="">Select a buyer</option>{buyers.map(row => <option key={row.id} value={row.id}>{contactName(row)}</option>)}</select></label>
        <label className={label}>Property<select name="propertyId" required className={field} value={propertyId} onChange={event => setPropertyId(event.target.value)} disabled={!buyer}><option value="">Select a property</option>{eligibleProperties.map(property => <option key={property.id} value={property.id}>{property.address} · {property.status}</option>)}</select>{buyer && !eligibleProperties.length && <span className="text-[11px]">No eligible listing remains for this buyer. An existing Open pair cannot be duplicated.</span>}</label>
        {manager ? <label className={label}>Agent<select name="agentId" required className={field} value={agentId} onChange={event => setAgentId(event.target.value)}><option value="">Select an active agent</option>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}</select></label>
          : <label className={label}>Agent<input readOnly value={buyer?.owner?.fullName ?? (buyer ? `Agent #${buyer.ownerId}` : 'Select a buyer first')} className={field} /><span className="text-[11px]">Defaults to the buyer contact's owner.</span></label>}
        <label className={label}>Stage<input readOnly value="Inquiry" className={field} /></label>
        <label className={label}>Offer amount (₱)<input name="offerAmount" type="number" min="0.01" max="9999999999999999" step="0.01" className={field} /><span className="text-[11px]">Optional at Inquiry.</span></label>
      </fieldset><p className="mt-3 text-[13px] text-ink-soft">Outcome: Open. The configured commission rate is copied when you save.</p><div className="mt-4 flex gap-2"><button disabled={saving || !buyer || !propertyId || (manager && !agentId)} className={`${button} border-secondary bg-secondary text-on-secondary`}>{saving ? 'Saving…' : 'Save opportunity'}</button><button type="button" disabled={saving} onClick={() => setCreating(false)} className={`${button} border-line bg-surface text-secondary`}>Cancel</button></div></form></Panel></div>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-start gap-4">{stages.map(stage => <Panel key={stage.id} title={`${stage.name} · ${deals.filter(deal => deal.stageId === stage.id).length}`}><div className="space-y-3 p-4">{deals.filter(deal => deal.stageId === stage.id).map(deal => <div key={deal.id} className="rounded-md border border-line bg-paper p-4">
        <button type="button" disabled={saving} onClick={() => { setSelectedId(deal.id); setError('') }} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-left text-[14px] font-semibold text-secondary hover:underline">{deal.property?.address ?? `Property #${deal.propertyId}`}</button>
        <p className="mt-2 text-[13px]">{deal.buyerContact ? contactName(deal.buyerContact) : `Contact #${deal.buyerContactId}`}</p><p className="mt-1 text-[14px] font-semibold">{deal.offerAmount == null ? 'No offer yet' : money.format(deal.offerAmount)}</p>
        <p className="mt-1 text-[12px] text-ink-soft">{deal.status} · {deal.stage?.name ?? stage.name} · {deal.agent?.fullName}</p>
        <p className="mt-1 text-[12px] text-ink-soft">Property status: {deal.property?.status ?? properties.find(property => property.id === deal.propertyId)?.status ?? 'Unavailable'}</p>
        {deal.status !== 'Open' && <p className="mt-1 text-[12px] text-ink-soft">Closed at: {deal.closedAt ? new Date(deal.closedAt).toLocaleString() : 'Unavailable'}{deal.status === 'Lost' && ` · Lost reason: ${deal.lostReason ?? 'Unavailable'}`}</p>}
        {deal.status === 'Open' && <label className={`${label} mt-3`}>Stage<select aria-label={`Stage for ${deal.buyerContact ? contactName(deal.buyerContact) : `Contact #${deal.buyerContactId}`} · ${deal.property?.address ?? 'opportunity'} · Opportunity #${deal.id}`} value={deal.stageId} disabled={saving} onChange={event => changeStage(deal, Number(event.target.value))} className={field}>{stages.filter(option => option.sortOrder >= stage.sortOrder - 1).map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
      </div>)}{!deals.some(deal => deal.stageId === stage.id) && <p className="text-[13px] text-ink-soft">No opportunities in this stage.</p>}</div></Panel>)}</div>
      {!stages.length && <p className="rounded-md border border-line bg-surface p-8 text-center text-[13px] text-ink-soft">Pipeline stages are not configured. Contact an administrator.</p>}
      {selected && <div className="mt-5"><Panel title={`Opportunity · ${selected.property?.address ?? `Property #${selected.propertyId}`}`}><div className="grid min-w-0 grid-cols-2 gap-6 p-5 compact:grid-cols-1">
        <div className="min-w-0"><p className="mb-2 text-[13px] font-semibold">{selected.status} · {selected.stage?.name ?? 'Inquiry'}</p>
          <p className="mb-2 text-[13px]">Buyer: {selected.buyerContact ? contactName(selected.buyerContact) : `Contact #${selected.buyerContactId}`}</p>
          <p className="mb-2 text-[13px]">Property status: {selected.property?.status ?? 'Unavailable'}</p>
          <p className="mb-3 text-[13px]">Saved offer: {selected.offerAmount == null ? 'No offer yet' : money.format(selected.offerAmount)}</p>
          <p className="mb-2 text-[13px]">Commission rate (decimal): {selected.commissionRate}</p>
          <p className="mb-3 text-[13px]">Commission earned: {selected.status === 'Won' && selected.commissionAmount != null ? money.format(selected.commissionAmount) : '—'}</p>
          {selected.status !== 'Open' && <div className="mb-4 space-y-2 text-[13px]"><p>Closed at: {selected.closedAt ? new Date(selected.closedAt).toLocaleString() : 'Unavailable'}</p>{selected.status === 'Won' ? <p>Final price: {selected.finalPrice == null ? 'Unavailable' : money.format(selected.finalPrice)}</p> : <p>Lost reason: {selected.lostReason ?? 'Unavailable'}</p>}</div>}
          {manager && selected.status !== 'Open' && <div className="mb-5">{reopening === selected.id ? <form key={`reopen-${selected.id}`} onSubmit={reopenOpportunity} className="space-y-3 rounded-sm border border-line p-3"><label className={label}>Reopening reason<textarea name="reason" required maxLength={2000} disabled={saving} className={field} /></label><div className="flex flex-wrap gap-2"><button disabled={saving} className={`${button} border-secondary bg-secondary text-on-secondary`}>Confirm reopen</button><button type="button" disabled={saving} onClick={() => setReopening(null)} className={`${button} border-line`}>Cancel reopening</button></div></form> : <button type="button" disabled={saving} onClick={() => { setReopening(selected.id); setError('') }} className={`${button} border-line text-secondary`}>Reopen opportunity</button>}</div>}
          {selected.status === 'Open' && <div className="mb-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(selected.stage?.code ?? stages.find(stage => stage.id === selected.stageId)?.code) === 'CLOSING' && selected.property?.status === 'Reserved' && <button type="button" disabled={saving} onClick={() => { setOutcomeForm({ id: selected.id, kind: 'won' }); setError(''); setFinalPriceError('') }} className={`${button} border-secondary text-secondary`}>Mark as Won</button>}
              <button type="button" disabled={saving} onClick={() => { setOutcomeForm({ id: selected.id, kind: 'lost' }); setError('') }} className={`${button} border-line text-secondary`}>Mark as Lost</button>
              {manager && <button type="button" disabled={saving} onClick={() => { setEditingRate(selected.id); setError('') }} className={`${button} border-line text-secondary`}>Edit commission rate</button>}
            </div>
            {outcomeForm?.id === selected.id && <form key={`outcome-${selected.id}-${outcomeForm.kind}`} onSubmit={closeOpportunity} className="space-y-3 rounded-sm border border-line p-3"><fieldset disabled={saving} className="border-0 p-0">
              {outcomeForm.kind === 'won' ? <label className={label}>Final price (₱)<input name="finalPrice" type="number" required min="0.01" max="9999999999999999.99" step="0.01" aria-invalid={!!finalPriceError} aria-describedby={finalPriceError ? 'final-price-error' : undefined} onInput={() => setFinalPriceError('')} className={field} />{finalPriceError && <span id="final-price-error" role="alert" className="text-brick">{finalPriceError}</span>}</label>
                : <label className={label}>Lost reason<select name="lostReason" required defaultValue="" className={field}><option value="" disabled>Select a reason</option>{lostReasons.map(reason => <option key={reason}>{reason}</option>)}</select></label>}
              </fieldset><div className="flex flex-wrap gap-2"><button disabled={saving} className={`${button} border-secondary bg-secondary text-on-secondary`}>{outcomeForm.kind === 'won' ? 'Confirm Won' : 'Confirm Lost'}</button><button type="button" disabled={saving} onClick={() => setOutcomeForm(null)} className={`${button} border-line`}>Cancel outcome</button></div></form>}
            {manager && editingRate === selected.id && <form key={`rate-${selected.id}`} onSubmit={saveCommissionRate} className="space-y-3 rounded-sm border border-line p-3"><label className={label}>Commission rate (decimal)<input name="commissionRate" type="number" required min="0" max="1" step="0.000001" defaultValue={selected.commissionRate} disabled={saving} className={field} /><span className="text-[11px]">Use a decimal fraction, for example 0.03.</span></label><div className="flex flex-wrap gap-2"><button disabled={saving} className={`${button} border-secondary bg-secondary text-on-secondary`}>Save commission rate</button><button type="button" disabled={saving} onClick={() => setEditingRate(null)} className={`${button} border-line`}>Cancel commission edit</button></div></form>}
          </div>}
          {selected.status === 'Open' && <div className="mb-5">{editingOffer === selected.id ? <form key={`offer-${selected.id}`} onSubmit={saveOffer} className="space-y-3"><label className={label}>Offer amount (₱)<input name="offerAmount" type="number" min="0.01" max="9999999999999999" step="0.01" required={(stages.find(stage => stage.id === selected.stageId)?.sortOrder ?? 1) >= 3} defaultValue={selected.offerAmount ?? ''} disabled={saving} className={field} /></label><div className="flex flex-wrap gap-2"><button disabled={saving} className={`${button} border-secondary bg-secondary text-on-secondary`}>Save offer</button><button type="button" disabled={saving} onClick={() => setEditingOffer(null)} className={`${button} border-line`}>Cancel offer edit</button></div></form> : <button type="button" disabled={saving} onClick={() => setEditingOffer(selected.id)} className={`${button} border-line text-secondary`}>Edit offer</button>}</div>}
          <ActivityWorkspace key={String(selected.id) + '-' + selected.status + '-' + selected.stageId} target={{ contactId: selected.buyerContactId, opportunityId: selected.id, propertyId: selected.propertyId }} submitLabel="Log activity" onChanged={refreshWorkflow} />
        </div><div><h2 className="mb-3 text-[14px] font-semibold">Notes</h2><ul className="mb-4 space-y-3 text-[13px]">{notes.filter(note => note.entityType === 'Opportunity' && note.entityId === selected.id).map(note => <li key={note.id} className="whitespace-pre-wrap wrap-anywhere">{note.body}<span className="block text-[12px] text-ink-soft">{note.author?.fullName}</span></li>)}</ul><form key={`note-${selected.id}`} onSubmit={addNote} className="space-y-3"><label className={label}>New note<textarea name="body" required disabled={saving} className={`${field} min-h-24`} /></label><button disabled={saving} className={`${button} border-secondary bg-secondary text-on-secondary`}>Add note</button></form></div>
      </div></Panel></div>}
    </>}
  </div>
}
