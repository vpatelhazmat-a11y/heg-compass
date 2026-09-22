# Odoo-style rebuild: Phases 1 and 2

This release recovers the unfinished launcher and record-navigation work from
the earlier local task and integrates the Architecture Stabilization Sprint.
It does not change database tables, roles, or production records.

## Delivered

- A twelve-module app launcher replaces the sidebar, with a compact workspace
  header, global search, account menu, and an activity menu linking to existing
  tasks and the daily overview.
- Existing customer, site, and equipment pages remain the primary master-record
  pages. Lists now open supporting records, including bids, rates, refused loads,
  contacts, products, lanes, contracts, opportunities, assessments, incidents,
  corrective actions, documents, tasks, requirements, and equipment history.
- Linked fields open related records. Customer, site, and equipment smart buttons
  show scoped counts and open matching lists, using existing access policies.
- Authorized users can edit supporting records. Rate revisions keep the
  timestamp/reason RPC; equipment assignment identity stays immutable. Archived
  parents remain visible for existing links but cannot be chosen as new parents.
- Site assessments are accessed from sites and their own launcher module rather
  than the Safety screen. Refused Load analysis is part of its dashboard; old
  analysis URLs redirect there. Loading failures retain error and retry states.
- Existing history, permissions, schema constraints, and signup restrictions are
  preserved. Invalid generic record types cannot query arbitrary tables.

## Test paths

1. Open Apps, then Bids / RFPs. Open a bid, follow its customer link, and return.
2. Open a customer, select Sites or another smart button, and open a listed record.
3. Open a site and its Assessments, Contacts, and Equipment lists. Counts and
   lists use the same relationship rules; current equipment excludes archives.
4. Open a rate, inspect history, then edit with a reason. Stale saves must ask
   for refresh. Management and Read Only must have no editing controls.
5. Open Refused Loads. Dashboard includes revenue analysis; Records opens a
   detail page with the existing refused-load editor.
6. Use keyboard navigation and a narrow viewport to reach the launcher, search,
   account menu, record links, and related-record buttons.

Automated tests cover record/schema agreement, invalid paths, scoped lists,
read-only controls, rate revision payloads and stale-save errors, relationship
navigation, accessible links, launcher destinations, and query failure states.

## Remaining phases

Chatter and mentions, rich notes/attachments, a hierarchical document library,
guided import/export, custom reporting, notification delivery and digests,
expanded administration, and equipment pricing remain subsequent phases.
The activity menu is navigation to existing work; it is not a notification feed.
Settings remains the existing account/settings screen, with administration
available to admins. Existing CSV exports remain; guided import is not included.
