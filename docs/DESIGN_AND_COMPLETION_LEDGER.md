# HEG Compass design and completion ledger

## Design direction approved September 22, 2026

Odoo-inspired plum, white, and colorful original app icons. Reference: [Odoo view architecture](https://www.odoo.com/documentation/master/developer/reference/user_interface/view_architectures.html). The goal is a consistent working application with distinct app, list, and record contexts.

### This design release

- Apps is a dedicated launcher. Daily overview is a separate destination.
- Twelve original SVG module glyphs and a Compass mark share a 48-unit drawing grid.
- Plum global header, contextual module menus, white work surfaces, restrained borders, consistent buttons and tabs.
- Searchable app grid; six, four, and three columns at desktop, tablet, and phone widths.
- Shared list toolbar, visible result count, quieter column headings, consistent row spacing and pagination.
- Supporting records use sectioned sheets, readable dates, precise monetary amounts, status labels, and compact related-record buttons.
- Customer, site, and equipment pages share constrained content widths and the same tab treatment. Customer summary figures live inside Overview.
- Refused Loads has one module menu, with Summary and Revenue Analysis as dashboard tabs.
- Wider grouped edit forms, keyboard focus indicators, skip-to-content link, reduced-motion support, and plum dark-theme tokens.

No schema, role, or production-record changes belong to this release. Local visual fixtures are not published.

## Original plan: actual completion status

| Phase                         | Status                         | Work still required                                                                   |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| 1. Navigation and shell       | Implemented, visually rebuilt  | User acceptance of the new visual system; notification delivery is phase 8            |
| 2. Navigable records          | Foundation implemented         | Broaden record-specific related actions and validate every module with real workflows |
| 3. Chatter                    | Not implemented                | Messages, internal notes, tracking, mentions, activities, followers, access policies  |
| 4. Rich notes and attachments | Not implemented                | Sanitized editor, uploads, storage authorization, document registration               |
| 5. Document library           | Basic record list only         | Hierarchy, filters, uploads and automatic record filing                               |
| 6. Import/export              | Existing CSV export only       | Templates, mapping, validation preview, staging, matching, reject downloads           |
| 7. Reporting engine           | Existing fixed reports only    | Configurable sources, grouping, measures, pivots, saved/shared reports                |
| 8. Notifications and digests  | Navigation menu only           | Notification centre, subscriptions, delivery, protected scheduler                     |
| 9. General Settings           | Existing account/admin screens | Granular configuration, template management, lookups and health controls              |
| 10. Equipment rates           | Not implemented                | Rate model, dates, customer/contract links and reporting                              |

Cross-cutting saved views, tags, comprehensive related panels, and consistent archive workflows are also unfinished. They must not be described as delivered.

## Next implementation sequence

1. Finish user acceptance and remaining record-navigation gaps in the shared design.
2. Build phase 3 as a reusable record conversation/activity system, with migrations, permission tests, and no unsolicited outbound messaging.
3. Build phases 4–6 around authorized storage and a shared import pipeline.
4. Build phases 7–10 with explicit reporting, notification, and administration acceptance paths.

## Release verification

- App grid and search checked in local desktop and 390px phone previews.
- Shared table and actual record-sheet components reviewed using local, clearly labelled fixtures.
- Release checks must cover schema/type/lint/tests/build and navigation on the published app.
- Live role switching and destructive/writing operations are not part of visual verification.

## Workspace refinement — September 23

- Compact desktop module menus in the plum header, with a separate mobile menu.
- Saturated custom app icons and a simpler Applications launcher.
- Two-column record sections and inline editing for supporting records; dedicated master-record and Refused Loads editors remain.
- Table column selection, visible-column CSV export, and compact toolbar paging. Column choices last for the current mounted table only.
- Regression coverage for inline cancel, required rate reasons, filtered paging, and keeping at least one column visible.
- This refinement does not complete phases 3–10 above.

## Interaction refinement — September 23

- Odoo interface research and HEG-specific decisions are recorded in [ODOO_UI_RESEARCH.md](ODOO_UI_RESEARCH.md).
- Supporting records open with directly editable fields. Save and Discard appear only after a change; rates still require a fresh reason and use the revision operation.
- The launcher has no visible search box. Typing on the page opens combined app and primary-record search, with Ctrl/Command+K as an alternative.
- Smart buttons sit in the record header; breadcrumbs include a direct back control.
- Customer, site, and equipment records have directly editable fields in their primary tab. Further related tabs, saved searches, grouping, and remaining original phases are still pending.
