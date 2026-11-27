# Meridian CRM client

React, TypeScript, Vite and Tailwind frontend for the ASP.NET Core CRM API.

## Run locally

Start the backend HTTPS launch profile on `https://localhost:7116`, then:

```powershell
npm.cmd install
npm.cmd run dev
```

Keep `VITE_API_BASE_URL` empty. Vite proxies `/api` to the backend, configured by
`API_PROXY_TARGET` in `.env.local` (see `.env.example`). Production should serve
React and reverse-proxy `/api` on the same HTTPS origin, with frontend routes
falling back to `index.html`.

## Authentication

- `/` is the public home page; `/login` and `/signup` use the supplied Meridian reference.
- ASP.NET Core Identity manages passwords and protected HttpOnly session cookies.
- `AuthProvider` restores the account using `/api/auth/me`; no hardcoded role remains.
- The API client includes cookies and CSRF proof for write requests.
- Registration supports agent, buyer and seller; login opens the account's workspace.
- Logout is available in the desktop/mobile app shell.
- Password recovery is not implemented; the login page explains this.

Study the implementation, diagrams, database changes, setup and troubleshooting in
[the illustrated guide](../CRM/docs/authentication-guide.html) or
[the PDF](../CRM/docs/authentication-guide.pdf).

Agent Dashboard, Contacts, Listings, and Pipeline now use live API data. Contacts includes owner, status, and source. Properties use seller contacts; opportunities link buyers, properties, agents, and stages. Pipeline also logs activities and notes.

Buyer/seller dashboards and some navigation items remain presentation prototypes. The supplied ERD does not define a login-user-to-contact relationship for those portals.

See [the updated ERD guide](../CRM/docs/simplified-erd-guide.html) for the new schema, database migration, and workflow.

## Verify

```powershell
npm.cmd run build
npm.cmd run lint
```

