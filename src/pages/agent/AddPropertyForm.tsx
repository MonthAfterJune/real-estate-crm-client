import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import Panel from '../../components/Panel'
import { useAuth } from '../../auth/useAuth'
import { propertiesService } from '../../services/properties'
import type { PropertyResponse, PropertyStatus } from '../../services/properties'
import { assignedAgentsService } from '../../services/users/assignedAgentsService'
import type { AssignedAgent } from '../../services/users/assignedAgentsService'
import { contactName, sellerContactsService } from '../../services/contacts/sellerContactsService'
import type { ContactResponse } from '../../services/contacts'
import { isStaffManager } from '../../routes/roles'
import { workflowError } from './workflowHelpers'

const field = 'box-border w-full rounded-sm border border-line bg-surface px-3 py-2.5 font-sans text-[13px] text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'
const label = 'flex min-w-0 flex-col gap-1.5 text-[13px] text-ink-soft'
const button = 'cursor-pointer rounded-sm border px-4 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50'
const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export default function AddPropertyForm({ property, onCancel, onSave }: {
  property?: PropertyResponse
  onCancel: () => void
  onSave: (property: PropertyResponse) => void
}) {
  const { user } = useAuth()
  const currentUserId = user?.id
  const manager = isStaffManager(user?.role)
  const [address, setAddress] = useState(property?.address ?? '')
  const [city, setCity] = useState(property?.city ?? '')
  const [propertyType, setPropertyType] = useState(property?.propertyType ?? '')
  const [price, setPrice] = useState(property?.price == null ? '' : String(property.price))
  const [bedrooms, setBedrooms] = useState(property?.bedrooms == null ? '' : String(property.bedrooms))
  const status = property?.status ?? 'Draft'
  const [agents, setAgents] = useState<AssignedAgent[]>([])
  const [sellers, setSellers] = useState<ContactResponse[]>([])
  const [agentId, setAgentId] = useState(property ? String(property.listingAgentId) : '')
  const [sellerId, setSellerId] = useState(property ? String(property.sellerContactId) : '')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const savingRef = useRef(false)
  const retainedSellerId = property?.sellerContactId

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      assignedAgentsService.getAll({ signal: controller.signal }),
      sellerContactsService.getAll({ signal: controller.signal }),
    ]).then(([agentRows, sellerRows]) => {
      if (controller.signal.aborted) return
      setAgents(agentRows)
      setSellers(sellerRows)
      setSellerId(current => sellerRows.some(seller => String(seller.id) === current) || (retainedSellerId != null && String(retainedSellerId) === current) ? current : String(sellerRows[0]?.id ?? ''))
      setAgentId(current => agentRows.some(agent => String(agent.id) === current) ? current : !manager && agentRows.some(agent => agent.id === currentUserId) ? String(currentUserId) : '')
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load assignments.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry, currentUserId, manager, retainedSellerId])

  const selectedSeller = sellers.find(seller => String(seller.id) === sellerId)
  const retainedSeller = !selectedSeller && retainedSellerId != null && sellerId === String(retainedSellerId)
  const selectedAgent = agents.find(agent => String(agent.id) === agentId)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current || (!selectedSeller && !retainedSeller) || !selectedAgent) return
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const publishing = submitter instanceof HTMLButtonElement && submitter.value === 'publish'
    const withdrawing = submitter instanceof HTMLButtonElement && submitter.value === 'withdraw'
    if (withdrawing && (!property || !['Draft', 'Available'].includes(status))) return
    const nextStatus = (withdrawing ? 'Withdrawn' : publishing ? 'Available' : status) as PropertyStatus
    if (nextStatus === 'Available' && !(price !== '' && Number(price) > 0)) { setSaveError('Enter a price greater than zero before publishing.'); return }
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      const details = { address: address.trim(), city: city.trim(), propertyType: propertyType.trim(), price: price === '' ? null : Number(price), bedrooms: bedrooms === '' ? null : Number(bedrooms), sellerContactId: Number(sellerId) }
      const created = property
        ? await propertiesService.update(property.id, { ...details, listingAgentId: selectedAgent.id, status: nextStatus })
        : await propertiesService.create({ ...details, status: 'Draft', ...(manager ? { listingAgentId: selectedAgent.id } : {}) })
      onSave(created)
    } catch (error) {
      setSaveError(workflowError(error, 'Unable to save the listing. Please try again.'))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return <form onSubmit={save} aria-busy={saving} className="text-left">
    <button type="button" onClick={onCancel} disabled={saving} className="mb-3 cursor-pointer border-0 bg-transparent p-0 font-sans text-[13px] text-secondary hover:underline">← Back to listings</button>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-[26px] text-ink">{property ? 'Edit property' : 'Add a property'}</h1><p className="mt-1 text-[13px] text-ink-soft">Save a Draft, then publish it when the price and listing details are ready.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={onCancel} disabled={saving} className={`${button} border-line bg-surface text-secondary`}>Cancel</button>
        <button type="submit" disabled={saving || loading || !!loadError || (!selectedSeller && !retainedSeller) || !selectedAgent} className={`${button} border-secondary bg-secondary text-on-secondary`}>{saving ? 'Saving…' : !property || status === 'Draft' ? 'Save draft' : 'Save changes'}</button>
        {property && (status === 'Draft' || status === 'Withdrawn') && <button type="submit" value="publish" disabled={saving || loading || !!loadError || (!selectedSeller && !retainedSeller) || !selectedAgent} className={`${button} border-secondary bg-secondary text-on-secondary`}>Publish listing</button>}
        {property && (status === 'Draft' || status === 'Available') && <button type="submit" value="withdraw" disabled={saving || loading || !!loadError || (!selectedSeller && !retainedSeller) || !selectedAgent} className={`${button} border-line bg-surface text-secondary`}>Withdraw listing</button>}</div>
    </div>
    {saveError && <p role="alert" className="mb-4 text-[13px] text-brick">{saveError}</p>}
    {loadError && <p role="alert" className="mb-4 text-[13px] text-brick">{loadError}</p>}
    <fieldset disabled={saving} className="grid min-w-0 grid-cols-[minmax(0,1fr)_280px] gap-5 border-0 p-0 compact:grid-cols-1">
      <div className="space-y-5">
        <Panel title="Property details"><div className="space-y-4 p-5">
          <label className={label}>Address<input autoFocus required maxLength={200} pattern=".*\S.*" value={address} onChange={e => setAddress(e.target.value)} placeholder="Unit, street, barangay, city" className={field} /></label>
          <div className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1"><label className={label}>City<input name="city" required maxLength={100} pattern=".*\S.*" value={city} onChange={e => setCity(e.target.value)} className={field} /></label>
            <label className={label}>Property type<input name="propertyType" required maxLength={50} pattern=".*\S.*" value={propertyType} onChange={e => setPropertyType(e.target.value)} placeholder="Condominium, house, lot…" className={field} /></label></div>
          <div className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1"><label className={label}>Price (₱)<span className="relative block">
            <input name="price" type="number" inputMode="decimal" min="0" max="9999999999999999" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className={`${field} peer [&:valid:not(:focus)]:text-transparent [&:disabled]:text-transparent`} />
            {price !== '' && Number.isFinite(Number(price)) && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 right-8 flex items-center text-[13px] text-ink peer-focus:hidden peer-invalid:hidden"><span className="truncate">{money.format(Number(price))}</span></span>}
          </span><span className="text-[11px]">Optional for Draft; positive price required to publish.</span></label>
            <label className={label}>Bedrooms<input name="bedrooms" type="number" min="0" max="2147483647" step="1" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className={field} /><span className="text-[11px]">Optional</span></label></div>
        </div></Panel>
        <Panel title="Assignment & status"><div className="space-y-4 p-5">
          <label className={label}>Seller contact<select name="sellerContactId" required value={sellerId} disabled={loading || !!loadError || (sellers.length === 0 && !retainedSeller)} onChange={e => setSellerId(e.target.value)} className={field}>
            {retainedSeller && <option value={sellerId}>Contact #{sellerId}</option>}{sellers.map(seller => <option key={seller.id} value={seller.id}>{contactName(seller)}{seller.email ? ` (${seller.email})` : ''}</option>)}</select></label>
          {loading && <p role="status" className="text-[13px] text-ink-soft">Loading seller contacts…</p>}
          {!loading && !loadError && sellers.length === 0 && !retainedSeller && <p role="status" className="text-[13px] text-ink-soft">No seller contacts yet. <Link className="text-secondary underline" to="/agent/contacts?new=Seller">Create a seller contact</Link>, then return to add your listing.</p>}
          {manager ? <label className={label}>Listing agent<select name="listingAgentId" required value={agentId} disabled={loading} onChange={e => setAgentId(e.target.value)} className={field}>
            <option value="">Select an active agent</option>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.fullName}</option>)}</select></label>
            : <label className={label}>Listing agent<input readOnly value={user?.fullName ?? ''} className={field} /><span className="text-[11px]">Your account is the listing agent.</span></label>}
          {!loading && !loadError && agents.length === 0 && <p role="status" className="text-[13px] text-ink-soft">An agent account is needed before a property can be listed.</p>}
          <p className="text-[13px] text-ink-soft">Status: <strong>{status}</strong></p>
          <button type="button" disabled={loading} onClick={() => { setLoading(true); setLoadError(''); setRetry(value => value + 1) }} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[13px] text-secondary underline disabled:opacity-50">Reload sellers and agents</button>
        </div></Panel>
      </div>
      <Panel title="Preview"><dl className="space-y-3 p-5 text-[13px]">{[
        ['Address', address.trim() || '—'], ['City', city.trim() || '—'], ['Property type', propertyType.trim() || '—'], ['Price', price ? money.format(Number(price)) : 'Not set'], ['Bedrooms', bedrooms || 'Not set'],
        ['Seller', selectedSeller ? contactName(selectedSeller) : retainedSeller ? `Contact #${sellerId}` : '—'], ['Agent', selectedAgent?.fullName || '—'], ['Status', status],
      ].map(([title, value]) => <div key={title} className="border-b border-line-soft pb-3"><dt className="text-ink-soft">{title}</dt><dd className="mt-1 wrap-anywhere font-medium text-ink">{value}</dd></div>)}</dl></Panel>
    </fieldset>
  </form>
}


