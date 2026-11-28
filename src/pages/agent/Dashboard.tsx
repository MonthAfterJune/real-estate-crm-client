import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import Panel from '../../components/Panel'
import StatCard from '../../components/StatCard'
import StatusPill from '../../components/StatusPill'
import { activitiesService, contactName, contactsService, opportunitiesService, propertiesService } from '../../services'
import type { ActivityFollowUpResponse, ActivityResponse, ContactResponse, OpportunityResponse, PropertyResponse } from '../../services'
import { activityTime } from './workflowHelpers'
import ActivityWorkspace from './ActivityWorkspace'

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })

export default function AgentDashboard() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [deals, setDeals] = useState<OpportunityResponse[]>([])
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [followUp, setFollowUp] = useState<ActivityFollowUpResponse | null>(null)
  const [selectedWork, setSelectedWork] = useState<ActivityResponse | null>(null)
  const [refreshError, setRefreshError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    Promise.all([contactsService.getAll(options), propertiesService.getAll(options), opportunitiesService.getAll(options), activitiesService.getAll(options), activitiesService.followUp(options)])
      .then(([contactRows, propertyRows, dealRows, activityRows, snapshot]) => {
        if (controller.signal.aborted) return
        setContacts(contactRows); setProperties(propertyRows); setDeals(dealRows)
        setActivities(activityRows.sort((a, b) => activityTime(b).localeCompare(activityTime(a))))
        setFollowUp(snapshot)
      }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load dashboard.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  async function refreshFollowUp() {
    try {
      const [snapshot, rows, contactRows, dealRows] = await Promise.all([activitiesService.followUp(), activitiesService.getAll(), contactsService.getAll(), opportunitiesService.getAll()])
      setFollowUp(snapshot); setActivities(rows); setContacts(contactRows); setDeals(dealRows); setRefreshError('')
    } catch { setRefreshError('Your change was saved, but the latest follow-up details could not be refreshed.') }
  }
  return <div className="text-left">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-[26px]">Welcome back, {user?.fullName}</h1><p className="mt-1 text-[13px] text-ink-soft">A view of your CRM workspace's contacts, listings, and opportunities.</p></div><Link to="/agent/contacts?new=Buyer" className="rounded-sm bg-secondary px-4 py-2.5 text-[13px] font-semibold text-on-secondary no-underline">New contact</Link></div>
    {loading && <p role="status" className="mb-4 text-[13px] text-ink-soft">Loading your workspace…</p>}
    {error && <p role="alert" className="mb-4 text-[13px] text-brick">{error} <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-sans text-secondary underline" onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }}>Retry</button></p>}
    {refreshError && <p role="status" className="mb-4 text-[13px]">{refreshError} <button type="button" onClick={() => { void refreshFollowUp() }} className="text-secondary underline">Refresh</button></p>}
    {!loading && !error && <>
      <div className="mb-6 grid grid-cols-4 gap-4 compact:grid-cols-2">{[
        ['Contacts', String(contacts.length)], ['Available listings', String(properties.filter(property => property.status === 'Available').length)],
        ['Open opportunities', String(deals.filter(deal => deal.status === 'Open').length)], ['Total open offer value', money.format(deals.filter(deal => deal.status === 'Open').reduce((sum, deal) => sum + (deal.offerAmount ?? 0), 0))],
      ].map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
      <div className="mb-6 grid min-w-0 grid-cols-3 gap-5 compact:grid-cols-1">{[
        { title: 'Overdue work', rows: followUp?.overdueActivities ?? [] }, { title: 'Upcoming work', rows: followUp?.upcomingActivities ?? [] },
      ].map(group => <Panel key={group.title} title={group.title}><ul className="space-y-3 p-5 text-[13px]">{group.rows.map(row => <li key={row.id} className="min-w-0 border-b border-line-soft pb-3 wrap-anywhere"><p className="font-semibold">{row.type} · {row.subject}</p><p className="mt-1">Scheduled · {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : '—'}</p><button type="button" onClick={() => setSelectedWork(row)} className="mt-2 text-secondary underline">Open activity</button></li>)}{!group.rows.length && <li className="text-ink-soft">No {group.title.toLowerCase()}.</li>}</ul></Panel>)}
        <Panel title="Stale opportunities"><ul className="space-y-3 p-5 text-[13px]">{followUp?.opportunityFollowUps.filter(item => item.isStale).map(item => { const deal = deals.find(row => row.id === item.opportunityId); return deal && <li key={item.opportunityId} className="border-b border-line-soft pb-3 wrap-anywhere"><p>{deal.property?.address ?? `Opportunity #${deal.id}`}</p><p className="mt-1 text-ink-soft">No completed linked activity in 14 days.</p><Link to={`/agent/pipeline?opportunity=${deal.id}`} className="mt-2 inline-block text-secondary underline">Open opportunity</Link></li> })}{!followUp?.opportunityFollowUps.some(item => item.isStale) && <li className="text-ink-soft">No stale opportunities.</li>}</ul></Panel>
      </div>
      {selectedWork && <div className="mb-6"><Panel title={`Work · ${selectedWork.subject}`}><div className="space-y-4 p-5"><button type="button" onClick={() => setSelectedWork(null)} className="text-[13px] text-secondary underline">Close activities</button><ActivityWorkspace key={selectedWork.id} target={{ contactId: selectedWork.contactId, propertyId: selectedWork.propertyId, opportunityId: selectedWork.opportunityId }} selectedActivityId={selectedWork.id} onChanged={refreshFollowUp} /></div></Panel></div>}
      <div className="mb-6 grid grid-cols-2 gap-5 compact:grid-cols-1">
        <Panel title="Contact overview"><div className="space-y-4 p-5">{['Buyer', 'Seller', 'Both'].map(type => {
          const count = contacts.filter(contact => contact.type === type).length
          return <div key={type}><div className="mb-2 flex justify-between text-[13px]"><span>{type === 'Both' ? 'Buyer and seller' : `${type}s`}</span><span className="font-semibold">{count}</span></div><div className="h-2 rounded-full bg-paper"><div className="h-full rounded-full bg-primary" style={{ width: `${contacts.length ? count / contacts.length * 100 : 0}%` }} /></div></div>
        })}<Link to="/agent/contacts" className="inline-block text-[13px] text-secondary underline">Manage contacts</Link></div></Panel>
        <Panel title="Recent activities"><div className="space-y-4 p-5">{activities.slice(0, 5).map(activity => {
          const contact = contacts.find(row => row.id === activity.contactId)
          const deal = deals.find(row => row.id === activity.opportunityId)
          return <div key={activity.id} className="border-b border-line-soft pb-3 text-[13px]"><p className="font-semibold">{activity.type} · {activity.subject}</p><p className="mt-1 text-ink-soft">{contact ? contactName(contact) : `Contact #${activity.contactId}`} {deal?.property?.address}</p><time className="text-[12px] text-ink-soft" dateTime={activityTime(activity)}>{activity.completedAt ? 'Completed' : 'Scheduled'} · {new Date(activityTime(activity)).toLocaleString()}</time></div>
        })}{!activities.length && <p className="text-[13px] text-ink-soft">No activities logged yet.</p>}<Link to="/agent/pipeline" className="inline-block text-[13px] text-secondary underline">Open pipeline</Link></div></Panel>
      </div>
      <Panel title="Property listings"><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-[13px]"><thead className="border-b border-line-soft text-ink-soft"><tr>{['Address', 'Seller', 'Price', 'Status'].map(title => <th key={title} className="px-5 py-3 font-medium" scope="col">{title}</th>)}</tr></thead><tbody>{properties.slice().sort((a, b) => b.id - a.id).slice(0, 5).map(property => <tr key={property.id} className="border-b border-line-soft last:border-0"><th scope="row" className="px-5 py-3 font-medium">{property.address}</th><td className="px-5 py-3">{property.sellerContact ? contactName(property.sellerContact) : `Contact #${property.sellerContactId}`}</td><td className="px-5 py-3 whitespace-nowrap">{property.price == null ? 'Not set' : money.format(property.price)}</td><td className="px-5 py-3"><StatusPill status={property.status.toLowerCase() as 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn'} /></td></tr>)}</tbody></table></div>{!properties.length && <p className="p-5 text-[13px] text-ink-soft">No property listings yet.</p>}<Link to="/agent/listings" className="m-5 inline-block text-[13px] text-secondary underline">Manage listings</Link></Panel>
    </>}
  </div>
}

