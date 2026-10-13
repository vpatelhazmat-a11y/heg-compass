# ERP delivery checklist

This is the remaining delivery plan, reconciled against the original ten-phase request. Passing automated tests or checking module landing pages does not establish completion of this plan. Implementation, local verification, production publication, and user acceptance are separate gates.

## Active delivery objective

The user's instruction on 2026-10-12 is to finish the entire approved app makeover and continue through the remaining work, rather than stopping at individual refinement passes. Every area below remains part of the objective until its implementation, checks, publication and acceptance gates are satisfied. Preserve business data, access controls and user launcher ordering. Do not mark the app complete while unsupported workflows or acceptance gaps remain.

The native goal already covers the full ERP refurbishment, but the goal service currently reports it as usage-limited and rejects replacement while it is unfinished. Its continuation limit must be reset by the user or system; this checklist records the requested objective without claiming that the native goal was reactivated.

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

## Report workspace refinement

- Configurable Analysis preserves Summary on a separate tab. Registered sources are filtered by role; grouping, search, exact group filters, record counts, revenue totals/averages, table/bar views and CSV/XLSX export operate on the same accessible records.
- Configurations live in the URL and personal views can be saved on this device. Missing revenue does not become zero in averages; blank grouping values retain a distinct key.
- Every supported projection was checked against the complete migrated database. Shared views, pivot/multiple grouping, dates, equipment rate-history measures and server-side aggregation for large datasets remain open.
- PR #47 passed 153 tests and hosted CI and was merged and published; the production People and Invitations sections were verified. Browser interaction is intermittent, so broader settings and creation-layout acceptance remains pending.

## Creation consistency and Refused Load navigation

- PR #49 unifies master-list creation with the shared full-page record workspace. Supplied field labels and required links are preserved; relationship loading supports retry and cancellation. Explicitly disabled and archived creation cannot fall back to a generic New action.
- Refused Load entry adopts the same layout and flat field styling. Entry from its list preserves the filtered list URL for Cancel and the saved record breadcrumb. External return URLs fall back to the app list. Save-and-enter-another remains on the entry page.
- PR #49 passed 167 tests and hosted CI and was merged. Lovable publication was requested; new production visual acceptance remains pending.
- PR #48 reporting passed 164 tests and hosted CI, merged, and publication was requested. Earlier production checks confirmed Refused Loads shows message/note chatter without unsupported Activity controls, and Users and access separates People and Invitations. No live business records were changed.
- The broader remaining plan above is still open. These layout passes do not complete all-record activities, mentions/followers, imports, shared reporting, rich-note assets, notification delivery or general configuration.

## Module navigation access

- Module menus filter record destinations by the same role-based read rules used elsewhere in the interface. Database policies remain authoritative; no access grants are changed.
- Settings exposes Users and access only for administrators. Equipment agreements now remain in the Equipment module and appear in its navigation, including nested record routes.
- PR #50 passed 171 tests and hosted CI, merged, and publication was requested. Live visual acceptance of PRs #48–50 remains pending because browser control is unavailable in this session.

## Refused Load choice recovery

- Record and lookup loads expose loading and recoverable failure states instead of silently appearing empty. Text drafts remain editable and intact during loading and retry; saves wait until choice loading is complete.
- Retry controls explicitly use button semantics, so retrying within a form cannot submit the draft. Existing validation, historical choices and duplicate-save protection remain covered.
- No database migration or live business-data write is included.

## Shared Odoo-style list controls

- Module lists, local tables and report analysis use one accessible search dropdown with Filters, Group By and Favorites, following Odoo's documented search organization: https://www.odoo.com/documentation/18.0/applications/essentials/search.html.
- Favorites preserve their existing account/device storage and error handling; applying a favorite closes the menu and restores focus. Separate favorite toolbar icons are removed from these workspaces.
- Module paging moves beside view controls. Filter/group tags sit inside the search field. Failed module lists can retry while retaining search and grouping. Empty states use plain text and optional supplied artwork instead of generic dashed cards.
- Automated interaction and regression checks cover the shared behavior. A temporary sample-data preview was prepared but not visually verified because desktop control was interrupted. No new production visual acceptance is claimed.
- No database migration or live business write is included. Shared/cloud views, advanced report modes, imports, notifications and the other remaining gates above are still open.

## Column controls refinement

- Master and generic module lists use the same column chooser. Choices persist per account and module on this device; personal favorites capture the visible fields. At least one column stays visible. Grouping still operates when its field is hidden.
- CSV exports follow the visible columns. Generic exports remain explicitly limited to the current page, rather than claiming a complete filtered dataset. Storage failures retain the active selection and show a recoverable explanation.
- Local verification: 182 tests passed, type/schema/generated-link checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live data changes. Publication and production acceptance remain separate gates.

## Documents workspace consistency

- Document creation now uses the shared full-page record workspace with breadcrumbs and flat fields. Cancel returns to the active list; failed saves keep the draft and inherited parent link.
- Attachment checks distinguish a returned storage request failure from a missing/inaccessible file. Retry stays available without offering an upload for an unchecked attachment. Signed downloads and server access policies are unchanged.
- Local verification: 185 tests, type checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live data changes. Production acceptance remains pending.

## Notes control refinement

- Secondary formatting is available in a compact menu using already-supported note nodes and marks. Undo/Redo reflect editor history. Toolbar arrows/Home/End and link Enter/Escape/Cancel support keyboard editing without submitting the surrounding record form.
- 186 tests, type checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration. Images/tables/attachments and production visual acceptance remain open.

## Selected-record export

- Module lists now have page-scoped selection and CSV/XLSX export of selected rows or the current page, using the chosen visible columns. Selection clears when the query, page, view or account changes; embedded related lists remain compact. Export failures keep the selection and offer another attempt through the list menu.
- After the execution limit reset, all 188 tests, type/schema/generated-link checks, lint (zero errors; 12 existing warnings), production build, diff checks and hosted CI passed. PR #57 was merged and publication requested. Production acceptance remains pending.
- Notes PR #56 passed hosted CI and was merged. Its Lovable publication was requested. Production visual acceptance remains pending.

## Report date filtering

- Registered date fields support inclusive, open-ended calendar ranges. The same range governs counts, measures, table/bar rendering and exports. Invalid calendar dates are rejected; reversed ranges show an error and disable export.
- Date field and bounds are preserved in the URL and personal report favorites. Only whitelisted source columns are queried. Every supported date projection was checked against the migrated schema.
- Local verification: 192 tests, type/schema/generated-link checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live data changes. Publication and production acceptance remain separate gates.

## Rate history refinement

- Commercial and equipment rate histories share compact embedded tables and retry failed loads. Amounts use the currency in each stored snapshot; legacy entries without a recorded currency are identified instead of being silently labeled USD. Dates are readable and zero amounts stay visible.
- Local verification: 194 tests, type checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live rate saves. Production acceptance remains pending.

## Settings and activity navigation

- Settings tabs are URL-addressable and preserve unsaved account drafts across tab changes. Failed alert-preference storage leaves the existing setting intact and displays a retryable error.
- Activity loading offers retry. Activity links use the app router and retain the originating screen in the return breadcrumb rather than reloading the whole document.
- Local verification: 197 tests, type/schema/generated-link checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live account changes. Production visual acceptance remains pending.

## Grouped-list refinement — 2026-10-13

- List groups collapse/expand through keyboard-accessible headers. Counts are explicitly limited to the current page. Collapsing a group clears its row selection, and page selection skips collapsed rows; filtering and view switching continue to use the underlying records.
- Local verification: 198 tests, type checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live data changes.
- PR #60 was merged, synced to Lovable and publication requested. The user requested cloud-only visual checking; desktop automation is excluded. Production visual acceptance remains pending because this session has no isolated cloud browser.

## Notes focus integration — 2026-10-13

- Record Notes stays mounted while its formatting menu receives focus. Menu cleanup avoids focusing an editor that has already been destroyed. The regression opens the menu inside a record form, applies formatting and verifies the saved rich-note payload.
- Local verification: 199 tests, type checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live saves. Production visual acceptance remains pending.

## Record keyboard saving — 2026-10-13

- Ctrl/Cmd+S in an active record form uses its existing validation and save path. Pending requests cannot be repeated, clean existing records are not resaved, and read-only forms do not submit through the shortcut. The visible save action advertises the shortcut without adding another control.
- Local verification: 201 tests, type checks, lint (zero errors; 12 existing warnings), production build and diff checks passed. No database migration or live saves.
- PR #61 (group collapse) and #62 (Notes focus integration) passed hosted CI and were merged; publication was requested after Lovable synced each merge. Production visual acceptance remains pending.

## Isolated cloud UI checks

- A separate sample-data harness renders the real shell, launcher, customer list, record form and Notes editor. Its data adapter is memory-only; the harness is outside production routes and uses a separate Vite configuration.
- GitHub’s isolated Linux runner will capture desktop/mobile screens and check Notes menu behavior. The browser blocks and reports unexpected external requests, so it cannot contact the production database. No desktop automation or production authentication state is used.
- Fixture type checking, offline bundle compilation, regular CI and cloud browser checks passed. Eight desktop/mobile screenshots were retrieved and launcher/list/record layouts were visually reviewed. No unexpected external requests or uncaught browser errors occurred. PR #64 was merged. These synthetic-data checks do not replace production role/data acceptance.

## Compact list filters — 2026-10-13

- Archive visibility now lives in Search options instead of occupying its own toolbar row. Archived lists show a removable search facet, and personal favorites preserve archived/active visibility. Older favorites retain their active-record default.
- The cloud harness now renders the application’s actual master-list component and captures its filter menu on desktop/mobile. Local verification: 202 tests, app/fixture type checks, lint (zero errors; 12 existing warnings), production and fixture builds, and diff checks passed. Cloud screenshots and publication remain pending for this pass.
