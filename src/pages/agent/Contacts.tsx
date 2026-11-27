import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import Panel from '../../components/Panel'
import { contactName, contactsService } from '../../services'
import type { ContactCreateRequest, ContactResponse, ContactType, ContactSource } from '../../services'
import { assignedAgentsService } from '../../services/users/assignedAgentsService'
import type { AssignedAgent } from '../../services/users/assignedAgentsService'
import { isStaffManager } from '../../routes/roles'
import { existingContactId, workflowError } from './workflowHelpers'
import ContactActivities from './ContactActivities'

const field = 'w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-secondary'
const label = 'flex flex-col gap-1.5 text-[13px] text-ink-soft'
const button = 'cursor-pointer rounded-sm border px-4 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50'

export default function Contacts() {
  const { user } = useAuth()
  const manager = isStaffManager(user?.role)
  const [params, setParams] = useSearchParams()
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [owners, setOwners] = useState<AssignedAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [editing, setEditing] = useState<ContactResponse | null>(null)
  const [creating, setCreating] = useState(() => params.has('new'))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [duplicateId, setDuplicateId] = useState<number | null>(null)
  const [activityContact, setActivityContact] = useState<ContactResponse | null>(null)
  const savingRef = useRef(false)
  const newType = params.get('new') === 'Seller' ? 'Seller' : params.get('new') === 'Both' ? 'Both' : 'Buyer'

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([contactsService.getAll({ signal: controller.signal }), assignedAgentsService.getAll({ signal: controller.signal })])
      .then(([rows, users]) => { if (!controller.signal.aborted) { setContacts(rows); setOwners(users) } })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load contacts.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])

  function closeForm() { setEditing(null); setCreating(false); setSaveError(''); setDuplicateId(null); setParams({}) }
  async function openDuplicate() {
    if (!duplicateId || savingRef.current) return
    savingRef.current = true; setSaving(true)
    try {
      const row = await contactsService.getById(duplicateId)
      setEditing(row); setCreating(false); setSaveError(''); setDuplicateId(null)
    } catch (error) { setSaveError(workflowError(error, 'Unable to open the existing contact.')) }
    finally { savingRef.current = false; setSaving(false) }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    const data = new FormData(event.currentTarget)
    const payload: ContactCreateRequest = {
      firstName: String(data.get('firstName')).trim(), lastName: String(data.get('lastName')).trim(),
      email: String(data.get('email')).trim() || null, phone: String(data.get('phone')).trim() || null,
      type: String(data.get('type')) as ContactType, source: String(data.get('source')) as ContactSource,
      isManuallyInactive: data.get('isManuallyInactive') === 'on',
      ...(manager ? { ownerId: Number(data.get('ownerId')) } : {}),
    }
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    setDuplicateId(null)
    try {
      const row = editing ? await contactsService.update(editing.id, { ...payload, ownerId: manager ? Number(data.get('ownerId')) : editing.ownerId, isManuallyInactive: payload.isManuallyInactive ?? false }) : await contactsService.create(payload)
      setContacts(current => [row, ...current.filter(contact => contact.id !== row.id)])
      closeForm()
    } catch (error) {
      setSaveError(workflowError(error, 'Unable to save contact.'))
      setDuplicateId(existingContactId(error))
    } finally { setSaving(false); savingRef.current = false }
  }

  const visible = contacts.filter(contact => (filter === 'All' || contact.type === filter)
    && `${contactName(contact)} ${contact.email ?? ''} ${contact.phone ?? ''} ${contact.status} ${contact.source} ${contact.owner?.fullName ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))

  return <div className="text-left">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-[26px]">Contacts</h1><p className="mt-1 text-[13px] text-ink-soft">Capture buyers, sellers, or both, and record qualification before opening a deal.</p></div>
      <div className="flex gap-2"><Link to="/agent/listings" className={`${button} border-line bg-surface text-secondary no-underline`}>Go to listings</Link><button type="button" disabled={loading || !!loadError || saving} onClick={() => { setCreating(true); setEditing(null); setSaveError(''); setDuplicateId(null) }} className={`${button} border-secondary bg-secondary text-on-secondary`}>New contact</button></div></div>
    {loading && <p role="status" className="mb-4 text-[13px] text-ink-soft">Loading contacts…</p>}
    {loadError && <p role="alert" className="mb-4 text-[13px] text-brick">{loadError} <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-sans text-secondary underline" onClick={() => { setLoadError(''); setLoading(true); setRetry(value => value + 1) }}>Retry</button></p>}
    {!loading && !loadError && (creating || editing) && <div className="mb-5"><Panel title={editing ? 'Edit contact' : 'New contact'}>
      <form key={editing?.id ?? newType} onSubmit={save} className="space-y-4 p-5" aria-busy={saving}>
        <fieldset disabled={saving || loading || !!loadError} className="grid min-w-0 grid-cols-2 gap-4 border-0 p-0 compact:grid-cols-1">
          <label className={label}>First name<input autoFocus name="firstName" required pattern=".*\S.*" maxLength={80} defaultValue={editing?.firstName} className={field} /></label>
          <label className={label}>Last name<input name="lastName" required pattern=".*\S.*" maxLength={80} defaultValue={editing?.lastName} className={field} /></label>
          <label className={label}>Email<input name="email" type="email" maxLength={150} defaultValue={editing?.email ?? ''} className={field} /></label>
          <label className={label}>Phone<input name="phone" type="tel" maxLength={30} defaultValue={editing?.phone ?? ''} placeholder="+63 917 123 4567" className={field} /><span className="text-[11px]">Enter Email or an international Phone beginning with +.</span></label>
          <label className={label}>Type<select name="type" defaultValue={editing?.type ?? newType} className={field}><option>Buyer</option><option>Seller</option><option>Both</option></select></label>
          <label className={label}>Source<select name="source" required defaultValue={editing?.source ?? 'Website'} className={field}>{['Walk-in', 'Referral', 'Website', 'Facebook', 'Phone', 'Other'].map(source => <option key={source}>{source}</option>)}</select></label>
          {manager ? <label className={label}>Owner<select name="ownerId" required defaultValue={owners.some(owner => owner.id === editing?.ownerId) ? String(editing!.ownerId) : ''} className={field}><option value="">Select an active agent</option>{owners.map(owner => <option key={owner.id} value={owner.id}>{owner.fullName}</option>)}</select></label>
            : <label className={label}>Owner<input readOnly value={user?.fullName ?? ''} className={field} /></label>}
          <label className="flex items-center gap-2 text-[13px] text-ink-soft"><input name="isManuallyInactive" type="checkbox" defaultChecked={editing?.isManuallyInactive ?? false} />Set manually Inactive</label>
          <p className="text-[13px] text-ink-soft">Computed status: <strong>{editing?.status ?? 'Lead'}</strong>. Status updates from listings and opportunities.</p>
        </fieldset>
        {saveError && <p role="alert" className="text-[13px] text-brick">{saveError}</p>}
        {duplicateId && <button type="button" disabled={saving} onClick={() => { void openDuplicate() }} className={`${button} border-line bg-surface text-secondary`}>Open existing contact</button>}
        <div className="flex gap-2"><button type="submit" disabled={saving || loading || !!loadError || owners.length === 0} className={`${button} border-secondary bg-secondary text-on-secondary`}>{saving ? 'Saving…' : 'Save contact'}</button><button type="button" onClick={closeForm} disabled={saving} className={`${button} border-line bg-surface text-secondary`}>Cancel</button></div>
      </form></Panel></div>}
    <Panel title="Your contacts"><div className="flex flex-wrap gap-3 border-b border-line-soft p-4"><input type="search" aria-label="Search contacts" placeholder="Search names, email, phone, status, source…" value={query} onChange={e => setQuery(e.target.value)} className={`${field} sm:max-w-sm`} /><select aria-label="Filter contact type" value={filter} onChange={e => setFilter(e.target.value)} className={`${field} sm:max-w-40`}><option>All</option><option>Buyer</option><option>Seller</option><option>Both</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[13px]"><thead className="border-b border-line-soft text-ink-soft"><tr>{['Contact', 'Type', 'Status', 'Source', 'Owner', 'Actions'].map(title => <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>)}</tr></thead><tbody>{visible.map(contact => <tr key={contact.id} className="border-b border-line-soft last:border-0 hover:bg-paper"><th scope="row" className="px-4 py-3 font-medium">{contactName(contact)}<span className="block text-[12px] font-normal text-ink-soft">{contact.email ?? contact.phone}</span></th><td className="px-4 py-3">{contact.type}</td><td className="px-4 py-3">{contact.status}</td><td className="px-4 py-3">{contact.source}</td><td className="px-4 py-3">{contact.owner?.fullName ?? '—'}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-3"><button type="button" aria-label={`Edit ${contactName(contact)}`} disabled={saving} onClick={() => { setEditing(contact); setCreating(false); setSaveError(''); setDuplicateId(null) }} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-secondary underline">Edit</button><button type="button" aria-label={`Activities ${contactName(contact)}`} disabled={saving} onClick={() => setActivityContact(contact)} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-secondary underline">Activities</button></div></td></tr>)}</tbody></table></div>
      {!loading && !loadError && visible.length === 0 && <p className="p-8 text-center text-[13px] text-ink-soft">{contacts.length ? 'No contacts match your search.' : 'Create your first contact to get started.'}</p>}
    </Panel>
    {activityContact && <div className="mt-5"><ContactActivities key={activityContact.id} contact={activityContact} agents={owners} onClose={() => setActivityContact(null)} /></div>}
  </div>
}


