# Backend API services

Request and response types match the simplified ERD and the backend DTOs. JSON uses camelCase. Every CRM service exposes `getAll`, `getById`, `create`, full `update` (PUT), and `delete`; each accepts optional `{ signal }` cancellation.

| Folder | Export | Route |
| --- | --- | --- |
| activities | activitiesService | /api/Activities |
| contacts | contactsService | /api/Contacts |
| notes | notesService | /api/Notes |
| opportunities | opportunitiesService | /api/Opportunities |
| pipeline-stages | pipelineStagesService | /api/PipelineStages |
| properties | propertiesService | /api/Properties |
| roles | rolesService | /api/Roles |
| users | usersService | /api/Users |

There is no separate Leads service or endpoint. An inquiry starts as a Contact with type `Prospect`, status `New`, source, and owner. The allowed contact types are `Prospect`, `Buyer`, and `Seller`; status and source are editable strings, not enums specified by the ERD.

## Run locally

Start the backend HTTPS launch profile on https://localhost:7116, then run `npm.cmd run dev`. Keep `VITE_API_BASE_URL` empty; Vite proxies `/api` to `API_PROXY_TARGET` (see `.env.example`). Production should serve React and proxy `/api` on the same HTTPS origin.

Auth uses ASP.NET Core Identity and HttpOnly cookies. `apiClient` includes cookies, fetches CSRF proof, adds `X-CSRF-TOKEN` to writes, and clears the React session on protected 401 responses. CRM data endpoints allow agents/admins; Users and Roles mutations require admin. Buyer/seller screens remain presentation prototypes.

## Create a seller contact, then a property

```ts
import { contactsService, propertiesService } from '../../services'

// Use an existing user's ID for ownerId and an existing agent's ID for listingAgentId.
const seller = await contactsService.create({
  firstName: 'Sam', lastName: 'Owner', email: 'sam@example.com',
  type: 'Seller', status: 'Active', source: 'Referral', ownerId: 1,
})
const property = await propertiesService.create({
  address: '123 Sample Street', price: 4200000, bedrooms: 2,
  status: 'Active', sellerContactId: seller.id, listingAgentId: 1,
})
```

`SellerContactId` points to Contacts, never Users. Signing up as Seller creates a login account; it does not automatically create a CRM contact. `sellerContactsService` filters `/api/Contacts` by type Seller or Both; `assignedAgentsService` filters `/api/Users` by role agent.

## Required relationships

- Contacts require `ownerId`, `status`, and `source`, as well as first name and type. Last name can be empty for a person with one name; email may be null.
- Properties require `sellerContactId`, `listingAgentId`, and a nonnegative integer `bedrooms`. Status is Active, UnderContract, or Sold. An unknown legacy bedroom count migrates to zero, with the original value archived in a note.
- Opportunities require buyer contact, property, agent, stage, and offer amount. The backend validates the contact's Buyer type and the user's agent role.
- Activities require both contactId and opportunityId, plus type and a UTC ISO date-time (`new Date().toISOString()`). There is no leadId.
- Notes use authorId, entityType, entityId, and body. This is a polymorphic association: EntityType + EntityId identifies a record; EntityId is not one database foreign key to every possible table.
- PUT sends all required fields. A property update cannot clear its seller. Old `sellerUserId` / `leadId` fields are rejected, not silently ignored.
- `ApiError` exposes status, parsed response body, and field validation errors. Pages display these messages and allow retries.

## Connected pages

Agent Dashboard reads real workspace totals and activities. Contacts supports create/edit/search and the new ownership/lifecycle fields. Listings reads persisted properties, searches/filters, exports CSV, and opens AddPropertyForm. The property form collects exactly the persisted ERD fields; photos, descriptions, bathrooms, area, property type, and a separate property name are not in this schema. Pipeline supports stages, opportunities, stage updates, activity history, and notes.

See [the illustrated schema guide](../../../CRM/docs/simplified-erd-guide.html) for relationships, migration decisions, backup, and verification instructions.
