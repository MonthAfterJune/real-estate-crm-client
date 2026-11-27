import { useEffect, useState } from 'react'
import { propertiesService } from '../../services/properties'
import type { PropertyResponse } from '../../services/properties'
import { contactName } from '../../services/contacts/sellerContactsService'
import Icon from '../../components/Icon'
import Panel from '../../components/Panel'
import StatCard from '../../components/StatCard'
import StatusPill from '../../components/StatusPill'
import AddPropertyForm from './AddPropertyForm'
import { useAuth } from '../../auth/useAuth'
import { isStaffManager } from '../../routes/roles'

type ListingStatus = 'draft' | 'available' | 'reserved' | 'sold' | 'withdrawn'

export type Listing = {
  id: string
  property: string
  details: string
  agent: string
  seller?: string
  price: string
  status: ListingStatus
  address?: string
  description?: string
  photos?: string[]
  source: PropertyResponse
}

function toListing(property: PropertyResponse): Listing {
  return {
    id: String(property.id), property: property.address, address: property.address,
    details: `${property.city} · ${property.propertyType}${property.bedrooms == null ? '' : ` · ${property.bedrooms} bedroom${property.bedrooms === 1 ? '' : 's'}`}`,
    agent: property.listingAgent?.fullName ?? '—',
    seller: property.sellerContact ? contactName(property.sellerContact) : `Contact #${property.sellerContactId}`,
    price: property.price == null ? 'Not set' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(property.price),
    status: property.status.toLowerCase() as ListingStatus,
    source: property,
  }
}
const statusOptions: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export default function AgentListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    propertiesService.getAll({ signal: controller.signal }).then(rows => {
      if (!controller.signal.aborted) setListings(rows.map(toListing))
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load listings.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  const [addingProperty, setAddingProperty] = useState(false)
  const [editingProperty, setEditingProperty] = useState<PropertyResponse | undefined>()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const query = search.trim().toLowerCase()
  const filteredListings = listings.filter((listing) => (
    (status === 'all' || listing.status === status)
    && `${listing.property} ${listing.details} ${listing.agent} ${listing.seller ?? ''} ${listing.address ?? ''}`.toLowerCase().includes(query)
  ))
  const listingStats = statusOptions.map(({ value, label }) => ({
    label: value === 'all' ? 'Total listings' : label,
    value: String(value === 'all' ? listings.length : listings.filter((listing) => listing.status === value).length),
  }))

  function clearFilters() {
    setSearch('')
    setStatus('all')
  }

  function exportListings() {
    const rows = [
      ['Property', 'Details', 'Address', 'Agent', 'Seller', 'Price', 'Status'],
      ...filteredListings.map((listing) => [
        listing.property, listing.details, listing.address ?? '', listing.agent, listing.seller ?? '', listing.price,
        statusOptions.find((option) => option.value === listing.status)!.label,
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => {
      const text = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value
      return `"${text.replaceAll('"', '""')}"`
    }).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'meridian-listings.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (addingProperty || editingProperty) {
    return (
      <AddPropertyForm
        key={editingProperty?.id ?? 'new'}
        property={editingProperty}
        onCancel={() => { setAddingProperty(false); setEditingProperty(undefined) }}
        onSave={(listing) => {
          setListings((current) => [toListing(listing), ...current.filter(row => row.id !== String(listing.id))])
          clearFilters()
          setAddingProperty(false)
          setEditingProperty(undefined)
        }}
      />
    )
  }

  return (
    <div className="text-left">
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="m-0 font-display text-[26px] font-medium tracking-[-0.01em] text-ink">Listings</h1>
          <p className="mt-1 text-[13px] text-ink-soft">Keep track of your properties, pricing, and availability.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={exportListings}
            disabled={filteredListings.length === 0}
            title="Export the current filtered listings as CSV"
            className="inline-flex cursor-pointer items-center gap-1.75 rounded-sm border border-line bg-surface px-3.75 py-2.25 font-sans text-[13px] font-semibold text-secondary hover:bg-sky-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" /></svg>
            Export
          </button>
          <button
            type="button"
            onClick={() => setAddingProperty(true)}
            className="inline-flex cursor-pointer items-center gap-1.75 rounded-sm border border-secondary bg-secondary px-3.75 py-2.25 font-sans text-[13px] font-semibold text-on-secondary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Add property
          </button>
        </div>
      </div>

      {loading && <p role="status" className="mb-4 text-[13px] text-ink-soft">Loading listings…</p>}
      {error && <div role="alert" className="mb-4 text-[13px] text-brick">{error} <button type="button" onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1) }} className="cursor-pointer text-secondary underline">Retry</button></div>}
      <section aria-label="Listing summary" className="mb-6.5 grid grid-cols-3 gap-3.5 compact:grid-cols-2">
        {listingStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <Panel title="Property listings">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4.5 py-3">
          <div className="flex w-full items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-secondary sm:w-72 [&_svg]:flex-none [&_svg]:text-ink-faint">
            <Icon name="search" />
            <input
              type="search"
              aria-label="Search listings by property, agent, seller, or address"
              placeholder="Search properties, agents, sellers, or addresses"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 w-full border-0 bg-transparent font-sans text-[13px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="listing-status" className="text-[12.5px] text-ink-soft">Status</label>
            <select
              id="listing-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-sm border border-line bg-surface px-2.5 py-2 font-sans text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {(search || status !== 'all') && (
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer rounded-sm border-0 bg-transparent px-2 py-2 font-sans text-[12.5px] font-semibold text-secondary hover:bg-sky-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <p role="status" className="border-b border-line-soft px-4.5 py-2 text-[12.5px] text-ink-soft">
          Showing {filteredListings.length} of {listings.length} listings
        </p>

        <div role="region" aria-label="Property listings table" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-[11.5px] text-ink-faint">
                <th scope="col" className="px-4.5 py-3 font-normal">Property</th>
                <th scope="col" className="px-4.5 py-3 font-normal">Agent</th>
                <th scope="col" className="px-4.5 py-3 font-normal">Seller</th>
                <th scope="col" className="px-4.5 py-3 font-normal">Price</th>
                <th scope="col" className="px-4.5 py-3 font-normal">Status</th>
                <th scope="col" className="px-4.5 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="border-b border-line-soft last:border-b-0 hover:bg-paper">
                  <th scope="row" className="px-4.5 py-3 font-normal">
                    <div className="flex items-center gap-3.5">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt="" className="h-10 w-14 shrink-0 rounded-sm object-cover" />
                      ) : (
                        <div aria-hidden="true" className="h-10 w-14 shrink-0 rounded-sm bg-paper" />
                      )}
                      <div>
                        <span className="block font-semibold">{listing.property}</span>
                        <span className="text-[11.5px] text-ink-faint">{listing.details}</span>
                      </div>
                    </div>
                  </th>
                  <td className="px-4.5 py-3">{listing.agent}</td>
                  <td className="px-4.5 py-3">{listing.seller ?? '—'}</td>
                  <td className="px-4.5 py-3 whitespace-nowrap">{listing.price}</td>
                  <td className="px-4.5 py-3"><StatusPill status={listing.status} /></td>
                  <td className="px-4.5 py-3">{(isStaffManager(user?.role) || listing.source.listingAgentId === user?.id) && ['Draft', 'Available', 'Withdrawn'].includes(listing.source.status)
                    ? <button type="button" aria-label={`Edit ${listing.property}`} onClick={() => setEditingProperty(listing.source)} className="cursor-pointer border-0 bg-transparent p-0 text-secondary underline">Edit</button>
                    : <span className="text-[12px] text-ink-soft">{listing.source.status === 'Reserved' ? 'Release the reservation before withdrawing.' : 'Read-only'}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && filteredListings.length === 0 && (
          <div className="px-4.5 py-10 text-center">
            <p className="text-[14px] font-semibold">No listings found</p>
            <p className="mt-1 text-[13px] text-ink-soft">Try another property, agent, seller, or status.</p>
          </div>
        )}
      </Panel>
    </div>
  )
}

