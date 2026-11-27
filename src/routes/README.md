# Role routes and sessions

`AppRoutes.tsx` defines public `/`, `/login`, and `/signup` pages and protected
agent, buyer and seller workspaces. `AuthProvider` restores the signed-in account
from `/api/auth/me`. `RoleGuard` waits for restoration, sends anonymous users to
login, and redirects mismatched roles to their own dashboard. An admin opens the
agent workspace, as does a Manager. Backend authorization independently checks API permissions.

| Role | Dashboard | Other pages |
| --- | --- | --- |
| Agent | `/agent/dashboard` | `/agent/listings`, `/agent/pipeline`, `/agent/contacts` |
| Manager / Admin | `/agent/dashboard` | Staff workspace with active-Agent assignment controls |
| Buyer | `/buyer/dashboard` | `/buyer/saved-searches` |
| Seller | `/seller/dashboard` | `/seller/offer-tracker` |

`RoleLayout` supplies navigation and the actual account name to `AppShell`, which
provides desktop/mobile logout. `App.tsx` no longer supplies a temporary role.

Agent Dashboard, Contacts, Listings, and Pipeline load API data. Contacts captures Buyer, Seller, or Both with email or phone, fixed source choices, server-derived status, and optional manual inactivity. Visible duplicates offer deliberate reuse through **Open existing contact**. Its **Activities** panel records Contact-only qualification and assigned tasks before an opportunity exists.

Listings saves new properties as Draft with City and Property type, then publishes an owned listing as Available after a positive price is supplied. Seller choices include Seller/Both Contacts. Agents use server-default ownership; Managers/Admins select an active Agent. Pipeline creates Open opportunities at the fixed Inquiry stage with the buyer's owner as the Agent default. Later-stage controls remain existing functionality and are outside the verified Part01 workflow. See [Part01 implementation contracts](../../../docs/development/part01-implementation.md).

Buyer/seller dashboards, saved searches, and offer tracker remain presentation prototypes; some navigation items are placeholders.

Theme tokens live in `index.css`. Deployment must serve `index.html` for frontend
routes and reverse-proxy `/api` to .NET on the same HTTPS origin.

See [the illustrated authentication guide](../../../CRM/docs/authentication-guide.html)
for the complete React/.NET flow and setup.



