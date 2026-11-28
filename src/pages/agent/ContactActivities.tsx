import Panel from '../../components/Panel'
import { contactName } from '../../services'
import type { ContactResponse } from '../../services'
import type { AssignedAgent } from '../../services/users/assignedAgentsService'
import ActivityWorkspace from './ActivityWorkspace'

export default function ContactActivities({ contact, onClose, onChanged }: { contact: ContactResponse; agents: AssignedAgent[]; onClose: () => void; onChanged?: () => void | Promise<void> }) {
  return <Panel title={`Activities · ${contactName(contact)}`}><div className="min-w-0 space-y-5 p-5"><div className="flex flex-wrap justify-between gap-3"><p className="text-[13px] text-ink-soft">New entries attach to this Contact only. Linked work is retained in its history.</p><button type="button" onClick={onClose} className="text-[13px] text-secondary underline">Close activities</button></div><ActivityWorkspace target={{ contactId: contact.id }} onChanged={onChanged} /></div></Panel>
}
