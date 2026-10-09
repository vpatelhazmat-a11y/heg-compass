# ERP delivery checklist

This is the remaining delivery plan, reconciled against the original ten-phase request. Passing automated tests or checking module landing pages does not establish completion of this plan. Implementation, local verification, production publication, and user acceptance are separate gates.

## Published layout refinement and current document pass

- Implemented locally: secondary related-record lists derived from the database foreign keys; collapsed Related records sections on master and generic record forms; scoped links including lanes connected through either site endpoint; requirements scoped by record kind and identifier.
- Implemented locally: active-colleague activity assignment, Today/Overdue labels, local calendar completion dates, and task/list/count refresh after activity changes.
- Verification: 124 tests, type/schema/generated-link checks, lint and build passed. Production customer counts, scoped lane navigation, return breadcrumb and active-assignee choices verified; no live test records were saved. Other record/device/role workflows remain acceptance gates.
- Publication: PR #40 merged and published to Lovable on 2026-10-06.
- No database migration in this pass. Existing access policies continue to govern all reads and writes.

- PR #41 flattened Notes; PR #42 unified master and generic record layouts, placed Related records inside the record column, and removed duplicate form padding and boxed source disclosures. PR #42 passed 126 tests and hosted CI; the published customer record was checked in the browser.
- Current implementation expands document folders to eight registered parent kinds, respects role visibility, adds folder search/paging/retry, and preserves canonical document associations. Attachment checks and signed-download failures show recoverable states.
- Saved views now use the shared accessible popover and retain the visible saved list when storage writes fail. Views remain personal and device-local.
- These changes do not complete all-record attachment support, shared views, notifications, imports, or the broader original plan. No database migration is included.

## Current pass — creation from record lists

- Full-workspace creation is implemented for 20 registered record types, with parent links, customer-dependent relation choices, recoverable choice loading, and permission checks. Refused Loads, Documents, and Requirements retain their dedicated creation paths.
- Inherited visible links are initial values, so clearing or changing a relationship does not silently restore the previous parent during saving. Failed saves preserve the draft.
- Local verification includes minimum-valid inserts for all 20 forms against the complete migrated schema in a rolled-back trial. Live business records are not created for acceptance.
- All-record chatter, rich-note assets, guided imports, reporting, notifications, and settings remain open below.

## Published pass — expanded record threads

- Messages, notes, and readable field-change tracking are implemented for 24 record kinds (all registered generic types plus Drivers), with generated parent foreign keys and record-specific read/write checks. Document classification and linked-parent restrictions are enforced; archived records are read only.
- Existing activity links remain limited to the original nine kinds. The new thread controls wait for the database capability before appearing; this does not complete mentions, followers, notifications, or all-record activities.
- 148 tests passed in the full suite; a further migration-preservation trial passed against a seeded local database. Type/schema/relation checks, lint (zero errors; 12 existing warnings), build, and diff checks passed.
- The user approved the rollback trial and persistent migration. The live trial passed and rollback was independently confirmed. The applied migration has 24 tracking triggers and 24 generated message-parent keys; the existing message count remained one. PR #46 was merged and publication requested. Live browser acceptance remains pending.

## Remaining original-plan work

| Area                           | Remaining work and acceptance gate                                                                                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launcher and navigation        | Review every module and record workflow against the shared layout. Mouse hold/drag persistence was accepted by the user; physical touch/pen acceptance remains. Preserve user ordering.                                                                        |
| Record pages and relationships | Verify all registered record types, editable relations, live counts, return paths, creation flows, empty/error states, and keyboard operation. New secondary links require production checks.                                                                  |
| Chatter                        | Messages, notes and change tracking support 24 record kinds. Activities still support the original nine kinds. Mentions, followers, typed activities and notification delivery remain incomplete; production acceptance across records and roles remains open. |
| Rich notes                     | Formatting exists, but image/table/attachment workflows and storage registration need end-to-end verification across record kinds.                                                                                                                             |
| Documents                      | Complete module/record folder navigation, record upload association, attach-to-any-record flows, owner/type/expiry filters and deadline alerts. Verify signed access and role restrictions.                                                                    |
| Imports and exports            | Complete the guided CSV/XLSX template, mapping, validation, matching, provenance and rejected-row workflow; filtered column-selected export.                                                                                                                   |
| Reporting                      | Complete and verify report source/filter/group/measure configuration, saved/shared views, supported renderers and spreadsheet export.                                                                                                                          |
| Notifications                  | Complete mentions, assignment/due/deadline delivery, subscriptions, email/digests and scheduled processing; test with distinct accounts.                                                                                                                       |
| General Settings               | Complete users/invites, granular roles, lookups, templates, document/activity types, tags, audit, data quality and system health.                                                                                                                              |
| Equipment                      | Verify lease/maintenance rate history and report integration, including save failures and permissions.                                                                                                                                                         |
| Cross-cutting                  | Team views, archive consistency, tags, keyboard navigation, role matrix, foreign-key enforcement and signed file access require a full acceptance matrix.                                                                                                      |

## Definition of done

Each workflow must have a concrete supported implementation, relevant checks, a published build, and production acceptance evidence. Unsupported controls must not appear functional. Changes requiring broader database support need a reviewed migration and appropriate authorization before live application. Remaining gaps stay on this checklist; a successful refinement pass does not close the whole plan.

## Settings workspace refinement

- People, Invitations and Change log occupy separate URL-addressable tabs. Invitation drafts survive tab changes and failed sends; navigation draft protection remains active.
- Administration tables load only for the selected section and provide recoverable retry controls. The global settings link leads administrators to Users and access and other users to Personal settings.
- This pass does not complete granular role editing, lookup administration, notification preferences or system health.
