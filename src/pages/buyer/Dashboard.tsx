import Icon from '../../components/Icon'
import Panel from '../../components/Panel'
import Pill from '../../components/Pill'
import type { PillTone } from '../../components/Pill'
import StatCard from '../../components/StatCard'

// Sample data from the design reference; replace with API data when available.
const stats = [
  { label: 'Saved homes', value: '9' },
  { label: 'Active inquiries', value: '3' },
  { label: 'Tours this week', value: '2' },
]

const recommended = [
  { price: '₱4.2M', address: 'Unit 4B, Sunview Tower', details: '2 bed · 2 bath · 68 sqm', match: '96% match' },
  { price: '₱2.9M', address: 'Unit 12A, Palm Residences', details: '1 bed · 1 bath · 42 sqm', match: '89% match' },
  { price: '₱5.4M', address: 'Unit 7C, Sunview Tower', details: '3 bed · 2 bath · 95 sqm', match: '84% match' },
]

type Inquiry = {
  property: string
  agent: string
  status: string
  tone: PillTone
}

const inquiries: Inquiry[] = [
  { property: 'Unit 4B, Sunview Tower', agent: 'Dana Ibarra', status: 'Awaiting reply', tone: 'brass' },
  { property: 'Lot 5, Greenridge Estates', agent: 'R. Bautista', status: 'Tour scheduled', tone: 'sky' },
  { property: 'Unit 12A, Palm Residences', agent: 'Dana Ibarra', status: 'Agent responded', tone: 'forest' },
]

export default function BuyerDashboard() {
  return (
    <div className="text-left">
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="m-0 font-display text-[26px] font-medium tracking-[-0.01em] text-ink">Find your next home</h1>
          <p className="mt-1 text-[13px] text-ink-soft">12 new matches since your last visit</p>
        </div>
        <div className="flex w-60 max-w-full items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-secondary [&_svg]:flex-none [&_svg]:text-ink-faint">
          <Icon name="search" />
          <input
            type="search"
            aria-label="Search by city, neighborhood, or address"
            placeholder="City, neighborhood, or address"
            className="min-w-0 w-full border-0 bg-transparent font-sans text-[13px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="mb-6.5 grid grid-cols-1 gap-3.5 min-[480px]:grid-cols-3">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="space-y-4.5">
        <Panel title="Recommended for you" action={{ label: 'See all' }} accent="sky">
          <div className="grid grid-cols-1 gap-3.5 px-4.5 py-4 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {recommended.map((property) => (
              <article key={property.address} className="min-w-0 overflow-hidden rounded-md border border-line">
                <div className="relative h-30 bg-paper">
                  <button
                    type="button"
                    disabled
                    aria-label={`Save ${property.address}`}
                    title="Saving homes is coming soon"
                    className="absolute top-2 right-2 flex size-6.5 cursor-default items-center justify-center rounded-full border-0 bg-secondary p-0 text-on-secondary"
                  >
                    <Icon name="heart" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="mb-0.75 text-[14px] font-semibold">{property.price}</div>
                  <div className="text-[12.5px] text-ink-soft">{property.address}</div>
                  <div className="mt-1.25 text-[11.5px] text-ink-faint">{property.details}</div>
                  <div className="mt-2"><Pill tone="forest">{property.match}</Pill></div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Your inquiries" action={{ label: 'View all' }} accent="sky">
          <div className="overflow-x-auto" role="region" aria-label="Property inquiries" tabIndex={0}>
            <table className="w-full min-w-[540px] table-fixed border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-[11.5px] text-ink-faint">
                  <th scope="col" className="w-[47%] px-4.5 py-3 font-normal">Property</th>
                  <th scope="col" className="w-[29%] px-4.5 py-3 font-normal">Agent</th>
                  <th scope="col" className="px-4.5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.property} className="border-b border-line-soft last:border-b-0">
                    <td className="px-4.5 py-3">{inquiry.property}</td>
                    <td className="px-4.5 py-3">{inquiry.agent}</td>
                    <td className="px-4.5 py-3"><Pill tone={inquiry.tone}>{inquiry.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  )
}
