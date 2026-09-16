# Odoo-style rebuild of the HEG Hub

Adopt Odoo's working model: an app launcher home screen, modules with list/form views, every linked field clickable, smart buttons, a chatter on each record, notes with rich text and attachments, guided import/export, a document library mirroring the record tree, and a customizable report builder.

Delivered in phases so each one is usable on its own. No fabricated HEG data; existing DEMO records stay labelled.

## Phase 1 — Navigation and shell

- Replace the sidebar with an Odoo-style **app launcher home screen**: a grid of module tiles (Customers, Sites, Site Assessments, Equipment, Bids/RFP, Refused Loads, Safety, Documents, Knowledge, Tasks, Reporting, Settings).
- Inside a module, a slim top bar holds the module name, a breadcrumb, the launcher button, global search, activity/notification bell, and the user menu.
- Sites stops being a top-level menu item: sites are reached from a customer record. Sites and Site Assessments still get their own modules for cross-customer lists (recommended — they need standalone search and reporting), but the customer record remains the primary path.
- Site Assessments moves out of the Safety/Incidents module and lives under Sites.
- Refused Loads keeps a single Dashboard entry; the Lost Revenue analysis is folded into it as sections/tabs of one dashboard.

## Phase 2 — Records become navigable

- Every list row opens a record page. Bids/RFP gets a full record page (view + edit) — currently rows are dead ends. Same for rates, refused loads, incidents, assessments, tasks, documents, contacts, lanes, products, contracts.
- Every relational field renders as an internal link with the Odoo arrow, jumping to the linked record.
- **Smart buttons** across the top of each record showing live counts of related records (a customer shows Sites, Bids, Rates, Refused Loads, Incidents, Documents; a site shows Assessments, Equipment, Contacts, Incidents), each opening that filtered list.

## Phase 3 — Chatter

A chatter panel on every record, matching Odoo behaviour:

- Message log with author, timestamp and record-change tracking entries (field X changed from A to B).
- Internal notes vs. messages, with `@mention` of internal users.
- **Activities**: schedule a to-do/call/reminder with a type, due date and assignee; overdue and today states; marking done writes to the log.
- Followers list, so mentioned or subscribed users receive notifications.

New tables: `mail_messages`, `mail_activities`, `mail_followers`, plus reuse of the existing `audit_log` for tracked field changes.

## Phase 4 — Notes tab and attachments

- A rich-text Notes tab on every record: headings, bold/italic, lists, links, images, tables, and inline file attachments.
- Attachments upload to backend storage and are automatically registered in the Documents module.

## Phase 5 — Documents module

- A document library that mirrors the record tree: Module → Record → Documents, with a folder-style browser plus a flat searchable list.
- Filters by module, record, type, owner, expiry. Expiring-document alerts feed the notification digest.
- Uploading from a record files it in the right place automatically; uploading in Documents lets you attach it to any record.

## Phase 6 — Import / Export per module

An Odoo-style import screen for every module:

- Download a template (CSV/XLSX) with the module's columns and a second sheet of instructions and allowed values.
- Upload → column mapping screen with auto-matched headers → validation preview showing row-level errors and warnings → import with create/update matching on a chosen key.
- Results recorded in the existing import batch/staging tables, with provenance on every imported row and a rejects file to download.
- Export honours the current list filters and column selection.

## Phase 7 — Reporting engine

A customizable report builder, Odoo style:

- Pick a source (any module), then group, filter, measure and pivot; switch between list, pivot, bar/line/pie and kanban views.
- Save views as named reports, mark favourites, share with roles, export to CSV/XLSX.
- Refused Loads dashboard and existing reports rebuilt on this engine so they are editable rather than hardcoded.

## Phase 8 — Notifications and digests

- In-app notification centre (bell) for mentions, assigned activities, due dates, RFP deadlines, expiring documents and contracts.
- Email notifications for the same events.
- Per-user digest preference (daily/weekly/monthly) plus a general daily Refused Loads digest.
- Scheduled server job sends digests; each user controls their subscriptions in their profile.

## Phase 9 — Settings (replaces Administration)

A General Settings module with sections:

- Users & invitations, roles and granular permissions per module (read/write/delete).
- Lookup/dropdown value management for every picklist.
- Email and notification templates (editable subject/body with field placeholders).
- Import templates, document types, activity types, tags.
- Audit log viewer, data quality queue, backend health.

## Phase 10 — Equipment rates

- Optional rate fields on equipment: lease rate to a customer and maintenance rate, each with amount, unit, currency, effective/expiry dates, and a link to the customer and contract.
- Shown on the equipment record and rolled into rate reporting.

## Additional improvements included

- Saved filters and favourites on every list, plus a shared "team views" concept.
- Archive instead of delete everywhere, with an Archived filter.
- Tags on records for lightweight cross-module grouping.
- Keyboard-first global search that returns records across all modules.
- A per-record "Related" panel showing every record that points at it, so nothing is orphaned.

## Technical notes

- Chatter, activities, followers, tags, notes and attachments are implemented once as generic, polymorphic tables keyed by `(entity_type, entity_id)` and rendered by shared components, so every module gets them without per-module work. The existing `src/lib/relations.ts` scope helpers are extended into a single module registry (table, label, icon, route, columns, relations, smart buttons, import schema) that drives navigation, lists, forms, import/export and reporting from one definition.
- All new tables ship with grants, row-level security and role-based policies matching the current model; audit triggers extend to new tables.
- Rich text is stored as sanitized HTML; attachments go to backend storage with signed access.
- Digests run on a scheduled server job hitting a protected endpoint.

## Sequencing

Phases 1–3 first (shell, clickable records + smart buttons, chatter) — they change how everything feels. Then 4–6 (notes, documents, import/export), then 7–10.

I will start with Phase 1 and 2 after approval and report back at each phase boundary.
