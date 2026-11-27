import ActivityFeed from '../../components/ActivityFeed'
import type { ActivityItem } from '../../components/ActivityFeed'
import Icon from '../../components/Icon'
import Panel from '../../components/Panel'
import Pill from '../../components/Pill'
import type { PillTone } from '../../components/Pill'
import StatusPill from '../../components/StatusPill'

// Sample data from the design reference; replace with API data when available.
const listingStats = [
  { label: 'Views (30d)', value: '342' },
  { label: 'Showings booked', value: '6' },
  { label: 'Offers received', value: '2' },
  { label: 'Days on market', value: '18' },
]

type Offer = {
  buyer: string
  amount: string
  status: string
  tone: PillTone
}

const offers: Offer[] = [
  { buyer: 'L. Uy', amount: '₱12.1M', status: 'New', tone: 'sky' },
  { buyer: 'K. Alonzo', amount: '₱11.6M', status: 'Countered', tone: 'brass' },
]

const activity: ActivityItem[] = [
  { id: 'offer-uy', icon: 'offer', text: <><b>L. Uy</b> submitted an offer</>, time: '2 hours ago' },
  { id: 'showing-alonzo', icon: 'tasks', text: <>Showing completed with <b>K. Alonzo</b></>, time: 'Yesterday' },
  { id: 'weekly-views', icon: 'search', text: 'Listing viewed 48 times this week', time: 'Weekly summary' },
]

export default function SellerDashboard() {
  return (
    <div className="text-left">
      <div className="mb-5.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="m-0 font-display text-[26px] font-medium tracking-[-0.01em] text-ink">Your listing at a glance</h1>
          <p className="mt-1 text-[13px] text-ink-soft">Here's how Maple Hills 8 is performing</p>
        </div>
        <button
          type="button"
          disabled
          title="Messaging is coming soon"
          className="inline-flex cursor-default items-center gap-1.75 rounded-sm border border-line bg-surface px-3.75 py-2.25 font-sans text-[13px] font-semibold text-secondary hover:bg-sky-dim"
        >
          <Icon name="message" /> Message agent
        </button>
      </div>

      <section aria-label="Listing performance" className="mb-4.5 grid grid-cols-[220px_minmax(0,1fr)] overflow-hidden rounded-md border border-line bg-surface shadow-panel compact:grid-cols-1">
        <div aria-hidden="true" className="min-h-40 bg-paper" />
        <div className="min-w-0 px-5 py-4.5">
          <h2 className="m-0 mb-1 font-display text-[19px] font-normal tracking-normal text-ink">House 8, Maple Hills</h2>
          <p className="mb-3.5 text-[12.5px] text-ink-soft">
            Listed ₱12.5M · Agent: R. Bautista · <StatusPill status="active" />
          </p>
          <dl className="m-0 grid grid-cols-2 gap-7 min-[600px]:grid-cols-4">
            {listingStats.map((stat) => (
              <div key={stat.label}>
                <dt className="mb-1 text-[11.5px] text-ink-faint">{stat.label}</dt>
                <dd className="m-0 font-display text-[20px] font-medium">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-4.5 compact:grid-cols-1">
        <Panel title="Offers" action={{ label: 'View all', to: '/seller/offer-tracker' }} accent="brass">
          <div className="overflow-x-auto" role="region" aria-label="Offers on your listing" tabIndex={0}>
            <table className="w-full min-w-[340px] table-fixed border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-[11.5px] text-ink-faint">
                  <th scope="col" className="w-[37%] px-4.5 py-3 font-normal">Buyer</th>
                  <th scope="col" className="w-[30%] px-4.5 py-3 font-normal">Amount</th>
                  <th scope="col" className="px-4.5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.buyer} className="border-b border-line-soft last:border-b-0">
                    <td className="px-4.5 py-3">{offer.buyer}</td>
                    <td className="px-4.5 py-3">{offer.amount}</td>
                    <td className="px-4.5 py-3"><Pill tone={offer.tone}>{offer.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent activity" action={{ label: 'View all' }} accent="brass">
          <ActivityFeed items={activity} />
        </Panel>
      </div>
    </div>
  )
}
